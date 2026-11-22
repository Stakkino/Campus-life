import { UserRound, LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { ROLE_LABELS } from '../../utils/constants.js'

// Compte connecté + bouton de déconnexion.
export default function UserSwitcher() {
  const { currentUser, logout } = useApp()
  return (
    <div className="user-switcher">
      <UserRound size={16} aria-hidden="true" />
      <span>{currentUser.name} · {ROLE_LABELS[currentUser.role]}</span>
      <button type="button" className="icon-btn" aria-label="Se déconnecter" onClick={logout}><LogOut size={16} /></button>
    </div>
  )
}
