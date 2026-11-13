/**
 * Daily page views as bars, with contact submissions as signal-coloured
 * dots above them. The same numbers are available as a table below for
 * screen readers and for exact values.
 */
export default function TrafficChart({ series }: { series: { day: string; pageviews: number; visitors: number; submissions: number }[] }) {
  const width = 720;
  const height = 200;
  const pad = { top: 16, right: 8, bottom: 24, left: 36 };
  const max = Math.max(1, ...series.map((d) => d.pageviews));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = innerW / Math.max(1, series.length);
  const bar = Math.max(2, step * 0.66);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(series.length / 8);
  const fmt = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="traffic-title" className="h-auto w-full">
        <title id="traffic-title">Daily page views with contact submissions marked</title>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(max * t)} y2={y(max * t)} stroke="var(--line)" />
            <text x={pad.left - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {Math.round(max * t)}
            </text>
          </g>
        ))}
        {series.map((d, i) => {
          const x = pad.left + i * step + (step - bar) / 2;
          return (
            <g key={d.day}>
              <rect x={x} y={y(d.pageviews)} width={bar} height={Math.max(0, pad.top + innerH - y(d.pageviews))} rx={1.5} fill="var(--fg)" opacity={0.85} />
              {d.submissions > 0 && <circle cx={x + bar / 2} cy={y(d.pageviews) - 7} r={3.5} fill="var(--signal)" />}
              {i % labelEvery === 0 && (
                <text x={x + bar / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">
                  {fmt(d.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-sm bg-fg" /> Page views
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-signal" /> Day with a contact submission
        </span>
      </figcaption>
      <details className="mt-3">
        <summary className="label min-h-11 cursor-pointer py-3 text-muted">Show the numbers</summary>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead className="label text-muted">
              <tr>
                <th scope="col" className="py-2 font-normal">Day</th>
                <th scope="col" className="py-2 font-normal">Page views</th>
                <th scope="col" className="py-2 font-normal">Visitors</th>
                <th scope="col" className="py-2 font-normal">Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {series.map((d) => (
                <tr key={d.day}>
                  <td className="py-1.5">{fmt(d.day)}</td>
                  <td>{d.pageviews}</td>
                  <td>{d.visitors}</td>
                  <td>{d.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
