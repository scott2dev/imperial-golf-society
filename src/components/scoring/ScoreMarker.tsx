type ScoreMarkerProps = {
  grossStrokes: number | null | undefined;
  par: number;
};

function getScoreState(grossStrokes: number, par: number) {
  const relativeToPar = grossStrokes - par;

  if (relativeToPar <= -2) {
    return "double-circle";
  }

  if (relativeToPar === -1) {
    return "circle";
  }

  if (relativeToPar === 1) {
    return "square";
  }

  if (relativeToPar >= 2) {
    return "double-square";
  }

  return "plain";
}

export function ScoreMarker({ grossStrokes, par }: ScoreMarkerProps) {
  if (grossStrokes == null) {
    return (
      <span className="inline-flex h-6 min-w-6 items-center justify-center text-xs text-slate-500">
        —
      </span>
    );
  }

  const scoreState = getScoreState(grossStrokes, par);

  if (scoreState === "double-circle") {
    return (
      <span className="inline-flex rounded-full border-[1.5px] border-sky-500 p-[2px]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-sky-500 bg-sky-50 text-xs font-semibold text-sky-900">
          {grossStrokes}
        </span>
      </span>
    );
  }

  if (scoreState === "circle") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-emerald-500 bg-emerald-50 text-xs font-semibold text-emerald-900">
        {grossStrokes}
      </span>
    );
  }

  if (scoreState === "square") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center border-[1.5px] border-amber-500 bg-amber-50 text-xs font-semibold text-amber-900">
        {grossStrokes}
      </span>
    );
  }

  if (scoreState === "double-square") {
    return (
      <span className="inline-flex border-[1.5px] border-rose-500 p-[2px]">
        <span className="inline-flex h-6 w-6 items-center justify-center border-[1.5px] border-rose-500 bg-rose-50 text-xs font-semibold text-rose-900">
          {grossStrokes}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 min-w-7 items-center justify-center text-xs font-semibold text-[var(--brand-dark)]">
      {grossStrokes}
    </span>
  );
}
