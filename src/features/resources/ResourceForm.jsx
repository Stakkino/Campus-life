import { useState } from 'react'
import { Link as LinkIcon, Upload } from 'lucide-react'
import EntityForm from '../../shared/components/EntityForm.jsx'

const MAX_MB = 15
const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt'

// Formulaire de ressource : au choix un lien, ou un fichier pris sur l'ordinateur, la tablette ou le téléphone.
export default function ResourceForm({ fields, initial, onSubmit, onCancel }) {
  const editing = Boolean(initial.id)
  const [mode, setMode] = useState(initial.hasFile ? 'file' : 'link')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  const shown = mode === 'link' ? fields : fields.filter((f) => f.name !== 'url' && f.name !== 'type')

  function pick(e) {
    const f = e.target.files?.[0]
    setError('')
    if (f && f.size > MAX_MB * 1024 * 1024) { setError(`Fichier trop lourd (${MAX_MB} Mo maximum).`); e.target.value = ''; return }
    setFile(f || null)
  }

  async function submit(values) {
    if (mode === 'file' && !file && !initial.hasFile) { setError('Choisissez un fichier.'); return }
    await onSubmit({ ...values, kind: mode, file })
  }

  return (
    <>
      <div className="mode-switch" role="tablist">
        <button type="button" className={mode === 'link' ? 'on' : ''} onClick={() => setMode('link')}><LinkIcon size={15} />Lien</button>
        <button type="button" className={mode === 'file' ? 'on' : ''} onClick={() => setMode('file')}><Upload size={15} />Fichier</button>
      </div>
      {mode === 'file' && (
        <div className="file-pick">
          <label className="file-drop">
            <Upload size={20} />
            <span>{file ? file.name : initial.hasFile ? `Actuel : ${initial.fileName} (choisir pour remplacer)` : 'Choisir un fichier (PDF, Word, PowerPoint…)'}</span>
            <input type="file" accept={ACCEPT} onChange={pick} />
          </label>
          <small className="muted">Depuis l'ordinateur, la tablette ou le téléphone · {MAX_MB} Mo maximum.</small>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <EntityForm key={mode} fields={shown} initial={initial} onSubmit={submit} onCancel={onCancel} />
    </>
  )
}
