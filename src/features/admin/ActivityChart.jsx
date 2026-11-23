// Histogramme SVG des 7 derniers jours : messages (vert) et publications (bleu).
const dayLabel = (iso) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(`${iso}T12:00:00`)).replace('.', '')

export default function ActivityChart({ data }) {
  const max = Math.max(5, ...data.flatMap((d) => [d.messages, d.posts]))
  const H = 150, step = 560 / data.length
  const y = (v) => 10 + H - (v / max) * H
  return (
    <>
      <div className="legend"><span><i style={{ background: 'var(--color-green)' }} />Messages</span><span><i style={{ background: 'var(--color-blue)' }} />Publications</span></div>
      <svg viewBox="0 0 560 185" width="100%" role="img" aria-label="Activité des 7 derniers jours">
        {[0, 0.5, 1].map((t) => <line key={t} x1="0" x2="560" y1={10 + H - t * H} y2={10 + H - t * H} stroke="var(--border)" />)}
        {data.map((d, i) => {
          const x = i * step + step / 2 - 24
          return (
            <g key={d.date}>
              <rect x={x} y={y(d.messages)} width="26" height={Math.max(2, 10 + H - y(d.messages))} rx="5" fill="var(--color-green)"><title>{d.messages} messages</title></rect>
              <rect x={x + 29} y={y(d.posts)} width="18" height={Math.max(2, 10 + H - y(d.posts))} rx="5" fill="var(--color-blue)"><title>{d.posts} publications</title></rect>
              <text x={x + 24} y="178" textAnchor="middle" fontSize="11" fill="var(--muted)">{dayLabel(d.date)}</text>
            </g>
          )
        })}
      </svg>
    </>
  )
}
