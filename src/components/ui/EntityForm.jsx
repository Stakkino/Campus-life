import Button from './Button.jsx'

// Formulaire générique piloté par une liste de champs :
// { name, label, type: 'text'|'textarea'|'select'|'date'|'time'|'url'|'email', options, required }
export default function EntityForm({ fields, initial = {}, onSubmit, onCancel, submitLabel = 'Enregistrer' }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(Object.fromEntries(new FormData(event.currentTarget)))
  }
  return (
    <form onSubmit={handleSubmit} className="entity-form">
      {fields.map((f) => (
        <label key={f.name} className="field">
          <span>{f.label}</span>
          {f.type === 'textarea' ? (
            <textarea name={f.name} rows={4} required={f.required} defaultValue={initial[f.name] ?? ''} />
          ) : f.type === 'select' ? (
            <select name={f.name} defaultValue={initial[f.name]}>
              {f.options.map((o) => {
                const value = typeof o === 'string' ? o : o.value
                const label = typeof o === 'string' ? o : o.label
                return <option key={value} value={value}>{label}</option>
              })}
            </select>
          ) : (
            <input name={f.name} type={f.type || 'text'} required={f.required} defaultValue={initial[f.name] ?? ''} />
          )}
        </label>
      ))}
      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
