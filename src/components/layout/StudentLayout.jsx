import { Outlet, NavLink, Link } from 'react-router-dom'
import { LogOut, ListTodo, CircleCheck, TriangleAlert } from 'lucide-react'

import Brand from './Brand.jsx'
import BottomNav from './BottomNav.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getNav } from '../../utils/constants.js'
import { DAYS } from '../../utils/constants.js'
import { isOverdue } from '../../utils/dateUtils.js'

export const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

// Structure façon Facebook : barre du haut, colonne gauche (menu), fil central, colonne droite (widgets, contacts).
export default function StudentLayout() {
  const { currentUser: me, users, courses, tasks, logout } = useApp()
  const nav = getNav('student')
  const mine = tasks.filter((t) => t.ownerId === me.id)
  const todayIdx = (new Date().getDay() + 6) % 7
  const next = [...courses]
    .sort((a, b) => ((DAYS.indexOf(a.day) - todayIdx + 7) % 7) - ((DAYS.indexOf(b.day) - todayIdx + 7) % 7) || a.startTime.localeCompare(b.startTime))
    .slice(0, 3)
  const contacts = users.filter((u) => u.id !== me.id && u.role !== 'admin' && u.status !== 'pending')

  return (
    <div className="fb">
      <header className="fb-header">
        <Brand />
          <nav className="fb-topnav" aria-label="Navigation rapide">
            {nav.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                title={label}
                aria-label={label}
              >
                <Icon size={22} />
              </NavLink>
            ))}
          </nav>
        <div className="fb-user">
          <span className="avatar">{initials(me.name)}</span>
          <span className="fb-user-name">{me.name}</span>
          <button type="button" className="icon-btn" aria-label="Se déconnecter" onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>
      <div className="fb-body">
        {/* <aside className="fb-left">
          <Link to="/" className="fb-profile"><span className="avatar">{initials(me.name)}</span><div><strong>{me.name}</strong><p className="muted">{me.info}</p></div></Link>
          {nav.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className="fb-link"><Icon size={20} /> {label}</NavLink>
          ))}
        </aside> */}
        <main className="fb-center"><Outlet /></main>
        <aside className="fb-right">
          <section className="fb-widget">
            <h3>Mon tableau de bord</h3>
            <p><ListTodo size={16} /> {mine.filter((t) => !t.done).length} tâche(s) à faire</p>
            <p><CircleCheck size={16} /> {mine.filter((t) => t.done).length} terminée(s)</p>
            <p><TriangleAlert size={16} /> {mine.filter((t) => !t.done && isOverdue(t.dueDate)).length} en retard</p>
          </section>
          <section className="fb-widget">
            <h3>Prochains cours</h3>
            {next.map((c) => <p key={c.id}><strong>{c.title}</strong><br /><span className="muted">{c.day} · {c.startTime}</span></p>)}
          </section>
          <section className="fb-widget">
            <h3>Contacts</h3>
            {contacts.map((u) => (
              <Link key={u.id} to="/discussion" className="fb-contact">
                <span className={`avatar ${u.role}`}>{initials(u.name)}</span>{u.name}
                {u.role === 'teacher' && <small className="muted"> · prof</small>}
              </Link>
            ))}
          </section>
        </aside>
      </div>
      <BottomNav />
    </div>
  )
}
