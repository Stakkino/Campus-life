import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import Brand from './Brand.jsx'
import BottomNav from './BottomNav.jsx'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getNav } from '../utils/constants.js'

// Disposition de l'étudiant : barre de navigation en haut (menu du bas sur téléphone).
export default function StudentLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const nav = getNav('student')

  return (
    <div className="student-shell">
      <header className="topbar">
        <Brand />
        <nav className="topbar-links" aria-label="Navigation principale">
          {nav.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className="topbar-link"><Icon size={17} />{label}</NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span className="name">{user.name}</span>
          <Avatar name={user.name} />
          <button className="icon-btn" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={16} /></button>
        </div>
      </header>
      <main className="main-content"><div className="page" key={pathname}><Outlet /></div></main>
      <BottomNav items={nav} />
    </div>
  )
}
