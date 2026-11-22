import Card from '../ui/Card.jsx'

// Carte de statistique. tone : 'neutral' | 'success' | 'danger' | 'accent'
export default function StatCard({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <Card className="stat-card">
      <span className={`stat-icon stat-icon-${tone}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </Card>
  )
}
