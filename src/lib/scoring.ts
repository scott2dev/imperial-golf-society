export type HoleScoringInput = {
  grossStrokes: number;
  par: number;
  strokeIndex: number;
  playingHandicap: number;
};

function getRoundedPlayingHandicap(playingHandicap: number) {
  return Math.max(0, Math.round(playingHandicap));
}

export function getStrokesReceivedForHole(
  playingHandicap: number,
  strokeIndex: number,
) {
  const roundedHandicap = getRoundedPlayingHandicap(playingHandicap);
  const fullRotations = Math.floor(roundedHandicap / 18);
  const remainder = roundedHandicap % 18;

  return fullRotations + (remainder > 0 && strokeIndex <= remainder ? 1 : 0);
}

export function calculateStablefordHoleScore({
  grossStrokes,
  par,
  strokeIndex,
  playingHandicap,
}: HoleScoringInput) {
  const strokesReceived = getStrokesReceivedForHole(playingHandicap, strokeIndex);
  const netStrokes = grossStrokes - strokesReceived;
  const stablefordPoints = Math.max(0, 2 + par - netStrokes);

  return {
    strokesReceived,
    netStrokes,
    stablefordPoints,
  };
}

export function calculateStablefordTotal(
  scores: Array<{ stablefordPoints: number }>,
) {
  return scores.reduce((total, score) => total + score.stablefordPoints, 0);
}
