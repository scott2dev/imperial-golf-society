import type { Metadata } from "next";
import SignOutButton from "@/components/auth/SignOutButton";
import { getSession } from "@/lib/auth";
import type { MemberRecord } from "@/lib/member-store";
import { getApprovedUnlinkedMembers } from "@/lib/member-store";
import { claimExistingMember, requestNewMemberProfile } from "./actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Link Member Profile",
  description: "Choose or request the golf society member profile linked to your Google account.",
};

type OnboardingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function MemberOnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (session.user.memberId && session.user.approvalStatus === "approved") {
    redirect("/portal");
  }

  if (session.user.approvalStatus === "pending") {
    redirect("/portal/pending");
  }

  const [availableMembers, params]: [
    MemberRecord[],
    Awaited<OnboardingPageProps["searchParams"]>,
  ] = await Promise.all([
    getApprovedUnlinkedMembers(),
    searchParams,
  ]);

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Member Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Link your Google account to the right member record
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Choose your existing member name so your handicap and future scoring
            history stay attached to the correct player. If your name is not here,
            you can request a new member profile for captain or admin approval.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-5xl px-4 sm:mt-8 sm:px-6">
        {params?.error ? (
          <p className="mb-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {params.error}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Existing Member
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Choose your name
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Signed in as <span className="font-semibold">{session.user.email}</span>.
            </p>

            {availableMembers.length === 0 ? (
              <p className="mt-6 rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                There are no unlinked member names available right now, so use the
                request form instead.
              </p>
            ) : (
              <form action={claimExistingMember} className="mt-6 grid gap-4">
                <label className="text-sm font-semibold text-[var(--brand-dark)]">
                  Member name
                  <select
                    name="memberId"
                    required
                    defaultValue=""
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  >
                    <option value="" disabled>
                      Select your name
                    </option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.handicapIndex.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                >
                  Link this member profile
                </button>
              </form>
            )}
          </article>

          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              New Member
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Request a new member profile
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              If your name is not on the existing list, submit it here with your
              handicap. Captain or admin approval is required before portal access
              is unlocked.
            </p>

            <form action={requestNewMemberProfile} className="mt-6 grid gap-4">
              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Full member name
                <input
                  name="name"
                  required
                  placeholder="R Scott"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--brand-dark)]">
                Handicap index
                <input
                  type="number"
                  name="handicapIndex"
                  min={0}
                  max={54}
                  step={0.1}
                  required
                  placeholder="12.4"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
              >
                Submit approval request
              </button>
            </form>

            <SignOutButton
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
            />
          </article>
        </div>
      </section>
    </main>
  );
}
