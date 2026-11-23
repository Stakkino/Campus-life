export default function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="row-actions">{actions}</div>}
    </header>
  )
}
