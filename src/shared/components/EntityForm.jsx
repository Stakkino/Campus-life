import { useState } from 'react'
import Button from './Button.jsx'

// Formulaire générique : on décrit les champs, il gère la saisie.
// fields : [{ name, label, type ('text'|'textarea'|'select'|'date'|'time'|'email'|'password'|'url'), options, required, half }]
// options : ['A','B'] ou [{ value, label }]
export default function EntityForm({ fields, initial = {}, onSubmit, onCancel, submitLabel = 'Enregistrer' }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === 'select' ? optionValue(f.options?.[0]) : '')])))
  const [busy, setBusy] = useState(false)
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    await onSubmit(values)
    setBusy(false)
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        {fields.map((f) => (
          <div className="field" key={f.name} style={f.half ? undefined : { gridColumn: '1 / -1' }}>
            <label htmlFor={`f-${f.name}`}>{f.label}{f.required && ' *'}</label>
            {f.type === 'textarea' ? (
              <textarea id={`f-${f.name}`} value={values[f.name]} onChange={set(f.name)} required={f.required} rows={3} />
            ) : f.type === 'select' ? (
              <select id={`f-${f.name}`} value={values[f.name]} onChange={set(f.name)} required={f.required}>
                {f.options.map((o) => <option key={optionValue(o)} value={optionValue(o)}>{typeof o === 'string' ? o : o.label}</option>)}
              </select>
            ) : (
              <input id={`f-${f.name}`} type={f.type || 'text'} value={values[f.name]} onChange={set(f.name)} required={f.required} />
            )}
          </div>
        ))}
      </div>
      <div className="form-actions">
        {onCancel && <Button variant="outline" onClick={onCancel}>Annuler</Button>}
        <Button type="submit" disabled={busy}>{submitLabel}</Button>
      </div>
    </form>
  )
}

function optionValue(o) {
  return o === undefined ? '' : typeof o === 'string' ? o : o.value
}
