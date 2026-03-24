import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getMemberRecordById } from "@/lib/member-store";

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

  if (member.role !== "captain" && member.role !== "admin") {
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
