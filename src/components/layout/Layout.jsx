import { Outlet, useLocation } from 'react-router-dom'

import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import Brand from './Brand.jsx'
import UserSwitcher from './UserSwitcher.jsx'

// Squelette commun à toutes les pages. <Outlet /> est remplacé par la page de la route active.
// La "key" force React à rejouer la petite animation d'entrée à chaque changement de page.
export default function Layout() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <div className="topbar">
          <Brand />
          <UserSwitcher />
        </div>
        <main className="app-content">
          <div className="page" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
