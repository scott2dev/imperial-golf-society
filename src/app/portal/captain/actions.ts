"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireCaptain } from "@/lib/auth";
import { createPlaceholderHoleSetup } from "@/lib/course-defaults";
import { fixtures } from "@/lib/fixtures-data";
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

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

  if (role !== "member" && role !== "captain" && role !== "admin") {
    throw new Error("A valid member role is required.");
  }

  await updateStoredMemberRole(memberId, role);

  revalidatePath("/portal");
  revalidatePath("/portal/captain");
}

export async function updateMemberHandicap(formData: FormData) {
  await requireAdmin();

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
