export const seasonKeyMembers = [
  { roleKey: "captain", roleLabel: "Captain", memberName: "Stuart", sortOrder: 0 },
  { roleKey: "vice-captain", roleLabel: "Vice Captain", memberName: "Dougie", sortOrder: 1 },
  { roleKey: "treasurer", roleLabel: "Treasurer", memberName: "Deek", sortOrder: 2 },
  { roleKey: "secretary", roleLabel: "Secretary", memberName: "Gregg", sortOrder: 3 },
  {
    roleKey: "handicap-committee",
    roleLabel: "Handicap Committee",
    memberName: "Ryan & JK",
    sortOrder: 4,
  },
] as const;

export type SeasonKeyMember = (typeof seasonKeyMembers)[number];
export const currentSeason = 2026;
