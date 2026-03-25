type HandicapHistoryPoint = {
  label: string;
  shortLabel: string;
  handicapIndex: number;
};

type HandicapHistoryChartProps = {
  points: HandicapHistoryPoint[];
};

export function HandicapHistoryChart({ points }: HandicapHistoryChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-5 text-sm text-slate-700">
        No handicap history has been recorded yet.
      </div>
    );
  }

  const width = 520;
  const height = 220;
  const paddingLeft = 34;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 42;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const values = points.map((point) => point.handicapIndex);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue || 1;
  const chartPoints = points.map((point, index) => {
    const x =
      paddingLeft +
      (plotWidth * index) / Math.max(points.length - 1, 1);
    const y =
      paddingTop + ((maxValue - point.handicapIndex) / spread) * plotHeight;

    return { ...point, x, y };
  });
  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const value = maxValue - (spread * index) / 3;
    const y = paddingTop + (plotHeight * index) / 3;

    return {
      value,
      y,
    };
  });

  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Handicap history line chart"
        >
          {yTicks.map((tick) => (
            <g key={tick.y}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="rgb(203 213 225)"
                strokeDasharray="4 6"
              />
              <text
                x={paddingLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgb(100 116 139)"
              >
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}

          <polyline
            fill="none"
            stroke="rgb(143 98 71)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polyline}
          />

          {points.length === 1 ? (
            <line
              x1={paddingLeft}
              y1={chartPoints[0].y}
              x2={width - paddingRight}
              y2={chartPoints[0].y}
              stroke="rgb(143 98 71 / 0.35)"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
          ) : null}

          {chartPoints.map((point) => (
            <g key={`${point.label}-${point.handicapIndex}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="rgb(143 98 71)"
                stroke="rgb(255 255 255)"
                strokeWidth="2"
              />
              <text
                x={point.x}
                y={height - 16}
                textAnchor="middle"
                fontSize="11"
                fill="rgb(100 116 139)"
              >
                {point.shortLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {points.length === 1 ? (
        <p className="mt-4 text-sm text-slate-600">
          Your chart will build out as handicap updates are recorded over time.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {points.slice(-4).map((point) => (
          <div
            key={`${point.label}-${point.handicapIndex}-summary`}
            className="rounded-[1rem] bg-white/80 px-3 py-3"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              {point.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-dark)]">
              {point.handicapIndex.toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
