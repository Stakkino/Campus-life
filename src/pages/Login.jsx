import { useState } from 'react'
import { GraduationCap, LogIn, UserPlus } from 'lucide-react'

import Button from '../components/ui/Button.jsx'
import FilterTabs from '../components/ui/FilterTabs.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { login, signup } = useApp()
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState(null) // { type: 'error' | 'ok', text }

  function submit(event) {
    event.preventDefault()
    const d = Object.fromEntries(new FormData(event.currentTarget))
    if (mode === 'login') {
      const r = login(d.email, d.password)
      if (!r.ok) setMessage({ type: 'error', text: r.error })
    } else {
      const r = signup(d)
      if (!r.ok) return setMessage({ type: 'error', text: r.error })
      event.currentTarget.reset()
      setMode('login')
      setMessage({ type: 'ok', text: "Compte créé ! Il doit maintenant être validé par l'administrateur avant votre première connexion." })
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <GraduationCap size={48} aria-hidden="true" />
        <h1>CAMPUS LIFE</h1>
        <p>L'application qui améliore la vie étudiante emploi du temps, annonces, ressources, retours de cours et discussions.</p>
      </section>
      <section className="auth-card">
        <FilterTabs value={mode} onChange={(m) => { setMode(m); setMessage(null) }}
          options={[{ value: 'login', label: 'Connexion' }, { value: 'signup', label: 'Créer un compte étudiant' }]} />
        <form className="entity-form" onSubmit={submit} key={mode}>
          {mode === 'signup' && (
            <>
              <label className="field"><span>Nom complet</span><input name="name" required /></label>
              <label className="field"><span>Filière / niveau</span><input name="info" placeholder="ex. L1 Informatique" /></label>
            </>
          )}
          <label className="field"><span>Email</span><input name="email" type="email" required /></label>
          <label className="field"><span>Mot de passe</span><input name="password" type="password" required minLength={4} /></label>
          {message && <p className={`auth-msg auth-${message.type}`} role="alert">{message.text}</p>}
          <Button type="submit" icon={mode === 'login' ? LogIn : UserPlus}>{mode === 'login' ? 'Se connecter' : 'Envoyer ma demande'}</Button>
          {mode === 'signup' && <p className="muted">Votre compte sera actif après validation par l'administrateur.</p>}
        </form>
      </section>
    </div>
  )
}
