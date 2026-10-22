/** 14-day views as simple SVG bars (no chart library needed). */
export function ViewsChart({ data }: { data: { day: string; views: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  const W = 560;
  const H = 150;
  const gap = 6;
  const bw = (W - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="h-auto w-full" role="img" aria-label="Views per day, last 14 days">
      {data.map((d, i) => {
        const h = Math.max(2, (d.views / max) * H);
        const x = i * (bw + gap);
        return (
          <g key={d.day}>
            <title>{`${d.day}: ${d.views} views`}</title>
            <rect x={x} y={H - h} width={bw} height={h} rx={3} className="fill-primary/80" />
            {(i === 0 || i === data.length - 1 || i % 4 === 0) && (
              <text x={x + bw / 2} y={H + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {d.day.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
