"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireCaptain, requireHandicapCommittee } from "@/lib/auth";
import { createPlaceholderHoleSetup } from "@/lib/course-defaults";
import { fixtures } from "@/lib/fixtures-data";
import { currentSeason } from "@/lib/key-members-data";
import {
  approveMember,
  deleteMember as deleteStoredMember,
  removePendingMember,
  reassignMemberEmailLink as reassignStoredMemberEmailLink,
  updateMemberHandicap as updateStoredMemberHandicap,
  updateMemberRole as updateStoredMemberRole,
} from "@/lib/member-store";
import { members as sourceMembers } from "@/lib/members-data";
import { prisma } from "@/lib/prisma";
import { calculateStablefordHoleScore, getStrokesReceivedForHole } from "@/lib/scoring";

const DEMO_SPONSOR_FLAG = "__DEMO_SEED__";
const DEMO_COURSE_NAME = "[Demo] Imperial Society Course";
const DEMO_HISTORY_REASON_PREFIX = "demo seed";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalDateValue(formData: FormData, key: string) {
  const raw = getTrimmedString(formData, key);

  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${key}.`);
  }

  return parsed;
}

function assertConfirmationPhrase(formData: FormData, expected: string) {
  const confirmation = getTrimmedString(formData, "confirmation").toUpperCase();

  if (confirmation !== expected) {
    throw new Error(`Please type ${expected} to confirm this action.`);
  }
}

function getNumberValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid value for ${key}.`);
  }

  return value;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDemoOutingDate(index: number) {
  const outingDate = new Date();
  outingDate.setHours(12, 0, 0, 0);
  outingDate.setDate(14);
  outingDate.setMonth(outingDate.getMonth() - (9 - index));

  return outingDate;
}

function getDemoHistoryValue(currentHandicap: number, outingIndex: number, memberIndex: number) {
  const offsets = [-1.4, -0.9, -0.5, -0.1, 0.4, 0.8, 0.6, 0.3, 0.1, 0];
  const direction = memberIndex % 2 === 0 ? 1 : -1;
  const memberVariation = ((memberIndex % 4) - 1.5) * 0.2;

  if (outingIndex === offsets.length - 1) {
    return roundToSingleDecimal(currentHandicap);
  }

  return roundToSingleDecimal(
    clamp(currentHandicap + direction * offsets[outingIndex] + memberVariation, 0, 54),
  );
}

function getDemoGrossStrokes(input: {
  par: number;
  holeNumber: number;
  outingIndex: number;
  memberIndex: number;
  handicapIndex: number;
  strokeIndex: number;
  twosAssigned: number;
}) {
  const strokesReceived = getStrokesReceivedForHole(
    input.handicapIndex,
    input.strokeIndex,
  );
  const hash = (input.outingIndex * 17 + input.memberIndex * 11 + input.holeNumber * 5) % 18;
  const targetPointsPattern = [1, 2, 2, 1, 2, 2, 2, 1, 2, 2, 3, 1, 2, 0, 2, 1, 2, 3];
  const formBoost = (input.outingIndex + input.memberIndex) % 6 === 0 ? 1 : 0;
  const formDrop =
    (input.outingIndex * 3 + input.memberIndex + input.holeNumber) % 8 === 0 ? 1 : 0;
  const rareTwoTrigger =
    input.par === 3 &&
    input.twosAssigned < 2 &&
    (input.outingIndex * 13 + input.memberIndex * 7 + input.holeNumber * 3) % 37 === 0;

  if (rareTwoTrigger) {
    return 2;
  }

  const targetStablefordPoints = clamp(
    targetPointsPattern[hash] + formBoost - formDrop,
    0,
    input.par === 3 ? 3 : 4,
  );
  const grossStrokes = input.par + 2 - targetStablefordPoints + strokesReceived;

  return clamp(grossStrokes, 2, input.par + 5);
}

async function removeSeededDemoDataInternal() {
  await prisma.outing.deleteMany({
    where: {
      sponsorName: DEMO_SPONSOR_FLAG,
    },
  });

  await prisma.memberHandicapHistory.deleteMany({
    where: {
      reason: {
        startsWith: DEMO_HISTORY_REASON_PREFIX,
      },
    },
  });

  const remainingDemoOutings = await prisma.outing.count({
    where: {
      course: {
        name: DEMO_COURSE_NAME,
      },
    },
  });

  if (remainingDemoOutings === 0) {
    await prisma.course.deleteMany({
      where: {
        name: DEMO_COURSE_NAME,
      },
    });
  }
}

export async function createCourse(formData: FormData) {
  await requireCaptain();

  const name = getTrimmedString(formData, "name");

  if (!name) {
    throw new Error("Course name is required.");
  }

  const holes = Array.from({ length: 18 }, (_, index) => {
    const holeNumber = index + 1;

    return {
      holeNumber,
      par: getNumberValue(formData, `hole-${holeNumber}-par`),
      strokeIndex: getNumberValue(formData, `hole-${holeNumber}-stroke-index`),
    };
  });

  const strokeIndexes = new Set(holes.map((hole) => hole.strokeIndex));

  if (strokeIndexes.size !== 18) {
    throw new Error("Each hole must have a unique stroke index from 1 to 18.");
  }

  await prisma.course.create({
    data: {
      name,
      holes: {
        create: holes,
      },
    },
  });

  revalidatePath("/portal/captain");
}

export async function deleteCourse(formData: FormData) {
  await requireCaptain();

  const courseId = getTrimmedString(formData, "courseId");

  if (!courseId) {
    throw new Error("Course id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  const outingCount = await prisma.outing.count({
    where: {
      courseId,
    },
  });

  if (outingCount > 0) {
    throw new Error("This course is linked to outings. Remove those outings first.");
  }

  await prisma.course.delete({
    where: {
      id: courseId,
    },
  });

  revalidatePath("/portal/captain");
  revalidatePath("/fixtures");
}

function parseFixtureDate(raw: string) {
  const year = 2026;
  const normalized = raw.replace("Sept", "September");

  if (normalized === "October") {
    return new Date(`${year}-10-01T12:00:00`);
  }

  const multiDayMatch = normalized.match(/^([A-Za-z]+)\s+(\d+)/);

  if (multiDayMatch) {
    const month = multiDayMatch[1];
    const day = multiDayMatch[2].padStart(2, "0");
    return new Date(`${month} ${day}, ${year} 12:00:00`);
  }

  return new Date(`${normalized}, ${year} 12:00:00`);
}

export async function syncSiteData() {
  await requireCaptain();

  for (const sourceMember of sourceMembers) {
    await prisma.member.upsert({
      where: {
        name: sourceMember.name,
      },
      update: {
        handicapIndex: Number(sourceMember.handicap),
      },
      create: {
        name: sourceMember.name,
        handicapIndex: Number(sourceMember.handicap),
        isRegistered: false,
      },
    });
  }

  for (const fixture of fixtures) {
    const course = await prisma.course.upsert({
      where: {
        name: fixture.course,
      },
      update: {
        websiteUrl: fixture.courseWebsiteUrl,
        mapsUrl: fixture.mapsUrl,
        imageSrc: fixture.imageSrc,
        imageAlt: fixture.imageAlt,
      },
      create: {
        name: fixture.course,
        websiteUrl: fixture.courseWebsiteUrl,
        mapsUrl: fixture.mapsUrl,
        imageSrc: fixture.imageSrc,
        imageAlt: fixture.imageAlt,
        holes: {
          create: createPlaceholderHoleSetup(),
        },
      },
      select: {
        id: true,
      },
    });

    await prisma.outing.upsert({
      where: {
        sourceFixtureId: fixture.id,
      },
      update: {
        title: fixture.title,
        outingDate: parseFixtureDate(fixture.date),
        teeTime: fixture.teeTime,
        courseId: course.id,
      },
      create: {
        sourceFixtureId: fixture.id,
        title: fixture.title,
        outingDate: parseFixtureDate(fixture.date),
        teeTime: fixture.teeTime,
        courseId: course.id,
      },
    });
  }

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function updateCourse(formData: FormData) {
  await requireCaptain();

  const courseId = getTrimmedString(formData, "courseId");
  const name = getTrimmedString(formData, "name");

  if (!courseId || !name) {
    throw new Error("Course id and name are required.");
  }

  const holes = Array.from({ length: 18 }, (_, index) => {
    const holeNumber = index + 1;

    return {
      holeNumber,
      par: getNumberValue(formData, `hole-${holeNumber}-par`),
      strokeIndex: getNumberValue(formData, `hole-${holeNumber}-stroke-index`),
    };
  });

  const strokeIndexes = new Set(holes.map((hole) => hole.strokeIndex));

  if (strokeIndexes.size !== 18) {
    throw new Error("Each hole must have a unique stroke index from 1 to 18.");
  }

  await prisma.course.update({
    where: {
      id: courseId,
    },
    data: {
      name,
      holes: {
        deleteMany: {},
        create: holes,
      },
    },
  });

  revalidatePath("/portal/captain");
  revalidatePath("/fixtures");
}

export async function seedDemoMemberHistory() {
  await requireAdmin();

  await removeSeededDemoDataInternal();

  const members = await prisma.member.findMany({
    where: {
      approvalStatus: "approved",
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      handicapIndex: true,
    },
  });

  if (members.length === 0) {
    throw new Error("There are no approved members to seed.");
  }

  let demoCourse = await prisma.course.findUnique({
    where: {
      name: DEMO_COURSE_NAME,
    },
    include: {
      holes: {
        orderBy: {
          holeNumber: "asc",
        },
      },
    },
  });

  if (!demoCourse) {
    demoCourse = await prisma.course.create({
      data: {
        name: DEMO_COURSE_NAME,
        holes: {
          create: createPlaceholderHoleSetup(),
        },
      },
      include: {
        holes: {
          orderBy: {
            holeNumber: "asc",
          },
        },
      },
    });
  }

  if (demoCourse.holes.length !== 18) {
    demoCourse = await prisma.course.update({
      where: {
        id: demoCourse.id,
      },
      data: {
        holes: {
          deleteMany: {},
          create: createPlaceholderHoleSetup(),
        },
      },
      include: {
        holes: {
          orderBy: {
            holeNumber: "asc",
          },
        },
      },
    });
  }

  for (const [memberIndex, member] of members.entries()) {
    for (let outingIndex = 0; outingIndex < 10; outingIndex += 1) {
      await prisma.memberHandicapHistory.create({
        data: {
          memberId: member.id,
          handicapIndex: getDemoHistoryValue(Number(member.handicapIndex), outingIndex, memberIndex),
          reason: `${DEMO_HISTORY_REASON_PREFIX}:${outingIndex + 1}`,
          effectiveAt: getDemoOutingDate(outingIndex),
        },
      });
    }
  }

  for (let outingIndex = 0; outingIndex < 10; outingIndex += 1) {
    const outingDate = getDemoOutingDate(outingIndex);
    const playerAssignments = members.map((member, memberIndex) => ({
      memberId: member.id,
      groupNumber: Math.floor(memberIndex / 4) + 1,
      isScorekeeper: memberIndex % 4 === 0,
      submittedAt: outingDate,
      courseHandicap: Number(member.handicapIndex),
      playingHandicap: Number(member.handicapIndex),
    }));
    const holeScores: Array<{
      memberId: string;
      holeNumber: number;
      grossStrokes: number;
      strokesReceived: number;
      netStrokes: number;
      stablefordPoints: number;
      enteredByMemberId: string;
    }> = [];
    let twosAssigned = 0;

    for (const [memberIndex, member] of members.entries()) {
      for (const hole of demoCourse.holes) {
        const grossStrokes = getDemoGrossStrokes({
          par: hole.par,
          holeNumber: hole.holeNumber,
          outingIndex,
          memberIndex,
          handicapIndex: Number(member.handicapIndex),
          strokeIndex: hole.strokeIndex,
          twosAssigned,
        });
        const calculated = calculateStablefordHoleScore({
          grossStrokes,
          par: hole.par,
          strokeIndex: hole.strokeIndex,
          playingHandicap: Number(member.handicapIndex),
        });

        if (grossStrokes === 2) {
          twosAssigned += 1;
        }

        holeScores.push({
          memberId: member.id,
          holeNumber: hole.holeNumber,
          grossStrokes,
          strokesReceived: calculated.strokesReceived,
          netStrokes: calculated.netStrokes,
          stablefordPoints: calculated.stablefordPoints,
          enteredByMemberId: members[Math.floor(memberIndex / 4) * 4]?.id ?? member.id,
        });
      }
    }

    const leaderboard = members
      .map((member) => {
        const playerScores = holeScores.filter((score) => score.memberId === member.id);

        return {
          memberId: member.id,
          totalPoints: playerScores.reduce(
            (total, score) => total + score.stablefordPoints,
            0,
          ),
          totalGross: playerScores.reduce((total, score) => total + score.grossStrokes, 0),
        };
      })
      .sort(
        (left, right) =>
          right.totalPoints - left.totalPoints ||
          left.totalGross - right.totalGross,
      )
      .map((entry, index) => ({
        memberId: entry.memberId,
        totalPoints: entry.totalPoints,
        position: index + 1,
      }));

    const outing = await prisma.outing.create({
      data: {
        title: `Demo Society Day ${outingIndex + 1}`,
        outingDate,
        courseId: demoCourse.id,
        teeTime: "10:00",
        sponsorName: DEMO_SPONSOR_FLAG,
        status: "completed",
        resultsPublishedAt: outingDate,
      },
      select: {
        id: true,
      },
    });

    await prisma.outingPlayer.createMany({
      data: playerAssignments.map((assignment) => ({
        outingId: outing.id,
        ...assignment,
      })),
    });

    await prisma.holeScore.createMany({
      data: holeScores.map((score) => ({
        outingId: outing.id,
        ...score,
      })),
    });

    await prisma.outingResult.createMany({
      data: leaderboard.map((result) => ({
        outingId: outing.id,
        memberId: result.memberId,
        totalPoints: result.totalPoints,
        position: result.position,
      })),
    });
  }

  revalidatePath("/portal");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/captain");
  revalidatePath("/results");
  revalidatePath("/fixtures");
  revalidatePath("/members");
}

export async function removeSeededDemoData(formData: FormData) {
  await requireAdmin();

  assertConfirmationPhrase(formData, "REMOVE");

  await removeSeededDemoDataInternal();

  revalidatePath("/portal");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/captain");
  revalidatePath("/results");
  revalidatePath("/fixtures");
  revalidatePath("/members");
}

export async function createAboutCarouselImage(formData: FormData) {
  await requireAdmin();

  const tagline = getTrimmedString(formData, "tagline");
  const image = formData.get("image");

  if (!tagline) {
    throw new Error("A tagline is required.");
  }

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("Please choose an image to upload.");
  }

  if (!image.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }

  if (image.size > 5 * 1024 * 1024) {
    throw new Error("Please upload an image smaller than 5MB.");
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageData = `data:${image.type};base64,${buffer.toString("base64")}`;
  const highestSortOrder = await prisma.aboutCarouselImage.findFirst({
    orderBy: {
      sortOrder: "desc",
    },
    select: {
      sortOrder: true,
    },
  });

  await prisma.aboutCarouselImage.create({
    data: {
      imageData,
      tagline,
      sortOrder: (highestSortOrder?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/about");
  revalidatePath("/portal/captain");
}

export async function deleteAboutCarouselImage(formData: FormData) {
  await requireAdmin();

  const imageId = getTrimmedString(formData, "imageId");

  if (!imageId) {
    throw new Error("Image id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  await prisma.aboutCarouselImage.delete({
    where: {
      id: imageId,
    },
  });

  revalidatePath("/about");
  revalidatePath("/portal/captain");
}

export async function createWallOfShameImage(formData: FormData) {
  await requireAdmin();

  const tagline = getTrimmedString(formData, "tagline");
  const photoDate = getOptionalDateValue(formData, "photoDate");
  const location = getTrimmedString(formData, "location");
  const image = formData.get("image");

  if (!tagline) {
    throw new Error("A tagline is required.");
  }

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("Please choose an image to upload.");
  }

  if (!image.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }

  if (image.size > 5 * 1024 * 1024) {
    throw new Error("Please upload an image smaller than 5MB.");
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageData = `data:${image.type};base64,${buffer.toString("base64")}`;
  const highestSortOrder = await prisma.wallOfShameImage.findFirst({
    orderBy: {
      sortOrder: "desc",
    },
    select: {
      sortOrder: true,
    },
  });

  await prisma.wallOfShameImage.create({
    data: {
      imageData,
      tagline,
      photoDate,
      location: location || null,
      sortOrder: (highestSortOrder?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/members");
  revalidatePath("/members/wall-of-shame");
  revalidatePath("/portal/captain");
}

export async function updateWallOfShameImage(formData: FormData) {
  await requireAdmin();

  const imageId = getTrimmedString(formData, "imageId");
  const tagline = getTrimmedString(formData, "tagline");
  const photoDate = getOptionalDateValue(formData, "photoDate");
  const location = getTrimmedString(formData, "location");

  if (!imageId) {
    throw new Error("Image id is required.");
  }

  if (!tagline) {
    throw new Error("A tagline is required.");
  }

  await prisma.wallOfShameImage.update({
    where: {
      id: imageId,
    },
    data: {
      tagline,
      photoDate,
      location: location || null,
    },
  });

  revalidatePath("/members");
  revalidatePath("/members/wall-of-shame");
  revalidatePath("/portal/captain");
}

export async function deleteWallOfShameImage(formData: FormData) {
  await requireAdmin();

  const imageId = getTrimmedString(formData, "imageId");

  if (!imageId) {
    throw new Error("Image id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  await prisma.wallOfShameImage.delete({
    where: {
      id: imageId,
    },
  });

  revalidatePath("/members");
  revalidatePath("/members/wall-of-shame");
  revalidatePath("/portal/captain");
}

export async function reorderAboutCarouselImage(formData: FormData) {
  await requireAdmin();

  const imageId = getTrimmedString(formData, "imageId");
  const direction = getTrimmedString(formData, "direction");

  if (!imageId) {
    throw new Error("Image id is required.");
  }

  if (direction !== "up" && direction !== "down") {
    throw new Error("A valid reorder direction is required.");
  }

  const currentImage = await prisma.aboutCarouselImage.findUnique({
    where: {
      id: imageId,
    },
    select: {
      id: true,
      sortOrder: true,
    },
  });

  if (!currentImage) {
    throw new Error("That carousel image could not be found.");
  }

  const adjacentImage = await prisma.aboutCarouselImage.findFirst({
    where:
      direction === "up"
        ? {
            sortOrder: {
              lt: currentImage.sortOrder,
            },
          }
        : {
            sortOrder: {
              gt: currentImage.sortOrder,
            },
          },
    orderBy: {
      sortOrder: direction === "up" ? "desc" : "asc",
    },
    select: {
      id: true,
      sortOrder: true,
    },
  });

  if (!adjacentImage) {
    return;
  }

  await prisma.$transaction([
    prisma.aboutCarouselImage.update({
      where: {
        id: currentImage.id,
      },
      data: {
        sortOrder: adjacentImage.sortOrder,
      },
    }),
    prisma.aboutCarouselImage.update({
      where: {
        id: adjacentImage.id,
      },
      data: {
        sortOrder: currentImage.sortOrder,
      },
    }),
  ]);

  revalidatePath("/about");
  revalidatePath("/portal/captain");
}

export async function upsertSeasonKeyMemberProfile(formData: FormData) {
  await requireAdmin();

  const roleKey = getTrimmedString(formData, "roleKey");
  const roleLabel = getTrimmedString(formData, "roleLabel");
  const memberName = getTrimmedString(formData, "memberName");
  const image = formData.get("image");

  if (!roleKey || !roleLabel || !memberName) {
    throw new Error("Role key, role label, and member name are required.");
  }

  let imageData: string | undefined;

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      throw new Error("Only image files can be uploaded.");
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error("Please upload an image smaller than 5MB.");
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    imageData = `data:${image.type};base64,${buffer.toString("base64")}`;
  }

  const existingRecord = await prisma.seasonKeyMemberProfile.findUnique({
    where: {
      season_roleKey: {
        season: currentSeason,
        roleKey,
      },
    },
    select: {
      id: true,
      imageData: true,
      sortOrder: true,
    },
  });
  const highestSortOrder = await prisma.seasonKeyMemberProfile.findFirst({
    where: {
      season: currentSeason,
    },
    orderBy: {
      sortOrder: "desc",
    },
    select: {
      sortOrder: true,
    },
  });

  await prisma.seasonKeyMemberProfile.upsert({
    where: {
      season_roleKey: {
        season: currentSeason,
        roleKey,
      },
    },
    update: {
      roleLabel,
      memberName,
      imageData: imageData ?? existingRecord?.imageData ?? null,
    },
    create: {
      season: currentSeason,
      roleKey,
      roleLabel,
      memberName,
      imageData: imageData ?? null,
      sortOrder: existingRecord?.sortOrder ?? (highestSortOrder?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/updates");
  revalidatePath("/portal/captain");
}

export async function createOuting(formData: FormData) {
  const captain = await requireCaptain();
  const title = getTrimmedString(formData, "title");
  const outingDateRaw = getTrimmedString(formData, "outingDate");
  const courseId = getTrimmedString(formData, "courseId");
  const teeTime = getTrimmedString(formData, "teeTime");
  const sponsorName = getTrimmedString(formData, "sponsorName");
  const sponsorUrl = getTrimmedString(formData, "sponsorUrl");
  const imageSrc = getTrimmedString(formData, "imageSrc");
  const imageAlt = getTrimmedString(formData, "imageAlt");
  const featured = formData.get("featured") === "on";

  if (!title) {
    throw new Error("Outing title is required.");
  }

  if (!outingDateRaw) {
    throw new Error("Outing date is required.");
  }

  if (!courseId) {
    throw new Error("A course must be selected.");
  }

  const outingDate = new Date(`${outingDateRaw}T12:00:00`);

  if (Number.isNaN(outingDate.getTime())) {
    throw new Error("Outing date is invalid.");
  }

  const outing = await prisma.outing.create({
    data: {
      title,
      outingDate,
      courseId,
      teeTime: teeTime || null,
      sponsorName: sponsorName || null,
      sponsorUrl: sponsorUrl || null,
      imageSrc: imageSrc || null,
      imageAlt: imageAlt || null,
      featured,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
  revalidatePath("/fixtures");
  redirect(`/portal/captain?outing=${outing.id}&created=1&captain=${captain.user.id}`);
}

export async function updateOutingGroups(formData: FormData) {
  await requireCaptain();

  const outingId = getTrimmedString(formData, "outingId");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  const groupedSelections = new Map<number, string[]>();

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^group-(\d+)-member-(\d+)$/);

    if (!match) {
      continue;
    }

    const memberId = String(value).trim();

    if (!memberId) {
      continue;
    }

    const groupNumber = Number(match[1]);

    if (!Number.isInteger(groupNumber) || groupNumber < 1 || groupNumber > 12) {
      throw new Error("Group numbers must be between 1 and 12.");
    }

    const existingGroupMembers = groupedSelections.get(groupNumber) ?? [];
    existingGroupMembers.push(memberId);
    groupedSelections.set(groupNumber, existingGroupMembers);
  }

  const uniqueSelectedPlayers = new Set<string>();

  for (const groupMembers of groupedSelections.values()) {
    if (groupMembers.length > 4) {
      throw new Error("Each group can contain a maximum of four members.");
    }

    for (const memberId of groupMembers) {
      if (uniqueSelectedPlayers.has(memberId)) {
        throw new Error("A member cannot be assigned to more than one group.");
      }

      uniqueSelectedPlayers.add(memberId);
    }
  }

  const outingPlayers = await Promise.all(
    Array.from(groupedSelections.entries()).flatMap(([groupNumber, memberIds]) =>
      memberIds.map(async (memberId) => {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          handicapIndex: true,
        },
      });

      if (!member) {
        throw new Error("One of the selected members could not be found.");
      }

      return {
        memberId,
        groupNumber,
        isScorekeeper: false,
        courseHandicap: member.handicapIndex,
        playingHandicap: member.handicapIndex,
      };
      }),
    ),
  );

  await prisma.outing.update({
    where: {
      id: outingId,
    },
    data: {
      players: {
        deleteMany: {},
        create: outingPlayers,
      },
    },
  });

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function approveMemberRequest(formData: FormData) {
  await requireCaptain();

  const memberId = getTrimmedString(formData, "memberId");

  if (!memberId) {
    throw new Error("Member id is required.");
  }

  await approveMember(memberId);

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function removeMemberRequest(formData: FormData) {
  await requireCaptain();

  const memberId = getTrimmedString(formData, "memberId");

  if (!memberId) {
    throw new Error("Member id is required.");
  }

  assertConfirmationPhrase(formData, "REMOVE");

  await removePendingMember(memberId);

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function updateMemberRole(formData: FormData) {
  await requireAdmin();

  const memberId = getTrimmedString(formData, "memberId");
  const role = getTrimmedString(formData, "role");

  if (!memberId) {
    throw new Error("Member id is required.");
  }

  if (
    role !== "member" &&
    role !== "captain" &&
    role !== "viceCaptain" &&
    role !== "treasurer" &&
    role !== "secretary" &&
    role !== "handicapCommittee" &&
    role !== "admin"
  ) {
    throw new Error("A valid member role is required.");
  }

  await updateStoredMemberRole(memberId, role);

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function updateMemberHandicap(formData: FormData) {
  await requireHandicapCommittee();

  const memberId = getTrimmedString(formData, "memberId");
  const handicapIndex = getNumberValue(formData, "handicapIndex");

  if (!memberId) {
    throw new Error("Member id is required.");
  }

  if (handicapIndex < 0 || handicapIndex > 54) {
    throw new Error("Handicap index must be between 0 and 54.");
  }

  await updateStoredMemberHandicap(memberId, handicapIndex);

  await prisma.outingPlayer.updateMany({
    where: {
      memberId,
      submittedAt: null,
    },
    data: {
      courseHandicap: handicapIndex,
      playingHandicap: handicapIndex,
    },
  });

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function reassignMemberEmailLink(formData: FormData) {
  await requireAdmin();

  const sourceMemberId = getTrimmedString(formData, "sourceMemberId");
  const targetMemberId = getTrimmedString(formData, "targetMemberId");

  if (!sourceMemberId || !targetMemberId) {
    throw new Error("Both the current member and target member are required.");
  }

  assertConfirmationPhrase(formData, "RELINK");

  await reassignStoredMemberEmailLink(sourceMemberId, targetMemberId);

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function deleteMember(formData: FormData) {
  await requireAdmin();

  const memberId = getTrimmedString(formData, "memberId");

  if (!memberId) {
    throw new Error("Member id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  await deleteStoredMember(memberId);

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function updateOuting(formData: FormData) {
  await requireCaptain();

  const outingId = getTrimmedString(formData, "outingId");
  const title = getTrimmedString(formData, "title");
  const outingDateRaw = getTrimmedString(formData, "outingDate");
  const courseId = getTrimmedString(formData, "courseId");
  const teeTime = getTrimmedString(formData, "teeTime");
  const sponsorName = getTrimmedString(formData, "sponsorName");
  const sponsorUrl = getTrimmedString(formData, "sponsorUrl");
  const imageSrc = getTrimmedString(formData, "imageSrc");
  const imageAlt = getTrimmedString(formData, "imageAlt");
  const featured = formData.get("featured") === "on";

  if (!outingId || !title || !outingDateRaw || !courseId) {
    throw new Error("Outing id, title, date, and course are required.");
  }

  const outingDate = new Date(`${outingDateRaw}T12:00:00`);

  if (Number.isNaN(outingDate.getTime())) {
    throw new Error("Outing date is invalid.");
  }

  await prisma.outing.update({
    where: {
      id: outingId,
    },
    data: {
      title,
      outingDate,
      courseId,
      teeTime: teeTime || null,
      sponsorName: sponsorName || null,
      sponsorUrl: sponsorUrl || null,
      imageSrc: imageSrc || null,
      imageAlt: imageAlt || null,
      featured,
    },
  });

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
  revalidatePath("/fixtures");
}

export async function deleteOuting(formData: FormData) {
  await requireCaptain();

  const outingId = getTrimmedString(formData, "outingId");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  await prisma.outing.delete({
    where: {
      id: outingId,
    },
  });

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
  revalidatePath("/fixtures");
}
