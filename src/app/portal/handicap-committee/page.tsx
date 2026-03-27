import type { Metadata } from "next";
import { ConfirmActionModal } from "@/components/admin/ConfirmActionModal";
import { updateMemberHandicap } from "@/app/portal/captain/actions";
import { requireHandicapCommittee } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Handicap Committee Portal",
  description: "Handicap management tools for the committee.",
};

type HandicapMember = {
  id: string;
  name: string;
  email: string | null;
  handicapIndex: number | { toString(): string };
  isRegistered: boolean;
};

export default async function HandicapCommitteePortalPage() {
  const { user } = await requireHandicapCommittee();
  const members: HandicapMember[] = await prisma.member.findMany({
    where: {
      approvalStatus: "approved",
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      handicapIndex: true,
      isRegistered: true,
    },
  });

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Handicap Committee
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Use this area to update member handicaps so upcoming groups and scoring
            remain accurate.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Handicap Updates
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Approved members
          </h2>

          <div className="mt-6 grid gap-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--brand-dark)]">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {member.email ?? "No account linked yet"}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Handicap {Number(member.handicapIndex).toFixed(1)} •{" "}
                      {member.isRegistered ? "Registered" : "Awaiting first sign-in"}
                    </p>
                  </div>

                  <ConfirmActionModal
                    action={updateMemberHandicap}
                    buttonLabel="Edit handicap"
                    buttonClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                    title="Edit player handicap"
                    description={`Update ${member.name}'s handicap for future group assignments and unsubmitted outings.`}
                    hiddenFields={{ memberId: member.id }}
                    confirmButtonLabel="Save handicap"
                  >
                    <label className="text-sm font-semibold text-[var(--brand-dark)]">
                      Handicap
                      <input
                        type="number"
                        name="handicapIndex"
                        min={0}
                        max={54}
                        step={0.1}
                        defaultValue={Number(member.handicapIndex).toFixed(1)}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                      />
                    </label>
                  </ConfirmActionModal>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
