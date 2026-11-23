import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../shared/components/Button.jsx'
import { TITLES } from '../../shared/utils/constants.js'

// Formulaire d'un compte : les champs changent selon le rôle.
//  - Étudiant   → Filière + Niveau (listes définies dans « Filières & niveaux »)
//  - Enseignant → Civilité (Mr, Mme, Mlle, Dr, Prof) + matière
// initial = utilisateur à modifier (absent = création).
export default function UserForm({ initial, catalog, onSubmit, onCancel }) {
  const editing = Boolean(initial)
  const [v, setV] = useState({
    role: initial?.role || 'student',
    title: initial?.title || '',
    name: initial?.baseName || '',
    email: initial?.email || '',
    password: '',
    info: initial?.role === 'student' ? '' : initial?.info || '',
    programId: initial?.programId || '',
    levelId: initial?.levelId || '',
  })
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setV((old) => ({ ...old, [key]: e.target.value }))
  const isStudent = v.role === 'student'
  const catalogEmpty = catalog.programs.length === 0 || catalog.levels.length === 0
  const legacyInfo = editing && isStudent && !initial.programId && initial.info

  async function submit(event) {
    event.preventDefault()
    const body = { role: v.role, name: v.name, email: v.email }
    if (v.password) body.password = v.password
    if (isStudent) Object.assign(body, { programId: v.programId || null, levelId: v.levelId || null })
    else Object.assign(body, { title: v.title, info: v.info })
    setBusy(true)
    await onSubmit(body)
    setBusy(false)
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="u-role">Rôle</label>
          <select id="u-role" value={v.role} onChange={set('role')}>
            <option value="student">Étudiant</option>
            <option value="teacher">Enseignant</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        {!isStudent && (
          <div className="field">
            <label htmlFor="u-title">Civilité</label>
            <select id="u-title" value={v.title} onChange={set('title')}>
              <option value="">— Aucune —</option>
              {TITLES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div className="field" style={isStudent ? { gridColumn: '1 / -1' } : undefined}>
          <label htmlFor="u-name">Nom {isStudent ? 'complet' : '(sans la civilité)'} *</label>
          <input id="u-name" value={v.name} onChange={set('name')} required placeholder={isStudent ? 'Aina Rakoto' : 'Rakoto Jean'} />
        </div>

        {isStudent ? (
          catalogEmpty ? (
            <p className="field full muted">
              Aucune filière ou aucun niveau n'est défini. <Link to="/filieres">Ajoutez-les d'abord ici</Link>, puis revenez.
            </p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="u-program">Filière *</label>
                <select id="u-program" value={v.programId} onChange={set('programId')} required>
                  <option value="">— Choisir —</option>
                  {catalog.programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="u-level">Niveau *</label>
                <select id="u-level" value={v.levelId} onChange={set('levelId')} required>
                  <option value="">— Choisir —</option>
                  {catalog.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              {legacyInfo && <p className="field full muted">Saisie actuelle : « {initial.info} ». Choisissez la filière et le niveau pour la remplacer.</p>}
            </>
          )
        ) : (
          <div className="field full">
            <label htmlFor="u-info">{v.role === 'teacher' ? 'Matière / spécialité' : 'Fonction'}</label>
            <input id="u-info" value={v.info} onChange={set('info')} placeholder={v.role === 'teacher' ? 'Algorithmique' : 'Direction'} />
          </div>
        )}

        <div className="field">
          <label htmlFor="u-email">Email *</label>
          <input id="u-email" type="email" value={v.email} onChange={set('email')} required />
        </div>
        <div className="field">
          <label htmlFor="u-pass">{editing ? 'Nouveau mot de passe' : 'Mot de passe *'}</label>
          <input id="u-pass" type="password" value={v.password} onChange={set('password')} required={!editing} minLength={4}
            placeholder={editing ? 'Laisser vide = inchangé' : '4 caractères min.'} autoComplete="new-password" />
        </div>
      </div>
      <div className="form-actions">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={busy || (isStudent && catalogEmpty)}>{editing ? 'Enregistrer' : 'Créer le compte'}</Button>
      </div>
    </form>
  )
}