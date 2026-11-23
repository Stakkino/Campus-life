import Card from './Card.jsx'

// tone : "green" | "blue" (couleur de l'icône et de l'indication)
export default function StatCard({ icon: Icon, label, value, hint, tone = 'green' }) {
  return (
    <Card className="stat">
      <div className="stat-top">{label}<span className={`stat-icon ${tone === 'blue' ? 'blue' : ''}`}><Icon size={18} /></span></div>
      <div className="stat-value">{value}</div>
      {hint && <div className={`stat-hint ${tone === 'blue' ? 'blue' : ''}`}>{hint}</div>}
    </Card>
  )
}
