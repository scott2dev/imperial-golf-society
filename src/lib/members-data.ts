export const prizeColumns = [
  { key: "firstPrize", label: "1st Prize" },
  { key: "secondPrize", label: "2nd Prize" },
  { key: "thirdPrize", label: "3rd Prize" },
  { key: "bestFrontNine", label: "Best Front 9" },
  { key: "bestBackNine", label: "Best Back 9" },
  { key: "grossPrize", label: "Gross Prize" },
  { key: "nearestToPin", label: "Nearest to Pin" },
  { key: "nearestToPinInTwo", label: "Nearest to Pin in 2" },
  { key: "longestDrive", label: "Longest Drive" },
  { key: "twosMoney", label: "2's Money" },
  { key: "numptyPrize", label: "Numpty Prize" },
] as const;

export type PrizeColumnKey = (typeof prizeColumns)[number]["key"];

export type MemberRow = {
  name: string;
  handicap: number | string;
} & Record<PrizeColumnKey, number>;

export const members: MemberRow[] = [];
