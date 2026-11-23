import { LayoutDashboard, ListChecks, CalendarDays, Megaphone, BookOpen, MessageSquareWarning, MessagesSquare, Users, House, ClipboardCheck, GraduationCap, TrendingUp } from 'lucide-react'

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
export const TASK_PRIORITIES = [{ value: 'low', label: 'Basse' }, { value: 'medium', label: 'Moyenne' }, { value: 'high', label: 'Haute' }]
export const ANNOUNCEMENT_CATEGORIES = ['Examens', 'Événements', 'Administratif', 'Associations', 'Divers']
export const RESOURCE_TYPES = ['Lien', 'PDF', 'Vidéo', 'Document']
export const FEEDBACK_STATUSES = [
  { value: 'flou', label: "C'est flou", tone: 'blue' },
  { value: 'question', label: 'Question', tone: 'green' },
  { value: 'compris', label: 'Bien compris', tone: 'neutral' },
]
// Civilités proposées pour les enseignants (et administrateurs). '' = aucune.
export const TITLES = ['Mr', 'Mme', 'Mlle', 'Dr', 'Prof']
export const ROLE_LABELS = { admin: 'Administrateur', teacher: 'Enseignant', student: 'Étudiant' }

// Navigation de chaque rôle. Pour ajouter une page : une ligne ici + une <Route> dans App.jsx.
const planning = { path: '/emploi-du-temps', label: 'Emploi du temps', short: 'Planning', icon: CalendarDays }
const news = { path: '/annonces', label: 'Annonces', short: 'Annonces', icon: Megaphone }
const resources = { path: '/ressources', label: 'Ressources', short: 'Ressources', icon: BookOpen }
const feedback = { path: '/retours', label: 'Retours de cours', short: 'Retours', icon: MessageSquareWarning }
const chat = { path: '/discussion', label: 'Discussion', short: 'Discuter', icon: MessagesSquare }
const exams = { path: '/examens', label: 'Examens', short: 'Examens', icon: ClipboardCheck }

export function getNav(role) {
  if (role === 'student')
    return [
      { path: '/', label: 'Actualité', short: 'Accueil', icon: House },
      { path: '/taches', label: 'Mes tâches', short: 'Tâches', icon: ListChecks },
      planning, exams, resources, { ...feedback, label: 'Retours' }, chat,
    ]
  if (role === 'teacher')
    return [
      { path: '/', label: 'Tableau de bord', short: 'Accueil', icon: LayoutDashboard, section: 'Enseignant' },
      { ...feedback, label: 'Retours étudiants', section: 'Enseignant' },
      { ...exams, section: 'Enseignant' },
      { ...planning, section: 'Campus' }, { ...news, section: 'Campus' }, { ...resources, section: 'Campus' }, { ...chat, section: 'Campus' },
    ]
  return [
    { path: '/', label: 'Statistiques', short: 'Stats', icon: LayoutDashboard, section: 'Administration' },
    { path: '/utilisateurs', label: 'Utilisateurs', short: 'Membres', icon: Users, section: 'Administration' },
    { path: '/filieres', label: 'Filières & niveaux', short: 'Filières', icon: GraduationCap, section: 'Administration' },
    { path: '/passage-annee', label: "Passage d'année", short: 'Année', icon: TrendingUp, section: 'Administration' },
    { ...planning, section: 'Campus' }, { ...exams, section: 'Campus' }, { ...news, section: 'Campus' }, { ...resources, section: 'Campus' }, { ...feedback, section: 'Campus' }, { ...chat, section: 'Campus' },
  ]
}
