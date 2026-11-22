import { NavLink } from 'react-router-dom'

import Brand from './Brand.jsx'
import UserSwitcher from './UserSwitcher.jsx'
import { getNav } from '../../utils/constants.js'
import { useApp } from '../../context/AppContext.jsx'

// Navigation latérale (visible à partir de 900 px de large).
// NavLink ajoute automatiquement la classe "active" sur le lien de la page courante.
export default function Sidebar() {
  const { currentUser } = useApp()
  return (
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Navigation principale">
        <ul className="sidebar-list">
          {getNav(currentUser.role).map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink to={path} end={path === '/'} className="nav-link">
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <UserSwitcher />
      <p className="sidebar-footer">Vibe Coding Challenge</p>
    </aside>
  )
}
