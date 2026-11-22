// En-tête commun à toutes les pages : titre, sous-titre, et un bouton d'action facultatif.
export default function PageHeader({ title, description, action }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  )
}
