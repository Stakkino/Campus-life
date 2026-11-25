import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Megaphone,
  BookOpen,
  MessageSquareWarning,
  MessagesSquare,
  Users,
  House,
} from 'lucide-react'

// Prénom affiché dans le message de bienvenue du Dashboard.
// Modifiez-le ici pour personnaliser l'accueil.
export const STUDENT_NAME = 'Étudiant'

// Éléments de navigation : utilisés par la Sidebar (desktop) ET la BottomNav (mobile).
// Pour ajouter une page, on ajoute une ligne ici et une <Route> dans App.jsx.
export const NAV_ITEMS = [
  { path: '/', label: 'Tableau de bord', shortLabel: 'Accueil', icon: LayoutDashboard },
  { path: '/taches', label: 'Tâches', shortLabel: 'Tâches', icon: ListChecks },
  { path: '/emploi-du-temps', label: 'Emploi du temps', shortLabel: 'Planning', icon: CalendarDays },
  { path: '/annonces', label: 'Annonces', shortLabel: 'Annonces', icon: Megaphone },
  { path: '/ressources', label: 'Ressources', shortLabel: 'Ressources', icon: BookOpen },
  { path: '/retours', label: 'Retours de cours', shortLabel: 'Retours', icon: MessageSquareWarning },
  { path: '/discussion', label: 'Discussion', shortLabel: 'Discuter', icon: MessagesSquare },
  { path: '/personnes', label: 'Étudiants & enseignants', shortLabel: 'Personnes', icon: Users },
]

// Clés utilisées dans le LocalStorage (une par collection de données).
export const STORAGE_KEYS = {
  tasks: 'campuslife_tasks_v2',
  courses: 'campuslife_courses',
  announcements: 'campuslife_announcements',
  resources: 'campuslife_resources',
  users: 'campuslife_users_v2',
  feedbacks: 'campuslife_feedbacks',
  messages: 'campuslife_messages',
  currentUser: 'campuslife_session',
}

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
]

export const ANNOUNCEMENT_CATEGORIES = [
  'Examens',
  'Événements',
  'Administratif',
  'Associations',
  'Divers',
]

export const RESOURCE_TYPES = ['Lien', 'PDF', 'Vidéo', 'Document']

export const FEEDBACK_STATUSES = [
  { value: 'flou', label: "C'est flou", tone: 'danger' },
  { value: 'question', label: 'Question', tone: 'accent' },
  { value: 'compris', label: 'Bien compris', tone: 'success' },
]

export const ROLE_LABELS = { admin: 'Administrateur', teacher: 'Enseignant', student: 'Étudiant' }

// Navigation propre à chaque rôle (Sidebar, BottomNav et barre du haut étudiant).
export function getNav(role) {
  const dash = { path: '/', label: 'Tableau de bord', shortLabel: 'Accueil', icon: LayoutDashboard }
  const planning = { path: '/emploi-du-temps', label: 'Emploi du temps', shortLabel: 'Planning', icon: CalendarDays }
  const resources = { path: '/ressources', label: 'Ressources', shortLabel: 'Ressources', icon: BookOpen }
  const feedback = { path: '/retours', label: 'Retours de cours', shortLabel: 'Retours', icon: MessageSquareWarning }
  const chat = { path: '/discussion', label: 'Discussion', shortLabel: 'Discuter', icon: MessagesSquare }
  const news = { path: '/annonces', label: 'Annonces', shortLabel: 'Annonces', icon: Megaphone }
  if (role === 'student')
    return [
      { path: '/', label: "Fil d'actualité", shortLabel: 'Accueil', icon: House },
      { path: '/taches', label: 'Mes tâches', shortLabel: 'Tâches', icon: ListChecks },
      planning, resources, feedback, chat,
    ]
  if (role === 'teacher') return [dash, planning, news, resources, feedback, chat]
  return [dash, { path: '/utilisateurs', label: 'Utilisateurs', shortLabel: 'Membres', icon: Users }, planning, news, resources, feedback, chat]
}
