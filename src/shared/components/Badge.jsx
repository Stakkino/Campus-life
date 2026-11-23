// tone : "green" (défaut) | "blue" | "neutral" | "solid"
export default function Badge({ tone = 'green', children }) {
  return <span className={`badge ${tone === 'green' ? '' : `badge-${tone}`}`}>{children}</span>
}
