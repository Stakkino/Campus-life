// Anneau SVG : répartition étudiants / enseignants.
export default function Donut({ students, teachers }) {
  const total = students + teachers
  const pct = total ? (students / total) * 100 : 0
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 42 42" width="140" height="140" role="img" aria-label="Répartition des comptes">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--border)" strokeWidth="6" />
        {total > 0 && <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--color-blue)" strokeWidth="6" />}
        {total > 0 && <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--color-green)" strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" />}
        <text x="21" y="22.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--text)">{total}</text>
        <text x="21" y="28" textAnchor="middle" fontSize="3" fill="var(--muted)">comptes</text>
      </svg>
      <div className="donut-legend">
        <div><i style={{ background: 'var(--color-green)' }} />Étudiants · {total ? Math.round(pct) : 0} %</div>
        <div><i style={{ background: 'var(--color-blue)' }} />Enseignants · {total ? 100 - Math.round(pct) : 0} %</div>
      </div>
    </div>
  )
}
