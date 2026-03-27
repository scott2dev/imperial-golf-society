import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getMemberRecordById, type MemberRole } from "@/lib/member-store";

export function isCaptainLevelRole(role: MemberRole) {
  return role === "captain" || role === "viceCaptain" || role === "admin";
}

export function isHandicapManagerRole(role: MemberRole) {
  return role === "handicapCommittee" || role === "admin";
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return session;
}

export async function getCurrentMember() {
  const session = await requireSession();
  const user = session?.user;

  if (!user || user.needsProfileLink || !user.memberId) {
    redirect("/portal/onboarding");
  }

  if (user.approvalStatus === "pending") {
    redirect("/portal/pending");
  }

  const member = await getMemberRecordById(user.memberId);

  if (!member) {
    redirect("/portal/onboarding");
  }

  if (member.approvalStatus === "pending") {
    redirect("/portal/pending");
  }

  return member;
}

export async function requireCaptain() {
  const member = await getCurrentMember();

  if (!isCaptainLevelRole(member.role)) {
    redirect("/portal");
  }

  return {
    user: member,
  };
}

export async function requireAdmin() {
  const member = await getCurrentMember();

  if (member.role !== "admin") {
    redirect("/portal");
  }

  return {
    user: member,
  };
}

async function requireOneOfRoles(roles: MemberRole[]) {
  const member = await getCurrentMember();

  if (!roles.includes(member.role)) {
    redirect("/portal");
  }

  return {
    user: member,
  };
}

export async function requireTreasurer() {
  return requireOneOfRoles(["treasurer", "admin"]);
}

export async function requireSecretary() {
  return requireOneOfRoles(["secretary", "admin"]);
}

export async function requireHandicapCommittee() {
  return requireOneOfRoles(["handicapCommittee", "admin"]);
}
