import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Users, UserCheck, CalendarDays, MessageSquareWarning, Megaphone, RotateCcw, Check, X } from 'lucide-react'

import PageHeader from '../components/layout/PageHeader.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatLongDate, formatShortDate } from '../utils/dateUtils.js'
import { DAYS } from '../utils/constants.js'

// Tableau de bord des administrateurs et des enseignants (les étudiants ont leur fil d'actualité).
export default function Dashboard() {
  const { users, courses, announcements, feedbacks, currentUser: me, userActions: U, resetData } = useApp()
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isAdmin = me.role === 'admin'

  const pending = users.filter((u) => u.status === 'pending')
  const mine = isAdmin ? courses : courses.filter((c) => c.teacher === me.name)
  const ids = new Set(mine.map((c) => c.id))
  const unclear = feedbacks.filter((f) => f.status === 'flou' && !f.resolved && (isAdmin || ids.has(f.courseId)))
  const todayIdx = (new Date().getDay() + 6) % 7
  const next = [...mine]
    .sort((a, b) => ((DAYS.indexOf(a.day) - todayIdx + 7) % 7) - ((DAYS.indexOf(b.day) - todayIdx + 7) % 7) || a.startTime.localeCompare(b.startTime))
    .slice(0, 4)
  const latest = [...announcements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
  const count = (role) => users.filter((u) => u.role === role && u.status !== 'pending').length

  return (
    <>
      <PageHeader title={`Bonjour, ${me.name}`} description={`${isAdmin ? 'Espace administrateur' : 'Espace enseignant'} · ${formatLongDate()}`} />
      <div className="stats-grid">
        {isAdmin && <StatCard icon={GraduationCap} label="Étudiants actifs" value={count('student')} tone="accent" />}
        {isAdmin && <StatCard icon={Users} label="Enseignants" value={count('teacher')} tone="success" />}
        {isAdmin && <StatCard icon={UserCheck} label="Inscriptions à valider" value={pending.length} tone="danger" />}
        <StatCard icon={CalendarDays} label={isAdmin ? 'Cours publiés' : 'Mes cours'} value={mine.length} tone="neutral" />
        <StatCard icon={MessageSquareWarning} label={isAdmin ? 'Cours signalés flous' : 'Points flous sur mes cours'} value={unclear.length} tone="danger" />
      </div>

      <div className="dashboard-grid">
        {isAdmin && (
          <Card as="section">
            <h2 className="card-title">Comptes en attente de validation</h2>
            {pending.length === 0 ? <EmptyState icon={UserCheck} title="Rien à valider" description="Toutes les inscriptions sont traitées." /> : pending.map((u) => (
              <div className="course item-row" key={u.id}>
                <div><strong>{u.name}</strong><span className="muted">{u.email} · {u.info}</span></div>
                <div className="row-actions">
                  <button className="icon-btn" aria-label="Valider" onClick={() => { U.update(u.id, { status: 'active' }); showToast('Compte validé') }}><Check size={18} /></button>
                  <button className="icon-btn" aria-label="Refuser" onClick={() => { U.remove(u.id); showToast('Inscription refusée') }}><X size={18} /></button>
                </div>
              </div>
            ))}
            <Link to="/utilisateurs">Gérer tous les utilisateurs</Link>
          </Card>
        )}
        <Card as="section">
          <h2 className="card-title">{isAdmin ? 'Prochains cours' : 'Mes prochains cours'}</h2>
          {next.length === 0 ? <EmptyState icon={CalendarDays} title="Aucun cours" description="Publiez l'emploi du temps." /> : next.map((c) => (
            <div className="course" key={c.id}><strong>{c.title}</strong><span className="muted">{c.day} · {c.startTime}–{c.endTime} · {c.room}</span></div>
          ))}
          <Link to="/emploi-du-temps">Voir l'emploi du temps</Link>
        </Card>
        <Card as="section">
          <h2 className="card-title">Cours signalés flous</h2>
          {unclear.length === 0 ? <EmptyState icon={MessageSquareWarning} title="Tout est clair" description="Aucun point flou en attente." /> : unclear.slice(0, 4).map((f) => (
            <div className="course" key={f.id}><strong>{courses.find((c) => c.id === f.courseId)?.title}</strong><span className="muted">{f.author} : {f.message}</span></div>
          ))}
          <Link to="/retours">Voir les retours</Link>
        </Card>
        <Card as="section">
          <h2 className="card-title">Dernières annonces</h2>
          {latest.map((a) => (
            <div className="course" key={a.id}><Badge tone="accent">{a.category}</Badge> <strong>{a.title}</strong><span className="muted">{a.author} · {formatShortDate(a.date)}</span></div>
          ))}
          <Link to="/annonces"><Megaphone size={14} /> Toutes les annonces</Link>
        </Card>
      </div>

      {isAdmin && (
        <div className="dashboard-footer">
          <Button variant="ghost" icon={RotateCcw} onClick={() => setConfirmOpen(true)}>Réinitialiser les données de démo</Button>
        </div>
      )}
      <ConfirmDialog isOpen={confirmOpen} title="Réinitialiser les données ?" confirmLabel="Réinitialiser"
        message="Toutes les données seront remplacées par les données de démonstration et vous serez déconnecté."
        onConfirm={() => { resetData(); setConfirmOpen(false) }} onCancel={() => setConfirmOpen(false)} />
    </>
  )
}
