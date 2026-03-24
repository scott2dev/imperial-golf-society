import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { GroupSignatureBoard } from "@/components/scoring/GroupSignatureBoard";
import { ConfirmActionModal } from "@/components/admin/ConfirmActionModal";
import { OutingScorecard } from "@/components/scoring/OutingScorecard";
import { ScoreMarker } from "@/components/scoring/ScoreMarker";
import { ScoreInput } from "@/components/scoring/ScoreInput";
import { prisma } from "@/lib/prisma";
import { calculateStablefordTotal } from "@/lib/scoring";
import {
  claimGroupScorekeeper,
  finalizeOutingSubmissions,
  removeGroupSubmission,
  submitGroupRound,
} from "./actions";

type OutingPageProps = {
  params: Promise<{
    outingId: string;
  }>;
};

type OutingPageData = {
  id: string;
  title: string;
  outingDate: Date;
  status: "draft" | "live" | "completed" | "finalized";
  course: {
    id: string;
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
    isScorekeeper: boolean;
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
    strokesReceived: number;
  }>;
  signatures: Array<{
    memberId: string;
    groupNumber: number;
    signatureData: string;
    signedAt: Date;
  }>;
  outingResults: Array<{
    id: string;
    memberId: string;
    totalPoints: number;
    position: number | null;
    member: {
      id: string;
      name: string;
      handicapIndex: number | { toString(): string };
    };
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

export async function generateMetadata({
  params,
}: OutingPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: "Live Scoring",
    description: `Live outing scoring for ${resolvedParams.outingId}.`,
  };
}

export default async function OutingScoringPage({ params }: OutingPageProps) {
  const member = await getCurrentMember();
  const { outingId } = await params;

  const outingResult: OutingPageData | null = await prisma.outing.findUnique({
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
      outingResults: {
        include: {
          member: true,
        },
        orderBy: [{ position: "asc" }, { totalPoints: "desc" }],
      },
    },
  });

  if (!outingResult) {
    notFound();
  }

  const outing = outingResult;

  const isCaptainOrAdmin = member.role === "captain" || member.role === "admin";
  const isAdmin = member.role === "admin";
  const memberAssignment = outing.players.find((player) => player.memberId === member.id);

  if (!memberAssignment && !isCaptainOrAdmin) {
    redirect("/portal");
  }

  const visibleGroupNumber = memberAssignment?.groupNumber ?? outing.players[0]?.groupNumber;
  const visiblePlayers = memberAssignment
    ? outing.players.filter((player) => player.groupNumber === memberAssignment.groupNumber)
    : [];
  const currentScorekeeper = memberAssignment
    ? visiblePlayers.find((player) => player.isScorekeeper) ?? null
    : null;
  const visibleSignatures = memberAssignment
    ? outing.signatures.filter((signature) => signature.groupNumber === memberAssignment.groupNumber)
    : [];
  const signaturesByMember = new Map(
    outing.signatures.map((signature) => [signature.memberId, signature]),
  );
  const outingPlayersByMember = new Map(
    outing.players.map((player) => [player.memberId, player]),
  );
  const scoresByMember = new Map(
    outing.holeScores.map((score) => [`${score.memberId}-${score.holeNumber}`, score]),
  );
  const scoresByPlayer = new Map(
    outing.players.map((player) => [
      player.memberId,
      outing.holeScores.filter((score) => score.memberId === player.memberId),
    ]),
  );

  const liveGroupTable = visiblePlayers.map((player) => {
    const playerScores = scoresByPlayer.get(player.memberId) ?? [];

    return {
      player,
      holesCompleted: playerScores.length,
      totalPoints: calculateStablefordTotal(playerScores),
      totalGross: playerScores.reduce((total, score) => total + score.grossStrokes, 0),
    };
  });

  const submittedGroups = new Set(
    outing.players.filter((player) => player.submittedAt).map((player) => player.groupNumber),
  );
  const signedVisibleMemberIds = new Set(visibleSignatures.map((signature) => signature.memberId));
  const allVisiblePlayersSigned =
    visiblePlayers.length > 0 &&
    visiblePlayers.every((player) => signedVisibleMemberIds.has(player.memberId));
  const isVisibleGroupSubmitted = memberAssignment
    ? submittedGroups.has(memberAssignment.groupNumber)
    : false;
  const allGroupsSubmitted =
    outing.players.length > 0 && outing.players.every((player) => player.submittedAt !== null);
  const isFinalizedByAdmin = outing.status === "finalized";
  const canShowCaptainResults = allGroupsSubmitted || isFinalizedByAdmin;
  const isSubmissionLocked = canShowCaptainResults;
  const frontNine = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const backNine = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  const eligiblePlayersForResults = canShowCaptainResults
    ? outing.players.filter((player) => allGroupsSubmitted || player.submittedAt !== null)
    : [];
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
    canShowCaptainResults
      ? [...playerPrizeSummaries].sort(
          (left, right) =>
            left.totalGross - right.totalGross ||
            right.totalPoints - left.totalPoints ||
            left.player.member.name.localeCompare(right.player.member.name),
        )[0] ?? null
      : null;

  const twosMoneyWinners =
    canShowCaptainResults
      ? playerPrizeSummaries
          .filter((summary) => summary.twosCount > 0)
          .sort((left, right) => left.player.member.name.localeCompare(right.player.member.name))
      : [];
  const numptyWinner =
    canShowCaptainResults
      ? [...playerPrizeSummaries].sort(
          (left, right) =>
            left.totalPoints - right.totalPoints ||
            right.totalGross - left.totalGross ||
            left.player.member.name.localeCompare(right.player.member.name),
        )[0] ?? null
      : null;

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

  const frontNineWinner = canShowCaptainResults ? getNineHoleWinner(frontNine) : null;
  const backNineWinner = canShowCaptainResults
    ? getNineHoleWinner(
        backNine,
        new Set(frontNineWinner ? [frontNineWinner.player.memberId] : []),
      )
    : null;
  const visibleScorecardScores = Object.fromEntries(
    outing.course.holes.map((hole) => [
      hole.holeNumber,
      Object.fromEntries(
        visiblePlayers
          .map((player) => {
            const score = scoresByMember.get(`${player.memberId}-${hole.holeNumber}`);

            if (!score) {
              return null;
            }

            return [
              player.memberId,
              {
                grossStrokes: score.grossStrokes,
                netStrokes: score.netStrokes,
                stablefordPoints: score.stablefordPoints,
              },
            ] as const;
          })
          .filter((entry): entry is readonly [string, {
            grossStrokes: number;
            netStrokes: number;
            stablefordPoints: number;
          }] => entry !== null),
      ),
    ]),
  );

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Live Scoring
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{outing.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            {new Date(outing.outingDate).toLocaleDateString("en-GB", {
              dateStyle: "full",
            })}{" "}
            at {outing.course.name}. Group members can see only their own live table,
            and the captain/admin can review full results after every group submits.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  Your Group
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                  {memberAssignment ? `Group ${visibleGroupNumber}` : "Captain overview"}
                </h2>
              </div>
              <Link
                href="/portal"
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
              >
                Back to portal
              </Link>
            </div>

            {memberAssignment ? (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {currentScorekeeper ? (
                    <>
                      Current scorekeeper:{" "}
                      <span className="font-semibold">{currentScorekeeper.member.name}</span>
                    </>
                  ) : (
                    "No scorekeeper has been claimed for this group yet."
                  )}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {!memberAssignment.isScorekeeper && !isSubmissionLocked ? (
                    <form action={claimGroupScorekeeper}>
                      <input type="hidden" name="outingId" value={outing.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                      >
                        {currentScorekeeper ? "Take over scorekeeping" : "I'll keep score"}
                      </button>
                    </form>
                  ) : (
                    <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800">
                      You are the scorekeeper for this group
                    </span>
                  )}

                  {submittedGroups.has(memberAssignment.groupNumber) ? (
                    <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-800">
                      This group has submitted its round
                    </span>
                  ) : isFinalizedByAdmin ? (
                    <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800">
                      Submission has been finalized by admin
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-3">
                  {liveGroupTable
                    .sort((left, right) => right.totalPoints - left.totalPoints)
                    .map((entry) => (
                      <article
                        key={entry.player.id}
                        className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-[var(--brand-dark)]">
                              {entry.player.member.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {entry.holesCompleted} holes completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[var(--brand-dark)]">
                              {entry.totalPoints} pts
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                              Gross {entry.totalGross}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
                {!isSubmissionLocked ? (
                  <a
                    href="#group-scorecards"
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)]"
                  >
                    Review full scorecards before signing
                  </a>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-700">
                You are viewing this page as captain/admin rather than as a player in
                the outing.
              </p>
            )}
          </article>

          <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Round Status
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              Submission progress
            </h2>
            <div className="mt-5 grid gap-3">
              {Array.from(new Set(outing.players.map((player) => player.groupNumber))).map(
                (groupNumber) => (
                  <div
                    key={groupNumber}
                    className="rounded-[1.25rem] bg-[var(--surface-strong)] px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>
                        Group {groupNumber}:{" "}
                        {submittedGroups.has(groupNumber) ? "Submitted" : "Still in progress"}
                      </span>
                      {isCaptainOrAdmin && submittedGroups.has(groupNumber) ? (
                        <ConfirmActionModal
                          action={removeGroupSubmission}
                          buttonLabel="Remove submission"
                          buttonClassName="inline-flex min-h-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-800 transition hover:bg-rose-100"
                          title={`Remove Group ${groupNumber} submission`}
                          description="This will reopen the group's round so its scores can be edited again."
                          confirmWord="REMOVE"
                          hiddenFields={{ outingId: outing.id, groupNumber }}
                        />
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>

            {isCaptainOrAdmin ? (
              <div className="mt-6 rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                {allGroupsSubmitted
                  ? "All groups have submitted. Full results and prizes are now visible below."
                  : isFinalizedByAdmin
                    ? "An admin has finalized submissions. Full results and prizes are now visible below."
                    : "Full leaderboard and prize summary unlock for captain/admin when every group has submitted, or when an admin finalizes the outing."}
              </div>
            ) : null}
            {isAdmin && !canShowCaptainResults ? (
              <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-semibold text-amber-900">Finalize submissions</p>
                <p className="mt-1 text-sm text-amber-800">
                  Use this only if a group cannot submit. This will unlock the captain results using the scores currently saved.
                </p>
                <div className="mt-3">
                  <ConfirmActionModal
                    action={finalizeOutingSubmissions}
                    buttonLabel="Finalize submissions"
                    buttonClassName="inline-flex min-h-10 items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                    title="Finalize outing submissions"
                    description="Use this only if a group cannot submit. The outing will be locked and captain results will open using the scores saved so far."
                    confirmWord="FINALIZE"
                    hiddenFields={{ outingId: outing.id }}
                  />
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {memberAssignment ? (
        <section id="group-scorecards" className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {isSubmissionLocked ? "Scorecards" : "Hole Entry"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
              {isSubmissionLocked ? "Group scorecards" : "Hole-by-hole scoring"}
            </h2>
            {isVisibleGroupSubmitted || isFinalizedByAdmin ? (
              <div className="mt-6 grid gap-4">
                {visiblePlayers.map((player) => {
                  const signature =
                    visibleSignatures.find((entry) => entry.memberId === player.memberId) ?? null;
                  const playerScores = (scoresByPlayer.get(player.memberId) ?? []).sort(
                    (left, right) => left.holeNumber - right.holeNumber,
                  );

                  return (
                    <article
                      key={`submitted-scorecard-${player.memberId}`}
                      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[var(--brand-dark)]">
                            {player.member.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Handicap {Number(player.playingHandicap).toFixed(1)} •{" "}
                            {calculateStablefordTotal(playerScores)} pts
                          </p>
                        </div>
                        {signature?.signatureData ? (
                          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[#faf7f1]">
                            <img
                              src={signature.signatureData}
                              alt={`${player.member.name} signature`}
                              className="h-12 w-24 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="inline-flex h-12 w-24 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Unsigned
                          </div>
                        )}
                      </div>
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
                                  key={`${player.memberId}-submitted-${hole.holeNumber}`}
                                  className="border-t border-[var(--border)]"
                                >
                                  <td className="bg-[var(--surface)] px-2 py-1.5 font-semibold text-[var(--brand-dark)]">
                                    {hole.holeNumber}
                                  </td>
                                  <td className="bg-amber-50/60 px-2 py-1.5 text-slate-700">{hole.par}</td>
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
            ) : (
              <>
                <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                    Group Handicap Reference
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visiblePlayers.map((player) => (
                      <div
                        key={`handicap-reference-${player.memberId}`}
                        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--brand-dark)]"
                      >
                        <span className="font-semibold">{player.member.name}</span>
                        <span className="text-slate-600">
                          {" "}
                          ({Number(player.playingHandicap).toFixed(1)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <OutingScorecard
                  outingId={outing.id}
                  holes={outing.course.holes.map((hole) => ({
                    id: hole.id,
                    holeNumber: hole.holeNumber,
                    par: hole.par,
                    strokeIndex: hole.strokeIndex,
                  }))}
                  players={visiblePlayers.map((player) => ({
                    id: player.id,
                    memberId: player.memberId,
                    name: player.member.name,
                  }))}
                  initialScoresByHole={visibleScorecardScores}
                  isScorekeeper={memberAssignment.isScorekeeper && !isSubmissionLocked}
                />
                <GroupSignatureBoard
                  outingId={outing.id}
                  isScorekeeper={memberAssignment.isScorekeeper && !isSubmissionLocked}
                  isSubmitted={isVisibleGroupSubmitted}
                  players={visiblePlayers.map((player) => {
                    const signature =
                      visibleSignatures.find((entry) => entry.memberId === player.memberId) ?? null;

                    return {
                      memberId: player.memberId,
                      name: player.member.name,
                      signatureData: signature?.signatureData ?? null,
                      signedAt: signature?.signedAt.toISOString() ?? null,
                    };
                  })}
                />
                <div className="mt-6 rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                  {allVisiblePlayersSigned
                    ? "All players in this group have signed the scorecard."
                    : `${visibleSignatures.length} of ${visiblePlayers.length} players have signed the scorecard.`}
                </div>
                {memberAssignment.isScorekeeper && !isSubmissionLocked ? (
                  <form action={submitGroupRound} className="mt-4">
                    <input type="hidden" name="outingId" value={outing.id} />
                    <button
                      type="submit"
                      disabled={!allVisiblePlayersSigned}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-dark)] transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit this group round
                    </button>
                  </form>
                ) : null}
              </>
            )}
            {false ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {outing.course.holes.map((hole) => (
                <form
                  key={hole.id}
                  action="#"
                  className="grid gap-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--brand-dark)]">
                          Hole {hole.holeNumber}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Par {hole.par} • Stroke Index {hole.strokeIndex}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        {visiblePlayers.every((player) =>
                          scoresByMember.has(`${player.memberId}-${hole.holeNumber}`),
                        )
                          ? "Saved"
                          : "Awaiting scores"}
                      </div>
                    </div>
                    <input type="hidden" name="outingId" value={outing.id} />
                    <input type="hidden" name="holeNumber" value={hole.holeNumber} />
                    <div className="overflow-x-auto rounded-[1rem] border border-[var(--border)] bg-[var(--surface)]">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-[var(--surface)] text-[var(--brand-dark)]">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Player</th>
                            <th className="px-3 py-2 font-semibold">Gross</th>
                            <th className="px-3 py-2 font-semibold">Net</th>
                            <th className="px-3 py-2 font-semibold">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePlayers.map((player) => {
                            const existingScore = scoresByMember.get(
                              `${player.memberId}-${hole.holeNumber}`,
                            );

                            return (
                              <tr
                                key={`${player.id}-${hole.holeNumber}`}
                                className="border-t border-[var(--border)] text-[var(--brand-dark)]"
                              >
                                <td className="px-3 py-2 font-semibold">{player.member.name}</td>
                                <td className="px-3 py-2">
                                  <ScoreInput
                                    name={`gross-${player.memberId}`}
                                    defaultValue={existingScore?.grossStrokes ?? ""}
                                    disabled
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-600">
                                  {existingScore?.netStrokes ?? "—"}
                                </td>
                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">
                                  {existingScore?.stablefordPoints ?? "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {false ? (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
                        >
                          Save hole {hole.holeNumber}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Only the current scorekeeper can edit these scores.
                      </p>
                    )}
                </form>
              ))}
            </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {isCaptainOrAdmin && canShowCaptainResults ? (
        <>
          <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  Prize Summary
                </p>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                  Visible to captain only
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                Automatic winners
              </h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
                {stablefordPrizeWinners.map((result, index) => (
                  <article
                    key={`stableford-${result.memberId}`}
                    className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                      Stableford {index + 1}
                    </p>
                    <p className="mt-2 font-semibold text-[var(--brand-dark)]">
                      {result.member.name}
                    </p>
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
                    {grossWinner ? `${grossWinner.totalGross} gross` : "Awaiting scores"}
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
                      ? `${twosMoneyWinners.reduce(
                          (total, winner) => total + winner.twosCount,
                          0,
                        )} gross 2${twosMoneyWinners.reduce(
                          (total, winner) => total + winner.twosCount,
                          0,
                        ) === 1
                          ? ""
                          : "s"} in total`
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
                    {numptyWinner ? `${numptyWinner.totalPoints} pts` : "Awaiting scores"}
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  Full Results
                </p>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                  Visible to captain only
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--brand-dark)]">
                Captain leaderboard
              </h2>
              <div className="mt-6 grid gap-3">
                {leaderboardResults.length === 0 ? (
                  <p className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4 text-sm text-slate-700">
                    No results are available yet.
                  </p>
                ) : (
                  leaderboardResults.map((result) => {
                    const player = outingPlayersByMember.get(result.memberId) ?? null;
                    const playerScores = (scoresByPlayer.get(result.memberId) ?? []).sort(
                      (left, right) => left.holeNumber - right.holeNumber,
                    );
                    const signature = signaturesByMember.get(result.memberId) ?? null;

                    return (
                      <details
                        key={result.memberId}
                        className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
                      >
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
                                  {result.position ? `${result.position}. ` : ""}
                                  {result.member.name}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  Group {player?.groupNumber ?? "?"} • Handicap{" "}
                                  {Number(
                                    player?.playingHandicap ?? result.member.handicapIndex,
                                  ).toFixed(1)}
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
                                    <td className="bg-amber-50/60 px-2 py-1.5 text-slate-700">{hole.par}</td>
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

        </>
      ) : null}
    </main>
  );
}
