export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty">
      {Icon && <Icon size={30} aria-hidden="true" />}
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </div>
  )
}
