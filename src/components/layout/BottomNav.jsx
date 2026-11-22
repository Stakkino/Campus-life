import { NavLink } from 'react-router-dom'

import { getNav } from '../../utils/constants.js'
import { useApp } from '../../context/AppContext.jsx'

// Navigation du bas (visible sur mobile et tablette, masquée sur grand écran).
export default function BottomNav() {
  const { currentUser } = useApp()
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      <ul>
        {getNav(currentUser.role).map(({ path, shortLabel, icon: Icon }) => (
          <li key={path}>
            <NavLink to={path} end={path === '/'}>
              <Icon size={22} aria-hidden="true" />
              <span>{shortLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
