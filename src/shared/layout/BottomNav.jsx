import { NavLink } from 'react-router-dom'

// Navigation basse : affichée sur téléphone à la place du menu latéral.
export default function BottomNav({ items }) {
  return (
    <nav className="bottomnav" aria-label="Navigation mobile">
      {items.map(({ path, short, icon: Icon }) => (
        <NavLink key={path} to={path} end={path === '/'}><Icon size={20} />{short}</NavLink>
      ))}
    </nav>
  )
}
