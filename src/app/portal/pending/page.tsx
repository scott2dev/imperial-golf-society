import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Awaiting Approval",
  description: "Your member profile request is waiting for captain or admin approval.",
};

type PendingPageProps = {
  searchParams?: Promise<{
    requested?: string;
  }>;
};

export default async function PendingMemberApprovalPage({
  searchParams,
}: PendingPageProps) {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (session.user.needsProfileLink || !session.user.memberId) {
    redirect("/portal/onboarding");
  }

  if (session.user.approvalStatus === "approved") {
    redirect("/portal");
  }

  const params = await searchParams;

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Member Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Your member request is awaiting approval
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Captain or admin approval is still needed before this Google account
            can access the protected portal and scorekeeping tools.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-4xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          {params?.requested === "1" ? (
            <p className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              Your new member request was submitted successfully.
            </p>
          ) : null}

          <h2 className="mt-4 text-2xl font-semibold text-[var(--brand-dark)]">
            What happens next
          </h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
            <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
              A captain or admin will review your requested name and handicap.
            </li>
            <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
              Once approved, signing in again will take you straight into the portal.
            </li>
            <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
              Signed in as <span className="font-semibold">{session.user.email}</span>.
            </li>
          </ul>

          <SignOutButton
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
          />
        </div>
      </section>
    </main>
  );
}
