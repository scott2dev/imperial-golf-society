"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createPendingMemberRequest,
  linkAuthenticatedUserToMember,
} from "@/lib/member-store";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(message: string) {
  redirect(`/portal/onboarding?error=${encodeURIComponent(message)}`);
}

export async function claimExistingMember(formData: FormData) {
  const session = await requireSession();
  const email = session.user.email?.trim().toLowerCase();
  const memberId = getTrimmedString(formData, "memberId");

  if (!email) {
    redirect("/login");
  }

  if (!memberId) {
    redirectWithError("Please select your name from the list.");
  }

  try {
    await linkAuthenticatedUserToMember({
      email,
      image: session.user.image,
      memberId,
    });
  } catch (error) {
    redirectWithError(
      error instanceof Error ? error.message : "We could not link that member profile.",
    );
  }

  revalidatePath("/portal");
  revalidatePath("/portal/onboarding");
  redirect("/portal");
}

export async function requestNewMemberProfile(formData: FormData) {
  const session = await requireSession();
  const email = session.user.email?.trim().toLowerCase();
  const name = getTrimmedString(formData, "name");
  const handicapRaw = getTrimmedString(formData, "handicapIndex");
  const handicapIndex = Number(handicapRaw);

  if (!email) {
    redirect("/login");
  }

  if (!name) {
    redirectWithError("Please enter the member name you want added.");
  }

  if (!Number.isFinite(handicapIndex) || handicapIndex < 0 || handicapIndex > 54) {
    redirectWithError("Please enter a handicap between 0.0 and 54.0.");
  }

  try {
    await createPendingMemberRequest({
      email,
      image: session.user.image,
      name,
      handicapIndex,
    });
  } catch (error) {
    redirectWithError(
      error instanceof Error ? error.message : "We could not submit that member request.",
    );
  }

  revalidatePath("/portal");
  revalidatePath("/portal/onboarding");
  revalidatePath("/portal/captain");
  redirect("/portal/pending?requested=1");
}
