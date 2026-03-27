import { prisma } from "@/lib/prisma";

export type MemberRole =
  | "member"
  | "captain"
  | "viceCaptain"
  | "treasurer"
  | "secretary"
  | "handicapCommittee"
  | "admin";
export type MemberApprovalStatus = "approved" | "pending";

export type MemberRecord = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
  role: MemberRole;
  approvalStatus: MemberApprovalStatus;
  isRegistered: boolean;
  handicapIndex: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseEmailList(value: string | undefined) {
  if (!value) {
    return new Set<string>();
  }

  return new Set(
    value
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean),
  );
}

function getCaptainEmails() {
  return parseEmailList(process.env.CAPTAIN_EMAILS);
}

function getAdminEmails() {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

function getAllowedMemberEmails() {
  return parseEmailList(process.env.ALLOWED_MEMBER_EMAILS);
}

function getRoleForEmail(email: string): MemberRole {
  const normalizedEmail = normalizeEmail(email);

  if (getAdminEmails().has(normalizedEmail)) {
    return "admin";
  }

  if (getCaptainEmails().has(normalizedEmail)) {
    return "captain";
  }

  return "member";
}

function mapMemberRecord(record: {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
  role: string;
  approvalStatus: string;
  isRegistered: boolean;
  handicapIndex: number | { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}) {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    image: record.image,
    role: record.role as MemberRole,
    approvalStatus: record.approvalStatus as MemberApprovalStatus,
    isRegistered: record.isRegistered,
    handicapIndex: Number(record.handicapIndex),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastLoginAt: record.lastLoginAt.toISOString(),
  } satisfies MemberRecord;
}

async function recordHandicapHistory(
  memberId: string,
  handicapIndex: number,
  reason?: string,
) {
  await prisma.memberHandicapHistory.create({
    data: {
      memberId,
      handicapIndex,
      reason: reason || null,
    },
  });
}

export function isEmailAllowedToSignIn(email: string) {
  const allowList = getAllowedMemberEmails();

  if (allowList.size === 0) {
    return true;
  }

  return allowList.has(normalizeEmail(email));
}

export async function getMemberRecordByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const record = await prisma.member.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  return record ? mapMemberRecord(record) : null;
}

export async function getMemberRecordById(id: string) {
  const record = await prisma.member.findUnique({
    where: {
      id,
    },
  });

  return record ? mapMemberRecord(record) : null;
}

export async function getApprovedUnlinkedMembers() {
  const records = await prisma.member.findMany({
    where: {
      email: null,
      approvalStatus: "approved",
    },
    orderBy: {
      name: "asc",
    },
  });

  return records.map(mapMemberRecord);
}

export async function syncLinkedMemberProfile(input: {
  email: string;
  image?: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const now = new Date();
  const existingByEmail = await prisma.member.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!existingByEmail) {
    return null;
  }

  const record = await prisma.member.update({
    where: {
      id: existingByEmail.id,
    },
    data: {
      image: input.image ?? existingByEmail.image,
      role: getRoleForEmail(normalizedEmail),
      isRegistered: true,
      lastLoginAt: now,
    },
  });

  return mapMemberRecord(record);
}

export async function linkAuthenticatedUserToMember(input: {
  email: string;
  image?: string | null;
  memberId: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const now = new Date();
  const existingByEmail = await prisma.member.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingByEmail && existingByEmail.id !== input.memberId) {
    throw new Error("This Google account is already linked to another member.");
  }

  const targetMember = await prisma.member.findUnique({
    where: {
      id: input.memberId,
    },
  });

  if (!targetMember) {
    throw new Error("The selected member could not be found.");
  }

  if (targetMember.approvalStatus !== "approved") {
    throw new Error("This member record is not approved for linking yet.");
  }

  if (targetMember.email && targetMember.email !== normalizedEmail) {
    throw new Error("This member is already linked to another Google account.");
  }

  const record = await prisma.member.update({
    where: {
      id: targetMember.id,
    },
    data: {
      email: normalizedEmail,
      image: input.image ?? targetMember.image,
      role: getRoleForEmail(normalizedEmail),
      isRegistered: true,
      lastLoginAt: now,
    },
  });

  return mapMemberRecord(record);
}

export async function createPendingMemberRequest(input: {
  email: string;
  image?: string | null;
  name: string;
  handicapIndex: number;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const requestedName = input.name.trim();
  const now = new Date();

  if (!requestedName) {
    throw new Error("A member name is required.");
  }

  const existingByName = await prisma.member.findUnique({
    where: {
      name: requestedName,
    },
  });

  if (existingByName && existingByName.email !== normalizedEmail) {
    throw new Error("That member name already exists. Please select it from the list instead.");
  }

  const existingByEmail = await prisma.member.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingByEmail?.approvalStatus === "approved") {
    throw new Error("This Google account is already linked to an approved member.");
  }

  if (existingByEmail) {
    const record = await prisma.member.update({
      where: {
        id: existingByEmail.id,
      },
      data: {
        name: requestedName,
        image: input.image ?? existingByEmail.image,
        role: getRoleForEmail(normalizedEmail),
        approvalStatus: "pending",
        isRegistered: true,
        handicapIndex: input.handicapIndex,
        lastLoginAt: now,
      },
    });

    await recordHandicapHistory(record.id, input.handicapIndex, "signup request");

    return mapMemberRecord(record);
  }

  const record = await prisma.member.create({
    data: {
      email: normalizedEmail,
      name: requestedName,
      image: input.image ?? null,
      role: getRoleForEmail(normalizedEmail),
      approvalStatus: "pending",
      isRegistered: true,
      handicapIndex: input.handicapIndex,
      lastLoginAt: now,
    },
  });

  await recordHandicapHistory(record.id, input.handicapIndex, "signup request");

  return mapMemberRecord(record);
}

export async function approveMember(memberId: string) {
  const record = await prisma.member.update({
    where: {
      id: memberId,
    },
    data: {
      approvalStatus: "approved",
    },
  });

  return mapMemberRecord(record);
}

export async function updateMemberHandicap(memberId: string, handicapIndex: number) {
  const record = await prisma.member.update({
    where: {
      id: memberId,
    },
    data: {
      handicapIndex,
    },
  });

  await recordHandicapHistory(memberId, handicapIndex, "admin update");

  return mapMemberRecord(record);
}

export async function removePendingMember(memberId: string) {
  const member = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    include: {
      outingPlayers: {
        select: {
          id: true,
        },
      },
      holeScores: {
        select: {
          id: true,
        },
      },
      enteredScores: {
        select: {
          id: true,
        },
      },
      outingResults: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error("The member request could not be found.");
  }

  if (member.approvalStatus !== "pending") {
    throw new Error("Only pending member requests can be removed.");
  }

  if (
    member.outingPlayers.length > 0 ||
    member.holeScores.length > 0 ||
    member.enteredScores.length > 0 ||
    member.outingResults.length > 0
  ) {
    throw new Error("This pending member already has scoring data and cannot be removed.");
  }

  await prisma.member.delete({
    where: {
      id: memberId,
    },
  });
}

export async function updateMemberRole(memberId: string, role: MemberRole) {
  const record = await prisma.member.update({
    where: {
      id: memberId,
    },
    data: {
      role,
    },
  });

  return mapMemberRecord(record);
}

export async function reassignMemberEmailLink(sourceMemberId: string, targetMemberId: string) {
  if (sourceMemberId === targetMemberId) {
    throw new Error("Choose a different member to move this linked account to.");
  }

  const [sourceMember, targetMember] = await Promise.all([
    prisma.member.findUnique({
      where: {
        id: sourceMemberId,
      },
    }),
    prisma.member.findUnique({
      where: {
        id: targetMemberId,
      },
    }),
  ]);

  if (!sourceMember || !targetMember) {
    throw new Error("One of the selected member records could not be found.");
  }

  if (!sourceMember.email) {
    throw new Error("This member does not currently have a linked email to move.");
  }

  if (targetMember.email && targetMember.email !== sourceMember.email) {
    throw new Error("The selected target member already has a different linked email.");
  }

  if (targetMember.approvalStatus !== "approved") {
    throw new Error("Only approved members can receive a linked account.");
  }

  await prisma.$transaction([
    prisma.member.update({
      where: {
        id: targetMember.id,
      },
      data: {
        email: sourceMember.email,
        image: sourceMember.image ?? targetMember.image,
        isRegistered: true,
        lastLoginAt: sourceMember.lastLoginAt,
      },
    }),
    prisma.member.update({
      where: {
        id: sourceMember.id,
      },
      data: {
        email: null,
        image: null,
        isRegistered: false,
      },
    }),
  ]);
}

export async function deleteMember(memberId: string) {
  const member = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    include: {
      outingPlayers: {
        select: {
          id: true,
        },
      },
      holeScores: {
        select: {
          id: true,
        },
      },
      enteredScores: {
        select: {
          id: true,
        },
      },
      outingResults: {
        select: {
          id: true,
        },
      },
      outingSignatures: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error("The member could not be found.");
  }

  if (
    member.outingPlayers.length > 0 ||
    member.holeScores.length > 0 ||
    member.enteredScores.length > 0 ||
    member.outingResults.length > 0 ||
    member.outingSignatures.length > 0
  ) {
    throw new Error("This member already has outing or scoring history and cannot be deleted.");
  }

  await prisma.member.delete({
    where: {
      id: memberId,
    },
  });
}
