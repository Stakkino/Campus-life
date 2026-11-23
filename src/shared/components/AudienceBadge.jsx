import { Users } from 'lucide-react'
import Badge from './Badge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

// Étiquette « Qui voit ça ? » (L1 Informatique, Filière Gestion…). Un étudiant ne la voit pas pour le campus entier.
export default function AudienceBadge({ audience }) {
  const { user } = useAuth()
  if (!audience || (audience === 'Tout le campus' && user.role === 'student')) return null
  return <Badge tone="neutral"><Users size={11} aria-hidden="true" /> {audience}</Badge>
}
