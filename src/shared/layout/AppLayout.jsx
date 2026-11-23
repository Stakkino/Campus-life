import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import Brand from './Brand.jsx'
import BottomNav from './BottomNav.jsx'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getNav, ROLE_LABELS } from '../utils/constants.js'

// Disposition de l'administrateur et de l'enseignant : menu latéral à gauche.
export default function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const nav = getNav(user.role)
  let lastSection = null

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Navigation principale">
          {nav.map(({ path, label, icon: Icon, section }) => {
            const header = section !== lastSection && section ? <div className="nav-section" key={`s-${section}`}>{section}</div> : null
            lastSection = section
            return (
              <div key={path}>
                {header}
                <NavLink to={path} end={path === '/'} className="nav-link"><Icon size={19} />{label}</NavLink>
              </div>
            )
          })}
        </nav>
        <div className="sidebar-profile">
          <Avatar name={user.name} />
          <div className="who"><strong>{user.name}</strong><small>{ROLE_LABELS[user.role]}</small></div>
          <button className="icon-btn" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={16} /></button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar topbar-mobile">
          <Brand />
          <div className="topbar-user">
            <Avatar name={user.name} />
            <button className="icon-btn" onClick={logout} aria-label="Se déconnecter"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="main-content"><div className="page" key={pathname}><Outlet /></div></main>
      </div>
      <BottomNav items={nav} />
    </div>
  )
}
