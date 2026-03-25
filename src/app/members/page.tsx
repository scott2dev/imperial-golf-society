import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prizeColumns, type PrizeColumnKey } from "@/lib/members-data";
import { prisma } from "@/lib/prisma";
import { calculateStablefordTotal } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Members",
  description: "Member handicaps and prize totals for the season.",
};

type MembersPageData = {
  id: string;
  name: string;
  handicapIndex: number | { toString(): string };
};

type PublishedOutingData = {
  id: string;
  status: "draft" | "live" | "completed" | "finalized";
  players: Array<{
    memberId: string;
    submittedAt: Date | null;
    member: {
      id: string;
      name: string;
    };
  }>;
  holeScores: Array<{
    memberId: string;
    holeNumber: number;
    grossStrokes: number;
    stablefordPoints: number;
  }>;
};

type MembersTableRow = {
  id: string;
  name: string;
  handicap: string;
} & Record<PrizeColumnKey, number>;

function createEmptyPrizeTotals() {
  return {
    firstPrize: 0,
    secondPrize: 0,
    thirdPrize: 0,
    bestFrontNine: 0,
    bestBackNine: 0,
    grossPrize: 0,
    nearestToPin: 0,
    nearestToPinInTwo: 0,
    longestDrive: 0,
    twosMoney: 0,
    numptyPrize: 0,
  } satisfies Record<PrizeColumnKey, number>;
}

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

export default async function MembersPage() {
  const [memberRecords, outings]: [MembersPageData[], PublishedOutingData[]] = await Promise.all([
    prisma.member.findMany({
      where: {
        approvalStatus: "approved",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        handicapIndex: true,
      },
    }),
    prisma.outing.findMany({
      where: {
        resultsPublishedAt: {
          not: null,
        },
      },
      include: {
        players: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ groupNumber: "asc" }, { member: { name: "asc" } }],
        },
        holeScores: {
          select: {
            memberId: true,
            holeNumber: true,
            grossStrokes: true,
            stablefordPoints: true,
          },
        },
      },
      orderBy: {
        outingDate: "desc",
      },
    }),
  ]);

  const prizeTotalsByMember = new Map(
    memberRecords.map((member) => [member.id, createEmptyPrizeTotals()]),
  );
  const frontNine = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const backNine = [10, 11, 12, 13, 14, 15, 16, 17, 18];

  for (const outing of outings) {
    const allGroupsSubmitted =
      outing.players.length > 0 && outing.players.every((player) => player.submittedAt !== null);
    const eligiblePlayers = outing.players.filter(
      (player) => allGroupsSubmitted || player.submittedAt !== null,
    );

    if (eligiblePlayers.length === 0) {
      continue;
    }

    const scoresByPlayer = new Map(
      eligiblePlayers.map((player) => [
        player.memberId,
        outing.holeScores.filter((score) => score.memberId === player.memberId),
      ]),
    );

    const leaderboardResults = eligiblePlayers
      .map((player) => {
        const playerScores = scoresByPlayer.get(player.memberId) ?? [];

        return {
          memberId: player.memberId,
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
          left.player.member.name.localeCompare(right.player.member.name),
      );

    const stablefordPrizeWinners = leaderboardResults.slice(0, 3);
    const stablefordPrizeKeys: PrizeColumnKey[] = [
      "firstPrize",
      "secondPrize",
      "thirdPrize",
    ];

    stablefordPrizeWinners.forEach((winner, index) => {
      const prizeTotals = prizeTotalsByMember.get(winner.memberId);

      if (prizeTotals) {
        prizeTotals[stablefordPrizeKeys[index]] += 1;
      }
    });

    const podiumIds = new Set(stablefordPrizeWinners.map((result) => result.memberId));
    const grossWinner =
      [...leaderboardResults].sort(
        (left, right) =>
          left.totalGross - right.totalGross ||
          right.totalPoints - left.totalPoints ||
          left.player.member.name.localeCompare(right.player.member.name),
      )[0] ?? null;

    if (grossWinner) {
      const prizeTotals = prizeTotalsByMember.get(grossWinner.memberId);

      if (prizeTotals) {
        prizeTotals.grossPrize += 1;
      }
    }

    leaderboardResults
      .filter((result) => result.twosCount > 0)
      .forEach((result) => {
        const prizeTotals = prizeTotalsByMember.get(result.memberId);

        if (prizeTotals) {
          prizeTotals.twosMoney += 1;
        }
      });

    const numptyWinner =
      [...leaderboardResults].sort(
        (left, right) =>
          left.totalPoints - right.totalPoints ||
          right.totalGross - left.totalGross ||
          left.player.member.name.localeCompare(right.player.member.name),
      )[0] ?? null;

    if (numptyWinner) {
      const prizeTotals = prizeTotalsByMember.get(numptyWinner.memberId);

      if (prizeTotals) {
        prizeTotals.numptyPrize += 1;
      }
    }

    function getNineHoleWinner(holeNumbers: number[], excludedMemberIds = new Set<string>()) {
      return (
        eligiblePlayers
          .filter(
            (player) =>
              !podiumIds.has(player.memberId) && !excludedMemberIds.has(player.memberId),
          )
          .map((player) => {
            const playerScores = scoresByPlayer.get(player.memberId) ?? [];

            return {
              memberId: player.memberId,
              points: sumStablefordPoints(playerScores, holeNumbers),
              gross: sumGrossStrokes(playerScores, holeNumbers),
              name: player.member.name,
            };
          })
          .sort(
            (left, right) =>
              right.points - left.points ||
              left.gross - right.gross ||
              left.name.localeCompare(right.name),
          )[0] ?? null
      );
    }

    const frontNineWinner = getNineHoleWinner(frontNine);

    if (frontNineWinner) {
      const prizeTotals = prizeTotalsByMember.get(frontNineWinner.memberId);

      if (prizeTotals) {
        prizeTotals.bestFrontNine += 1;
      }
    }

    const backNineWinner = getNineHoleWinner(
      backNine,
      new Set(frontNineWinner ? [frontNineWinner.memberId] : []),
    );

    if (backNineWinner) {
      const prizeTotals = prizeTotalsByMember.get(backNineWinner.memberId);

      if (prizeTotals) {
        prizeTotals.bestBackNine += 1;
      }
    }
  }

  const members: MembersTableRow[] = memberRecords.map((member) => ({
    id: member.id,
    name: member.name,
    handicap: Number(member.handicapIndex).toFixed(1),
    ...createEmptyPrizeTotals(),
    ...prizeTotalsByMember.get(member.id),
  }));
  const shadedColumnKeys = new Set<PrizeColumnKey>([
    "firstPrize",
    "thirdPrize",
    "bestBackNine",
    "nearestToPin",
    "longestDrive",
    "numptyPrize",
  ]);

  return (
    <main className="pb-8 sm:pb-12">
      <section className="bg-[var(--brand-dark)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Members
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Members, handicaps, and prize totals
          </h1>
          <div className="mt-6 overflow-hidden rounded-[1.5rem]">
            <Image
              src="/captainsweekend.jpg"
              alt="Imperial Golf Society Captain's Weekend"
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-100/85 sm:text-base">
            This page is set up to track each member&apos;s handicap and how many
            times they have won the main society prizes across the season.
          </p>
          <div className="mt-6">
            <Link
              href="/members/wall-of-shame"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/16"
            >
              Visit the Wall Of Shame
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6">
        <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--surface-strong)] text-[var(--brand-dark)]">
              <tr>
                <th className="sticky left-0 z-20 bg-[var(--surface-strong)] px-4 py-4 font-semibold">
                  Member
                </th>
                <th className="px-4 py-4 font-semibold">Handicap</th>
                {prizeColumns.map((column) => (
                  <th key={column.key} className="px-4 py-4 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + prizeColumns.length}
                    className="px-4 py-8 text-center text-slate-600"
                  >
                    Member rows will appear here once they are added.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-t border-[var(--border)]">
                    <td className="sticky left-0 z-10 bg-[var(--surface)] px-4 py-4 font-medium text-[var(--brand-dark)]">
                      {member.name}
                    </td>
                    <td className="bg-[var(--surface-strong)] px-4 py-4 text-slate-700">
                      {member.handicap}
                    </td>
                    {prizeColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 text-slate-700 ${
                          shadedColumnKeys.has(column.key)
                            ? "bg-stone-200/70"
                            : "bg-[var(--surface-strong)]"
                        }`}
                      >
                        {member[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
