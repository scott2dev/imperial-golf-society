"use server";

import { revalidatePath } from "next/cache";
import { requireTreasurer } from "@/lib/auth";
import { currentSeason } from "@/lib/key-members-data";
import { prisma } from "@/lib/prisma";

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

function getOptionalDateTimeValue(formData: FormData, key: string) {
  const raw = getTrimmedString(formData, key);

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${key}.`);
  }

  return parsed;
}

function getMoneyValue(formData: FormData, key: string) {
  const raw = getTrimmedString(formData, key);
  const value = Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Enter a valid amount for ${key}.`);
  }

  return Number(value.toFixed(2));
}

function getOptionalMoneyValue(formData: FormData, key: string) {
  const raw = getTrimmedString(formData, key);

  if (!raw) {
    return null;
  }

  return getMoneyValue(formData, key);
}

function assertConfirmationPhrase(formData: FormData, expected: string) {
  const confirmation = getTrimmedString(formData, "confirmation").toUpperCase();

  if (confirmation !== expected) {
    throw new Error(`Please type ${expected} to confirm this action.`);
  }
}

export async function createTreasurerCharge(formData: FormData) {
  await requireTreasurer();

  const title = getTrimmedString(formData, "title");
  const chargeKind = getTrimmedString(formData, "chargeKind");
  const amount = getOptionalMoneyValue(formData, "amount");
  const dueDate = getOptionalDateValue(formData, "dueDate");
  const notes = getTrimmedString(formData, "notes");
  const outingId = getTrimmedString(formData, "outingId");

  if (!title) {
    throw new Error("A title is required.");
  }

  if (
    chargeKind !== "membership" &&
    chargeKind !== "outing" &&
    chargeKind !== "captainsWeekend" &&
    chargeKind !== "custom"
  ) {
    throw new Error("Choose a valid charge type.");
  }

  if (chargeKind === "outing" && !outingId) {
    throw new Error("Choose an outing for an outing charge.");
  }

  if (outingId) {
    const outing = await prisma.outing.findUnique({
      where: {
        id: outingId,
      },
      select: {
        id: true,
      },
    });

    if (!outing) {
      throw new Error("That outing could not be found.");
    }
  }

  await prisma.treasurerCharge.create({
    data: {
      title,
      chargeKind,
      season: currentSeason,
      amount,
      dueDate,
      notes: notes || null,
      outingId: chargeKind === "outing" ? outingId : null,
    },
  });

  revalidatePath("/portal/treasurer");
}

export async function updateTreasurerCharge(formData: FormData) {
  await requireTreasurer();

  const chargeId = getTrimmedString(formData, "chargeId");
  const title = getTrimmedString(formData, "title");
  const chargeKind = getTrimmedString(formData, "chargeKind");
  const amount = getOptionalMoneyValue(formData, "amount");
  const dueDate = getOptionalDateValue(formData, "dueDate");
  const notes = getTrimmedString(formData, "notes");
  const outingId = getTrimmedString(formData, "outingId");

  if (!chargeId || !title) {
    throw new Error("Charge id and title are required.");
  }

  if (
    chargeKind !== "membership" &&
    chargeKind !== "outing" &&
    chargeKind !== "captainsWeekend" &&
    chargeKind !== "custom"
  ) {
    throw new Error("Choose a valid charge type.");
  }

  if (chargeKind === "outing" && !outingId) {
    throw new Error("Choose an outing for an outing charge.");
  }

  if (outingId) {
    const outing = await prisma.outing.findUnique({
      where: {
        id: outingId,
      },
      select: {
        id: true,
      },
    });

    if (!outing) {
      throw new Error("That outing could not be found.");
    }
  }

  await prisma.treasurerCharge.update({
    where: {
      id: chargeId,
    },
    data: {
      title,
      chargeKind,
      amount,
      dueDate,
      notes: notes || null,
      outingId: chargeKind === "outing" ? outingId : null,
    },
  });

  revalidatePath("/portal/treasurer");
}

export async function recordTreasurerPayment(formData: FormData) {
  await requireTreasurer();

  const chargeId = getTrimmedString(formData, "chargeId");
  const memberId = getTrimmedString(formData, "memberId");
  const amount = getMoneyValue(formData, "amount");
  const paidAt = getOptionalDateTimeValue(formData, "paidAt") ?? new Date();
  const notes = getTrimmedString(formData, "notes");

  if (!chargeId || !memberId) {
    throw new Error("Charge and member are required.");
  }

  const charge = await prisma.treasurerCharge.findUnique({
    where: {
      id: chargeId,
    },
    include: {
      outing: {
        include: {
          players: {
            select: {
              memberId: true,
            },
          },
        },
      },
      payments: {
        where: {
          memberId,
        },
        select: {
          amount: true,
        },
      },
    },
  });

  if (!charge) {
    throw new Error("That charge could not be found.");
  }

  const member = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    select: {
      id: true,
      approvalStatus: true,
    },
  });

  if (!member || member.approvalStatus !== "approved") {
    throw new Error("That member could not be found.");
  }

  if (charge.chargeKind === "outing") {
    const outingMemberIds = new Set(charge.outing?.players.map((player) => player.memberId) ?? []);

    if (!outingMemberIds.has(memberId)) {
      throw new Error("That member is not assigned to the selected outing.");
    }
  }

  const existingPaid = charge.payments.reduce((total, payment) => total + Number(payment.amount), 0);
  const outstanding =
    charge.amount === null ? null : Number(charge.amount) - existingPaid;

  if (outstanding !== null && amount > Number(outstanding.toFixed(2))) {
    throw new Error("This payment is more than the outstanding balance for that member.");
  }

  await prisma.treasurerPayment.create({
    data: {
      chargeId,
      memberId,
      amount,
      paidAt,
      notes: notes || null,
    },
  });

  revalidatePath("/portal/treasurer");
}

export async function deleteTreasurerPayment(formData: FormData) {
  await requireTreasurer();

  const paymentId = getTrimmedString(formData, "paymentId");

  if (!paymentId) {
    throw new Error("Payment id is required.");
  }

  assertConfirmationPhrase(formData, "REMOVE");

  await prisma.treasurerPayment.delete({
    where: {
      id: paymentId,
    },
  });

  revalidatePath("/portal/treasurer");
}

export async function deleteTreasurerCharge(formData: FormData) {
  await requireTreasurer();

  const chargeId = getTrimmedString(formData, "chargeId");

  if (!chargeId) {
    throw new Error("Charge id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  await prisma.treasurerCharge.delete({
    where: {
      id: chargeId,
    },
  });

  revalidatePath("/portal/treasurer");
}
