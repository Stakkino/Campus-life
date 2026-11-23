import { createContext, useContext, useMemo, useCallback } from 'react'

import useLocalStorage from '../hooks/useLocalStorage.js'
import { seedData } from '../data/seedData.js'
import { STORAGE_KEYS as K } from '../utils/constants.js'

const AppContext = createContext(null)

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Actions communes à chaque collection : ajouter, modifier, supprimer,
// + réagir (J'aime / J'adore) et commenter (utilisées par annonces et retours de cours).
function createActions(setItems) {
  const patch = (id, fn) => setItems((prev) => prev.map((item) => (item.id === id ? fn(item) : item)))
  return {
    add: (item) => setItems((prev) => [{ ...item, id: generateId() }, ...prev]),
    update: (id, changes) => patch(id, (item) => ({ ...item, ...changes })),
    remove: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
    react: (id, type, userId) =>
      patch(id, (item) => {
        const reactions = { like: [], love: [], ...item.reactions }
        reactions[type] = reactions[type].includes(userId)
          ? reactions[type].filter((u) => u !== userId)
          : [...reactions[type], userId]
        return { ...item, reactions }
      }),
    comment: (id, comment) =>
      patch(id, (item) => ({ ...item, comments: [...(item.comments || []), { ...comment, id: generateId() }] })),
    removeComment: (id, commentId) =>
      patch(id, (item) => ({ ...item, comments: (item.comments || []).filter((c) => c.id !== commentId) })),
  }
}

export function AppProvider({ children }) {
  const [tasks, setTasks] = useLocalStorage(K.tasks, seedData.tasks)
  const [courses, setCourses] = useLocalStorage(K.courses, seedData.courses)
  const [announcements, setAnnouncements] = useLocalStorage(K.announcements, seedData.announcements)
  const [resources, setResources] = useLocalStorage(K.resources, seedData.resources)
  const [users, setUsers] = useLocalStorage(K.users, seedData.users)
  const [feedbacks, setFeedbacks] = useLocalStorage(K.feedbacks, seedData.feedbacks)
  const [messages, setMessages] = useLocalStorage(K.messages, seedData.messages)
  const [currentUserId, setCurrentUserId] = useLocalStorage(K.currentUser, null)

  const currentUser = users.find((u) => u.id === currentUserId) || null
  // Un enseignant modère tout ; un étudiant ne gère que ses propres publications.
  const canManage = useCallback(
    (item) => Boolean(currentUser) && (currentUser.role !== 'student' || !item.authorId || item.authorId === currentUser.id),
    [currentUser],
  )

  const resetData = useCallback(() => {
    setTasks(seedData.tasks)
    setCourses(seedData.courses)
    setAnnouncements(seedData.announcements)
    setResources(seedData.resources)
    setUsers(seedData.users)
    setFeedbacks(seedData.feedbacks)
    setMessages(seedData.messages)
    setCurrentUserId(null)
  }, [setTasks, setCourses, setAnnouncements, setResources, setUsers, setFeedbacks, setMessages, setCurrentUserId])

  // Authentification (simulée côté navigateur pour la démo).
  const login = useCallback((email, password) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password)
    if (!u) return { ok: false, error: 'Email ou mot de passe incorrect.' }
    if (u.status === 'pending') return { ok: false, error: "Votre compte est en attente de validation par l'administrateur." }
    setCurrentUserId(u.id)
    return { ok: true }
  }, [users, setCurrentUserId])
  const logout = useCallback(() => setCurrentUserId(null), [setCurrentUserId])
  const signup = useCallback((data) => {
    if (users.some((x) => x.email.toLowerCase() === data.email.trim().toLowerCase())) return { ok: false, error: 'Cet email est déjà utilisé.' }
    setUsers((prev) => [{ ...data, email: data.email.trim(), id: generateId(), role: 'student', status: 'pending' }, ...prev])
    return { ok: true }
  }, [users, setUsers])

  const value = useMemo(
    () => ({
      tasks, courses, announcements, resources, users, feedbacks, messages,
      currentUser, setCurrentUserId, canManage, login, logout, signup,
      taskActions: createActions(setTasks),
      courseActions: createActions(setCourses),
      announcementActions: createActions(setAnnouncements),
      resourceActions: createActions(setResources),
      userActions: createActions(setUsers),
      feedbackActions: createActions(setFeedbacks),
      messageActions: createActions(setMessages),
      resetData,
    }),
    [tasks, courses, announcements, resources, users, feedbacks, messages, currentUser, canManage, resetData, login, logout, signup,
      setTasks, setCourses, setAnnouncements, setResources, setUsers, setFeedbacks, setMessages, setCurrentUserId],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp doit être utilisé à l'intérieur de <AppProvider>")
  return context
}
