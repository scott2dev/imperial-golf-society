import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScoreMarker } from "@/components/scoring/ScoreMarker";
import { getSession } from "@/lib/auth";
import { getMemberRecordById } from "@/lib/member-store";
import { prisma } from "@/lib/prisma";
import { calculateStablefordTotal } from "@/lib/scoring";

type ResultsPageProps = {
  params: Promise<{
    outingId: string;
  }>;
};

type ResultsPageData = {
  id: string;
  title: string;
  outingDate: Date;
  status: "draft" | "live" | "completed" | "finalized";
  resultsPublishedAt: Date | null;
  course: {
    name: string;
    holes: Array<{
      id: string;
      holeNumber: number;
      par: number;
      strokeIndex: number;
    }>;
  };
  players: Array<{
    id: string;
    memberId: string;
    groupNumber: number;
    submittedAt: Date | null;
    playingHandicap: number | { toString(): string };
    member: {
      id: string;
      name: string;
      handicapIndex: number | { toString(): string };
    };
  }>;
  holeScores: Array<{
    memberId: string;
    holeNumber: number;
    grossStrokes: number;
    netStrokes: number;
    stablefordPoints: number;
  }>;
  signatures: Array<{
    memberId: string;
    signatureData: string;
    signedAt: Date;
  }>;
};

function sumStablefordPoints(
  scores: Array<{ holeNumber: number; stablefordPoints: number }>,
  holeNumbers: number[],
) {
  return scores
    .filter((score) => holeNumbers.includes(score.holeNumber))
    .reduce((total, score) => total + score.stablefordPoints, 0);
}

function sumGrossStrokes(
  scores: Array<{ holeNumber: number; grossStrokes: number }>,
  holeNumbers: number[],
) {
  return scores
    .filter((score) => holeNumbers.includes(score.holeNumber))
    .reduce((total, score) => total + score.grossStrokes, 0);
}

export async function generateMetadata({ params }: ResultsPageProps): Promise<Metadata> {
  const { outingId } = await params;

  return {
    title: "Results",
    description: `Results for outing ${outingId}.`,
  };
}

export default async function PublicOutingResultsPage({ params }: ResultsPageProps) {
  const { outingId } = await params;
  const session = await getSession();
  const member =
    session?.user?.memberId ? await getMemberRecordById(session.user.memberId) : null;

  const outing: ResultsPageData | null = await prisma.outing.findUnique({
    where: {
      id: outingId,
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
        include: {
          member: true,
        },
        orderBy: [{ groupNumber: "asc" }, { member: { name: "asc" } }],
      },
      holeScores: true,
      signatures: true,
    },
  });

  if (!outing) {
    notFound();
  }

  const isCaptainOrAdmin = member?.role === "captain" || member?.role === "admin";
  const allGroupsSubmitted =
    outing.players.length > 0 && outing.players.every((player) => player.submittedAt !== null);
  const isFinalizedByAdmin = outing.status === "finalized";
  const canShowCaptainResults = allGroupsSubmitted || isFinalizedByAdmin;
  const isPublished = Boolean(outing.resultsPublishedAt);
  const canViewResults = isPublished || (isCaptainOrAdmin && canShowCaptainResults);

  if (!canViewResults) {
    redirect("/results");
  }

  const scoresByPlayer = new Map(
    outing.players.map((player) => [
      player.memberId,
      outing.holeScores.filter((score) => score.memberId === player.memberId),
    ]),
  );
  const signaturesByMember = new Map(
    outing.signatures.map((signature) => [signature.memberId, signature]),
  );
  const frontNine = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const backNine = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  const eligiblePlayersForResults = outing.players.filter(
    (player) => allGroupsSubmitted || player.submittedAt !== null,
  );
  const leaderboardResults = eligiblePlayersForResults
    .map((player) => {
      const playerScores = scoresByPlayer.get(player.memberId) ?? [];

      return {
        memberId: player.memberId,
        member: player.member,
        player,
        totalPoints: calculateStablefordTotal(playerScores),
        totalGross: playerScores.reduce((total, score) => total + score.grossStrokes, 0),
        twosCount: playerScores.filter((score) => score.grossStrokes === 2).length,
      };
    })
    .sort(
      (left, right) =>
        right.totalPoints - left.totalPoints ||
        left.totalGross - right.totalGross ||
        left.member.name.localeCompare(right.member.name),
    )
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

  const stablefordPrizeWinners = leaderboardResults.slice(0, 3);
  const podiumIds = new Set(stablefordPrizeWinners.map((result) => result.memberId));
  const playerPrizeSummaries = leaderboardResults.map((result) => ({
    player: result.player,
    totalPoints: result.totalPoints,
    totalGross: result.totalGross,
    twosCount: result.twosCount,
  }));
  const grossWinner =
    [...playerPrizeSummaries].sort(
      (left, right) =>
        left.totalGross - right.totalGross ||
        right.totalPoints - left.totalPoints ||
        left.player.member.name.localeCompare(right.player.member.name),
    )[0] ?? null;
  const twosMoneyWinners = playerPrizeSummaries
    .filter((summary) => summary.twosCount > 0)
    .sort((left, right) => left.player.member.name.localeCompare(right.player.member.name));
  const numptyWinner =
    [...playerPrizeSummaries].sort(
      (left, right) =>
        left.totalPoints - right.totalPoints ||
        right.totalGross - left.totalGross ||
        left.player.member.name.localeCompare(right.player.member.name),
    )[0] ?? null;

  function getNineHoleWinner(holeNumbers: number[], excludedMemberIds = new Set<string>()) {
    return (
      eligiblePlayersForResults
        .filter(
          (player) =>
            !podiumIds.has(player.memberId) && !excludedMemberIds.has(player.memberId),
        )
        .map((player) => {
          const playerScores = scoresByPlayer.get(player.memberId) ?? [];

          return {
            player,
            points: sumStablefordPoints(playerScores, holeNumbers),
            gross: sumGrossStrokes(playerScores, holeNumbers),
          };
        })
        .sort(
          (left, right) =>
            right.points - left.points ||
            left.gross - right.gross ||
            left.player.member.name.localeCompare(right.player.member.name),
        )[0] ?? null
    );
  }

  const frontNineWinner = getNineHoleWinner(frontNine);
  const backNineWinner = getNineHoleWinner(
    backNine,
    new Set(frontNineWinner ? [frontNineWinner.player.memberId] : []),
  );

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Results
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{outing.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            {new Date(outing.outingDate).toLocaleDateString("en-GB", {
              dateStyle: "full",
            })}{" "}
            at {outing.course.name}.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Results
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                {isPublished ? "Published results" : "Captain review"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isPublished
                  ? "These results have been published and are now visible to all members."
                  : "These results are currently visible only to the captain/admin until they are published."}
              </p>
            </div>
            <Link
              href={isCaptainOrAdmin ? `/portal/outings/${outing.id}` : "/results"}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
            >
              {isCaptainOrAdmin ? "Back to outing" : "Back to results"}
            </Link>
          </div>

          {isCaptainOrAdmin && !isPublished ? (
            <div className="mt-4 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
              Visible to captain only
            </div>
          ) : null}

          {isFinalizedByAdmin && !allGroupsSubmitted ? (
            <p className="mt-4 text-sm text-slate-700">
              This outing was finalized before every group submitted. Only the groups that had already submitted are included below.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-[var(--brand-dark)]">Prize Summary</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            {stablefordPrizeWinners.map((result, index) => (
              <article key={`stableford-${result.memberId}`} className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  Stableford {index + 1}
                </p>
                <p className="mt-2 font-semibold text-[var(--brand-dark)]">{result.member.name}</p>
                <p className="mt-1 text-sm text-slate-600">{result.totalPoints} pts</p>
              </article>
            ))}
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Best Front 9
              </p>
              <p className="mt-2 font-semibold text-[var(--brand-dark)]">
                {frontNineWinner ? frontNineWinner.player.member.name : "No eligible player"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {frontNineWinner ? `${frontNineWinner.points} pts` : "Top 3 excluded"}
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Best Back 9
              </p>
              <p className="mt-2 font-semibold text-[var(--brand-dark)]">
                {backNineWinner ? backNineWinner.player.member.name : "No eligible player"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {backNineWinner ? `${backNineWinner.points} pts` : "Top 3 excluded"}
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Gross Winner
              </p>
              <p className="mt-2 font-semibold text-[var(--brand-dark)]">
                {grossWinner ? grossWinner.player.member.name : "No result"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {grossWinner ? `${grossWinner.totalGross} gross` : "No result"}
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                2&apos;s Money
              </p>
              <p className="mt-2 font-semibold text-[var(--brand-dark)]">
                {twosMoneyWinners.length > 0
                  ? twosMoneyWinners.map((winner) => winner.player.member.name).join(", ")
                  : "No winner"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {twosMoneyWinners.length > 0
                  ? `${twosMoneyWinners.reduce((total, winner) => total + winner.twosCount, 0)} gross 2${twosMoneyWinners.reduce((total, winner) => total + winner.twosCount, 0) === 1 ? "" : "s"} in total`
                  : "No gross 2s recorded"}
              </p>
            </article>
            <article className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Numpty
              </p>
              <p className="mt-2 font-semibold text-[var(--brand-dark)]">
                {numptyWinner ? numptyWinner.player.member.name : "No result"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {numptyWinner ? `${numptyWinner.totalPoints} pts` : "No result"}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-[var(--brand-dark)]">Full Results</h2>
          <div className="mt-6 grid gap-3">
            {leaderboardResults.length === 0 ? (
              <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                No results are available yet.
              </p>
            ) : (
              leaderboardResults.map((result) => {
                const playerScores = (scoresByPlayer.get(result.memberId) ?? []).sort(
                  (left, right) => left.holeNumber - right.holeNumber,
                );
                const signature = signaturesByMember.get(result.memberId) ?? null;

                return (
                  <details key={result.memberId} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div>
                            {signature?.signatureData ? (
                              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[#faf7f1]">
                                <img
                                  src={signature.signatureData}
                                  alt={`${result.member.name} signature`}
                                  className="h-12 w-24 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="inline-flex h-12 w-24 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Unsigned
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--brand-dark)]">
                              {result.position}. {result.member.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Group {result.player.groupNumber} • Handicap{" "}
                              {Number(result.player.playingHandicap).toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--brand-dark)]">
                            {result.totalPoints} pts
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            Click to view shots
                          </p>
                        </div>
                      </div>
                    </summary>
                    <div className="mt-4 overflow-x-auto rounded-[1rem] border border-[var(--border)] bg-white">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="text-[var(--brand-dark)]">
                          <tr>
                            <th className="bg-[var(--surface)] px-2 py-1.5 font-semibold">Hole</th>
                            <th className="bg-amber-50/80 px-2 py-1.5 font-semibold">Par</th>
                            <th className="bg-stone-50 px-2 py-1.5 font-semibold">Gross</th>
                            <th className="bg-sky-50/80 px-2 py-1.5 font-semibold">Net</th>
                            <th className="bg-emerald-50/80 px-2 py-1.5 font-semibold">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outing.course.holes.map((hole) => {
                            const score =
                              playerScores.find((entry) => entry.holeNumber === hole.holeNumber) ??
                              null;

                            return (
                              <tr
                                key={`${result.memberId}-${hole.holeNumber}`}
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
                  </details>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
