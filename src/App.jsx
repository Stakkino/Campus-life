import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext.jsx'
import AppLayout from './shared/layout/AppLayout.jsx'
import StudentLayout from './shared/layout/StudentLayout.jsx'
import Loading from './shared/components/Loading.jsx'

import Login from './features/auth/Login.jsx'
import AdminStats from './features/admin/Stats.jsx'
import AdminUsers from './features/admin/Users.jsx'
import AdminCatalog from './features/admin/Catalog.jsx'
import AdminPromotion from './features/admin/Promotion.jsx'
import TeacherDashboard from './features/teacher/Dashboard.jsx'
import StudentHome from './features/student/Home.jsx'
import StudentTasks from './features/student/Tasks.jsx'
import Exams from './features/teacher/Exams.jsx'
import Schedule from './features/planning/Schedule.jsx'
import Announcements from './features/announcements/Announcements.jsx'
import Resources from './features/resources/Resources.jsx'
import Feedback from './features/feedback/Feedback.jsx'
import Discussion from './features/discussion/Discussion.jsx'

// Sans session : uniquement la connexion. Avec session : les pages dépendent du rôle.
export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="center-screen">Chargement…</div>

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const { role } = user
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={role === 'student' ? <StudentLayout /> : <AppLayout />}>
        <Route index element={role === 'admin' ? <AdminStats /> : role === 'teacher' ? <TeacherDashboard /> : <StudentHome />} />
        {role === 'student' && <Route path="taches" element={<StudentTasks />} />}
        {role === 'admin' && <Route path="utilisateurs" element={<AdminUsers />} />}
        {role === 'admin' && <Route path="filieres" element={<AdminCatalog />} />}
        {role === 'admin' && <Route path="passage-annee" element={<AdminPromotion />} />}
        {role !== 'student' && <Route path="annonces" element={<Announcements />} />}
        <Route path="examens" element={<Exams />} />
        <Route path="emploi-du-temps" element={<Schedule />} />
        <Route path="ressources" element={<Resources />} />
        <Route path="retours" element={<Feedback />} />
        <Route path="discussion" element={<Discussion />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}