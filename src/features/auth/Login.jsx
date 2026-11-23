import { useState } from 'react'
import { GraduationCap, CircleCheck, CircleAlert } from 'lucide-react'

import Button from '../../shared/components/Button.jsx'
import FilterTabs from '../../shared/components/FilterTabs.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useApi } from '../../shared/hooks/useApi.js'
import './auth.css'

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState(null) // { ok: bool, text }
  const [busy, setBusy] = useState(false)
  const { data: catalog } = useApi('/catalog') // filières et niveaux définis par l'admin
  const hasCatalog = Boolean(catalog && (catalog.programs.length || catalog.levels.length))

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const d = Object.fromEntries(new FormData(form))
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'login') {
        await login(d.email, d.password)
      } else {
        await signup(d)
        form.reset()
        setMode('login')
        setMessage({ ok: true, text: "Compte créé ! Il doit maintenant être validé par l'administrateur avant votre première connexion." })
      }
    } catch (e) {
      setMessage({ ok: false, text: e.message })
    }
    setBusy(false)
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <span className="auth-circle auth-circle-1" /><span className="auth-circle auth-circle-2" />
        <span className="auth-logo"><GraduationCap size={30} /></span>
        <h1>CAMPUS LIFE</h1>
        <p>Emploi du temps, annonces, ressources et discussions toute la vie de la fac au même endroit.</p>
        <div className="auth-features"><span>Tâches</span><span>Planning</span><span>Annonces</span><span>Discussion</span></div>
      </section>
      <section className="auth-side">
        <form className="form auth-form" onSubmit={submit}>
          <div><h2>{mode === 'login' ? 'Bon retour 👋' : 'Créer un compte'}</h2><p className="muted">{mode === 'login' ? 'Connectez-vous à votre espace' : 'Votre compte sera validé par un administrateur'}</p></div>
          <FilterTabs value={mode} onChange={(m) => { setMode(m); setMessage(null) }} options={[{ value: 'login', label: 'Connexion' }, { value: 'signup', label: 'Inscription' }]} />
          {mode === 'signup' && (
            <>
              <div className="field"><label htmlFor="name">Nom complet</label><input id="name" name="name" required autoComplete="name" /></div>
              {hasCatalog && (
                <div className="form-grid">
                  <div className="field"><label htmlFor="programId">Filière</label>
                    <select id="programId" name="programId" required defaultValue=""><option value="" disabled>— Choisir —</option>{catalog.programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div className="field"><label htmlFor="levelId">Niveau</label>
                    <select id="levelId" name="levelId" required defaultValue=""><option value="" disabled>— Choisir —</option>{catalog.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                </div>
              )}
            </>
          )}
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
          <div className="field"><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" required minLength={mode === 'signup' ? 4 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
          {message && <div className={`alert ${message.ok ? 'alert-ok' : ''}`} role="alert">{message.ok ? <CircleCheck size={18} /> : <CircleAlert size={18} />}{message.text}</div>}
          <Button type="submit" className="btn-block" disabled={busy}>{mode === 'login' ? 'Se connecter' : "S'inscrire"}</Button>
        </form>
      </section>
    </div>
  )
}