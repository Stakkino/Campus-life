export default function Loading({ label = 'Chargement…' }) {
  return <p className="muted" style={{ padding: 24, textAlign: 'center' }}>{label}</p>
}
