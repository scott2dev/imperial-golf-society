import type { Metadata } from "next";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Portal",
  description: "Protected member portal for outings and live scoring.",
};

type PortalOuting = {
  id: string;
  title: string;
  outingDate: Date;
  course: {
    name: string;
  };
  players: Array<{
    groupNumber: number;
    isScorekeeper: boolean;
  }>;
};

export default async function PortalPage() {
  const member = await getCurrentMember();
  const upcomingOutings: PortalOuting[] = await prisma.outing.findMany({
    orderBy: { outingDate: "asc" },
    include: {
      course: true,
      players: {
        where: {
          memberId: member.id,
        },
      },
    },
    take: 5,
  });

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Member Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Welcome back, {member.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            This is your place to check upcoming outings, view your group, and
            keep up with scoring on the day.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Your profile
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Your membership details
            </h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Email
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">{member.email}</dd>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Role
                </dt>
                <dd className="mt-2 text-sm font-medium capitalize text-slate-800">
                  {member.role}
                </dd>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Handicap Index
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  {member.handicapIndex.toFixed(1)}
                </dd>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Last Sign-In
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  {new Date(member.lastLoginAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            </dl>
          </article>

          <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {member.role === "admin"
                ? "Admin Controls"
                : member.role === "captain"
                  ? "Captain Controls"
                  : "Member Info"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              {member.role === "admin" || member.role === "captain"
                ? "Manage the day"
                : "What you can do here"}
            </h2>
            {member.role === "admin" || member.role === "captain" ? (
              <div className="mt-5">
                <p className="text-sm leading-6 text-slate-700">
                  Open the admin area to create outings, update courses, organise
                  groups, and keep everything ready for match day.
                </p>
                <Link
                  href="/portal/captain"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                >
                  Open admin area
                </Link>
              </div>
            ) : (
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
                <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                  Your upcoming outings and group details will appear here once
                  they have been confirmed.
                </li>
                <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                  On the day, your group can use this portal to keep score and
                  check the live standings.
                </li>
                <li className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3">
                  When the round is complete, your final scores and results will
                  be available here to review.
                </li>
              </ul>
            )}

            <SignOutButton
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
            />
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Upcoming Outings
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Your upcoming golf
          </h2>
          <div className="mt-6 grid gap-3">
            {upcomingOutings.length === 0 ? (
              <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                You do not have any upcoming outings assigned yet.
              </p>
            ) : (
              upcomingOutings.map((outing) => {
                const assignment = outing.players[0];

                return (
                  <article
                    key={outing.id}
                    className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                  >
                    <p className="font-semibold text-[var(--brand-dark)]">{outing.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(outing.outingDate).toLocaleDateString("en-GB", {
                        dateStyle: "medium",
                      })}{" "}
                      at {outing.course.name}
                    </p>
                    {assignment ? (
                      <>
                        <p className="mt-2 text-sm text-slate-700">
                          Group {assignment.groupNumber}
                          {assignment.isScorekeeper ? " • You are the scorekeeper" : ""}
                        </p>
                        <Link
                          href={`/portal/outings/${outing.id}`}
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-white"
                        >
                          Open outing
                        </Link>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700">
                        This outing is in the calendar, and your group will be added soon.
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

