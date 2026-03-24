"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
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

export async function publishOutingResults(formData: FormData) {
  const member = await getCurrentMember();
  const outingId = getTrimmedString(formData, "outingId");

  if (!outingId) {
    throw new Error("Outing id is required.");
  }

  if (member.role !== "captain" && member.role !== "admin") {
    throw new Error("Only a captain or admin can publish results.");
  }

  assertConfirmationPhrase(formData, "PUBLISH");

  const outing = await prisma.outing.findUnique({
    where: {
      id: outingId,
    },
    include: {
      players: {
        select: {
          submittedAt: true,
        },
      },
    },
  });

  if (!outing) {
    throw new Error("The outing could not be found.");
  }

  const allGroupsSubmitted =
    outing.players.length > 0 && outing.players.every((player) => player.submittedAt !== null);
  const isFinalizedByAdmin = outing.status === "finalized";

  if (!allGroupsSubmitted && !isFinalizedByAdmin) {
    throw new Error("Results can only be published after submissions are complete or finalized.");
  }

  await prisma.outing.update({
    where: {
      id: outingId,
    },
    data: {
      resultsPublishedAt: new Date(),
    },
  });

  revalidatePath("/portal");
  revalidatePath(`/portal/outings/${outingId}`);
  revalidatePath(`/portal/results/${outingId}`);
}
