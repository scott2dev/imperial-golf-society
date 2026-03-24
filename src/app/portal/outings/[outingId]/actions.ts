"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateStablefordHoleScore } from "@/lib/scoring";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumberValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid value for ${key}.`);
  }

  return value;
}

type AssignmentForMember = {
  id: string;
  groupNumber: number;
  isScorekeeper: boolean;
  outing: {
    course: {
      holes: Array<{
        holeNumber: number;
        par: number;
        strokeIndex: number;
      }>;
    };
  };
} | null;

type SaveScoresTransaction = {
  outingSignature: {
    deleteMany: typeof prisma.outingSignature.deleteMany;
  };
  holeScore: {
    upsert: typeof prisma.holeScore.upsert;
  };
};

type GroupPlayerAssignment = Array<{
  id: string;
  memberId: string;
  groupNumber: number;
  playingHandicap: number | { toString(): string };
  member: {
    id: string;
    name: string;
    email: string | null;
  };
}>;

type SubmitGroupPlayer = {
  id: string;
  memberId: string;
};

type ScoreCountEntry = {
  memberId: string;
  _count: {
    holeNumber: number;
  };
};

type SignatureEntry = {
  memberId: string;
};

async function getAssignmentForMember(outingId: string, memberId: string) {
  return prisma.outingPlayer.findUnique({
    where: {
      outingId_memberId: {
        outingId,
        memberId,
      },
    },
    include: {
      outing: {
        include: {
          course: {
            include: {
              holes: {
                orderBy: {
                  holeNumber: "asc",
                },
              },
            },
          },
        },
      },
    },
  }) as Promise<AssignmentForMember>;
}

async function getGroupPlayersForAssignment(outingId: string, groupNumber: number) {
  return prisma.outingPlayer.findMany({
    where: {
      outingId,
      groupNumber,
    },
    include: {
      member: true,
    },
    orderBy: {
      member: {
        name: "asc",
      },
    },
  }) as Promise<GroupPlayerAssignment>;
}

async function updateOutingResults(outingId: string) {
  const scores = await prisma.holeScore.findMany({
    where: {
      outingId,
    },
    select: {
      memberId: true,
      stablefordPoints: true,
    },
  });

  const totals = new Map<string, number>();

  for (const score of scores) {
    totals.set(score.memberId, (totals.get(score.memberId) ?? 0) + score.stablefordPoints);
  }

  const sortedTotals = Array.from(totals.entries()).sort((left, right) => right[1] - left[1]);

  for (const [index, [memberId, totalPoints]] of sortedTotals.entries()) {
    await prisma.outingResult.upsert({
      where: {
        outingId_memberId: {
          outingId,
          memberId,
        },
      },
      update: {
        totalPoints,
        position: index + 1,
      },
      create: {
        outingId,
        memberId,
        totalPoints,
        position: index + 1,
      },
    });
  }
}

export async function claimGroupScorekeeper(formData: FormData) {
  const member = await getCurrentMember();
  const outingId = getTrimmedString(formData, "outingId");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  const assignment = await getAssignmentForMember(outingId, member.id);

  if (!assignment) {
    throw new Error("You are not assigned to this outing.");
  }

  await prisma.$transaction([
    prisma.outingPlayer.updateMany({
      where: {
        outingId,
        groupNumber: assignment.groupNumber,
      },
      data: {
        isScorekeeper: false,
      },
    }),
    prisma.outingPlayer.update({
      where: {
        id: assignment.id,
      },
      data: {
        isScorekeeper: true,
      },
    }),
    prisma.outing.update({
      where: {
        id: outingId,
      },
      data: {
        status: "live",
      },
    }),
  ]);

  revalidatePath("/portal");
  revalidatePath(`/portal/outings/${outingId}`);
}

export async function saveHoleScores(formData: FormData) {
  const member = await getCurrentMember();
  const outingId = getTrimmedString(formData, "outingId");
  const holeNumber = getNumberValue(formData, "holeNumber");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  const assignment = await getAssignmentForMember(outingId, member.id);

  if (!assignment) {
    throw new Error("You are not assigned to this outing.");
  }

  if (!assignment.isScorekeeper) {
    throw new Error("Only the current scorekeeper can enter scores for this group.");
  }

  const hole = assignment.outing.course.holes.find((entry) => entry.holeNumber === holeNumber);

  if (!hole) {
    throw new Error("That hole could not be found for this course.");
  }

  const groupPlayers = await getGroupPlayersForAssignment(outingId, assignment.groupNumber);

  if (groupPlayers.length === 0) {
    throw new Error("No players were found for this group.");
  }

  const savedScores: Array<{
    memberId: string;
    grossStrokes: number;
    netStrokes: number;
    stablefordPoints: number;
  }> = [];

  await prisma.$transaction(async (tx: SaveScoresTransaction) => {
    await tx.outingSignature.deleteMany({
      where: {
        outingId,
        groupNumber: assignment.groupNumber,
      },
    });

    for (const player of groupPlayers) {
      const grossStrokes = getNumberValue(formData, `gross-${player.memberId}`);

      if (grossStrokes < 1 || grossStrokes > 20) {
        throw new Error("Gross strokes must be between 1 and 20.");
      }

      const calculated = calculateStablefordHoleScore({
        grossStrokes,
        par: hole.par,
        strokeIndex: hole.strokeIndex,
        playingHandicap: Number(player.playingHandicap),
      });

      savedScores.push({
        memberId: player.memberId,
        grossStrokes,
        netStrokes: calculated.netStrokes,
        stablefordPoints: calculated.stablefordPoints,
      });

      await tx.holeScore.upsert({
        where: {
          outingId_memberId_holeNumber: {
            outingId,
            memberId: player.memberId,
            holeNumber,
          },
        },
        update: {
          grossStrokes,
          strokesReceived: calculated.strokesReceived,
          netStrokes: calculated.netStrokes,
          stablefordPoints: calculated.stablefordPoints,
          enteredByMemberId: member.id,
        },
        create: {
          outingId,
          memberId: player.memberId,
          holeNumber,
          grossStrokes,
          strokesReceived: calculated.strokesReceived,
          netStrokes: calculated.netStrokes,
          stablefordPoints: calculated.stablefordPoints,
          enteredByMemberId: member.id,
        },
      });
    }
  });

  await updateOutingResults(outingId);

  revalidatePath("/portal");
  revalidatePath(`/portal/outings/${outingId}`);

  return {
    holeNumber,
    scores: savedScores,
  };
}

export async function saveGroupSignature(formData: FormData) {
  const member = await getCurrentMember();
  const outingId = getTrimmedString(formData, "outingId");
  const memberId = getTrimmedString(formData, "memberId");
  const signatureData = getTrimmedString(formData, "signatureData");

  if (!outingId || !memberId || !signatureData) {
    throw new Error("Outing, member, and signature are all required.");
  }

  const assignment = await getAssignmentForMember(outingId, member.id);

  if (!assignment) {
    throw new Error("You are not assigned to this outing.");
  }

  if (!assignment.isScorekeeper) {
    throw new Error("Only the current scorekeeper can collect signatures.");
  }

  const groupPlayers = await getGroupPlayersForAssignment(outingId, assignment.groupNumber);
  const targetPlayer = groupPlayers.find((player) => player.memberId === memberId);

  if (!targetPlayer) {
    throw new Error("That player is not in your group.");
  }

  await prisma.outingSignature.upsert({
    where: {
      outingId_memberId: {
        outingId,
        memberId,
      },
    },
    update: {
      groupNumber: assignment.groupNumber,
      signatureData,
      signedAt: new Date(),
    },
    create: {
      outingId,
      memberId,
      groupNumber: assignment.groupNumber,
      signatureData,
    },
  });

  revalidatePath("/portal");
  revalidatePath(`/portal/outings/${outingId}`);
}

export async function submitGroupRound(formData: FormData) {
  const member = await getCurrentMember();
  const outingId = getTrimmedString(formData, "outingId");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  const assignment = await getAssignmentForMember(outingId, member.id);

  if (!assignment) {
    throw new Error("You are not assigned to this outing.");
  }

  if (!assignment.isScorekeeper) {
    throw new Error("Only the current scorekeeper can submit the group round.");
  }

  const groupPlayers: SubmitGroupPlayer[] = await prisma.outingPlayer.findMany({
    where: {
      outingId,
      groupNumber: assignment.groupNumber,
    },
    select: {
      id: true,
      memberId: true,
    },
  });

  const scoreCounts: ScoreCountEntry[] = await prisma.holeScore.groupBy({
    by: ["memberId"],
    where: {
      outingId,
      memberId: {
        in: groupPlayers.map((player) => player.memberId),
      },
    },
    _count: {
      holeNumber: true,
    },
  });

  const countsByMember = new Map(
    scoreCounts.map((entry) => [entry.memberId, entry._count.holeNumber]),
  );

  for (const player of groupPlayers) {
    if ((countsByMember.get(player.memberId) ?? 0) < 18) {
      throw new Error("Every player in the group must have scores for all 18 holes.");
    }
  }

  const signatures: SignatureEntry[] = await prisma.outingSignature.findMany({
    where: {
      outingId,
      groupNumber: assignment.groupNumber,
      memberId: {
        in: groupPlayers.map((player) => player.memberId),
      },
    },
    select: {
      memberId: true,
    },
  });

  const signatureMemberIds = new Set(signatures.map((signature) => signature.memberId));

  for (const player of groupPlayers) {
    if (!signatureMemberIds.has(player.memberId)) {
      throw new Error("Every player in the group must sign the scorecard before submission.");
    }
  }

  const now = new Date();

  await prisma.outingPlayer.updateMany({
    where: {
      outingId,
      groupNumber: assignment.groupNumber,
    },
    data: {
      submittedAt: now,
    },
  });

  const remaining = await prisma.outingPlayer.count({
    where: {
      outingId,
      submittedAt: null,
    },
  });

  if (remaining === 0) {
    await prisma.outing.update({
      where: {
        id: outingId,
      },
      data: {
        status: "completed",
      },
    });
  }

  revalidatePath("/portal");
  revalidatePath(`/portal/outings/${outingId}`);
}

export async function removeGroupSubmission(formData: FormData) {
  const member = await getCurrentMember();
  const outingId = getTrimmedString(formData, "outingId");
  const groupNumber = getNumberValue(formData, "groupNumber");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  if (member.role !== "captain" && member.role !== "admin") {
    throw new Error("Only a captain or admin can remove a submitted group round.");
  }

  await prisma.outingPlayer.updateMany({
    where: {
      outingId,
      groupNumber,
    },
    data: {
      submittedAt: null,
    },
  });

  await prisma.outing.update({
    where: {
      id: outingId,
    },
    data: {
      status: "live",
    },
  });

  revalidatePath("/portal");
  revalidatePath(`/portal/outings/${outingId}`);
}
