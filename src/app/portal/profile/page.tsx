import type { Metadata } from "next";
import Link from "next/link";
import { HandicapHistoryChart } from "@/components/profile/HandicapHistoryChart";
import { ScoreMarker } from "@/components/scoring/ScoreMarker";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Your Profile",
  description: "Review your scorecards, finishing positions, and handicap history.",
};

type ProfileOuting = {
  id: string;
  title: string;
  outingDate: Date;
  status: "draft" | "live" | "completed" | "finalized";
  resultsPublishedAt: Date | null;
  course: {
    name: string;
    holes: Array<{
      holeNumber: number;
      par: number;
    }>;
  };
  players: Array<{
    groupNumber: number;
    playingHandicap: number | { toString(): string };
    submittedAt: Date | null;
  }>;
  holeScores: Array<{
    holeNumber: number;
    grossStrokes: number;
    netStrokes: number;
    stablefordPoints: number;
  }>;
  outingResults: Array<{
    position: number | null;
    totalPoints: number;
  }>;
};

type HandicapHistoryEntry = {
  handicapIndex: number | { toString(): string };
  effectiveAt: Date;
};

export default async function ProfilePage() {
  const member = await getCurrentMember();

  const [previousOutings, handicapHistory] = await Promise.all([
    prisma.outing.findMany({
      where: {
        players: {
          some: {
            memberId: member.id,
          },
        },
        holeScores: {
          some: {
            memberId: member.id,
          },
        },
      },
      orderBy: {
        outingDate: "desc",
      },
      include: {
        course: {
          include: {
            holes: {
              orderBy: {
                holeNumber: "asc",
              },
            },
          },
        },
        players: {
          where: {
            memberId: member.id,
          },
          select: {
            groupNumber: true,
            playingHandicap: true,
            submittedAt: true,
          },
        },
        holeScores: {
          where: {
            memberId: member.id,
          },
          orderBy: {
            holeNumber: "asc",
          },
          select: {
            holeNumber: true,
            grossStrokes: true,
            netStrokes: true,
            stablefordPoints: true,
          },
        },
        outingResults: {
          where: {
            memberId: member.id,
          },
          select: {
            position: true,
            totalPoints: true,
          },
        },
      },
    }) as Promise<ProfileOuting[]>,
    prisma.memberHandicapHistory.findMany({
      where: {
        memberId: member.id,
      },
      orderBy: {
        effectiveAt: "asc",
      },
      select: {
        handicapIndex: true,
        effectiveAt: true,
      },
    }) as Promise<HandicapHistoryEntry[]>,
  ]);

  const chartPointsSource =
    handicapHistory.length > 0
      ? handicapHistory
      : [
          {
            handicapIndex: member.handicapIndex,
            effectiveAt: new Date(member.updatedAt),
          },
        ];

  const handicapChartPoints = chartPointsSource.map((entry) => ({
    label: new Date(entry.effectiveAt).toLocaleDateString("en-GB", {
      dateStyle: "medium",
    }),
    shortLabel: new Date(entry.effectiveAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    handicapIndex: Number(entry.handicapIndex),
  }));

  const bestFinish =
    previousOutings
      .map((outing) => outing.outingResults[0]?.position ?? null)
      .filter((position): position is number => position !== null)
      .sort((left, right) => left - right)[0] ?? null;

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Your Profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{member.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-100/85 sm:text-base">
            Review your past scorecards, see where you finished in each outing,
            and track how your handicap has moved over time.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="mx-auto max-w-[34rem] lg:max-w-5xl">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Profile Snapshot
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Your membership at a glance
            </h2>
            <dl className="mt-6 grid gap-4">
              <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Current handicap index
                </dt>
                <dd className="mt-2 text-3xl font-semibold text-[var(--brand-dark)]">
                  {member.handicapIndex.toFixed(1)}
                </dd>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Scorecards saved
                  </dt>
                  <dd className="mt-2 text-xl font-semibold text-[var(--brand-dark)]">
                    {previousOutings.length}
                  </dd>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Best finish
                  </dt>
                  <dd className="mt-2 text-xl font-semibold text-[var(--brand-dark)]">
                    {bestFinish ? `${bestFinish}${bestFinish === 1 ? "st" : bestFinish === 2 ? "nd" : bestFinish === 3 ? "rd" : "th"}` : "Not yet ranked"}
                  </dd>
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Linked email
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  {member.email ?? "No linked email"}
                </dd>
              </div>
            </dl>
            <Link
              href="/portal"
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
            >
              Back to portal
            </Link>
          </article>

          <article className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Handicap History
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              How your handicap has moved
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              This chart tracks the handicap index stored against your member profile
              whenever it is updated.
            </p>
            <div className="mt-6 min-w-0">
              <HandicapHistoryChart points={handicapChartPoints} />
            </div>
          </article>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Previous Scorecards
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
            Your rounds and finishing positions
          </h2>

          <div className="mt-6 overflow-x-auto pb-2">
            {previousOutings.length === 0 ? (
              <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                Your past scorecards will appear here once you have completed an outing.
              </p>
            ) : (
              <div className="flex snap-x snap-mandatory gap-4">
                {previousOutings.map((outing) => {
                  const assignment = outing.players[0] ?? null;
                  const result = outing.outingResults[0] ?? null;
                  const totalPoints = outing.holeScores.reduce(
                    (sum, score) => sum + score.stablefordPoints,
                    0,
                  );

                  return (
                    <article
                      key={outing.id}
                      className="min-w-full snap-start rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--brand-dark)]">
                            {outing.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {new Date(outing.outingDate).toLocaleDateString("en-GB", {
                              dateStyle: "medium",
                            })}{" "}
                            at {outing.course.name}
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm sm:text-right">
                          <p className="font-semibold text-[var(--brand-dark)]">
                            {result?.position
                              ? `Finished ${result.position}${result.position === 1 ? "st" : result.position === 2 ? "nd" : result.position === 3 ? "rd" : "th"}`
                              : "Finishing place not yet published"}
                          </p>
                          <p className="text-slate-600">{totalPoints} Stableford pts</p>
                          {assignment ? (
                            <p className="text-slate-600">
                              Group {assignment.groupNumber} • Handicap{" "}
                              {Number(assignment.playingHandicap).toFixed(1)}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-[1rem] border border-[var(--border)] bg-white">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead className="text-[var(--brand-dark)]">
                            <tr>
                              <th className="bg-[var(--surface)] px-2 py-1.5 font-semibold">
                                Hole
                              </th>
                              <th className="bg-amber-50/80 px-2 py-1.5 font-semibold">Par</th>
                              <th className="bg-stone-50 px-2 py-1.5 font-semibold">Gross</th>
                              <th className="bg-sky-50/80 px-2 py-1.5 font-semibold">Net</th>
                              <th className="bg-emerald-50/80 px-2 py-1.5 font-semibold">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outing.course.holes.map((hole) => {
                              const score =
                                outing.holeScores.find(
                                  (entry) => entry.holeNumber === hole.holeNumber,
                                ) ?? null;

                              return (
                                <tr
                                  key={`${outing.id}-${hole.holeNumber}`}
                                  className="border-t border-[var(--border)]"
                                >
                                  <td className="bg-[var(--surface)] px-2 py-1.5 font-semibold text-[var(--brand-dark)]">
                                    {hole.holeNumber}
                                  </td>
                                  <td className="bg-amber-50/60 px-2 py-1.5 text-slate-700">
                                    {hole.par}
                                  </td>
                                  <td className="bg-stone-50 px-2 py-1.5 text-slate-700">
                                    <ScoreMarker grossStrokes={score?.grossStrokes} par={hole.par} />
                                  </td>
                                  <td className="bg-sky-50/60 px-2 py-1.5 text-slate-700">
                                    {score?.netStrokes ?? "—"}
                                  </td>
                                  <td className="bg-emerald-50/60 px-2 py-1.5 font-semibold text-[var(--brand-dark)]">
                                    {score?.stablefordPoints ?? "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
