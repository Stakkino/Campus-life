import { GraduationCap } from 'lucide-react'

// Logo + nom de l'application (Sidebar et barre du haut mobile).
export default function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <GraduationCap size={22} aria-hidden="true" />
      </span>
      <span className="brand-name">Campus Life</span>
    </div>
  )
}
