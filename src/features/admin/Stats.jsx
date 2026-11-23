import { Link } from 'react-router-dom'
import { GraduationCap, Users, MessagesSquare, UserCheck, Check, X, Plus } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import StatCard from '../../shared/components/StatCard.jsx'
import Card from '../../shared/components/Card.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Button from '../../shared/components/Button.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatLongDate } from '../../shared/utils/dates.js'
import ActivityChart from './ActivityChart.jsx'
import Donut from './Donut.jsx'
import './admin.css'

// Tableau de bord de l'administrateur : toutes les statistiques viennent de PostgreSQL.
export default function AdminStats() {
  const { user } = useAuth()
  const stats = useApi('/stats/admin')
  const users = useList('/users')
  const act = useAction(stats.reload, users.reload)
  const s = stats.data
  const pending = users.data.filter((u) => u.status === 'pending')

  if (stats.loading) return <Loading />
  if (!s) return <ErrorNote message={stats.error} />

  const evo = s.publications.evolution
  const maxFlou = Math.max(1, ...s.flouCourses.map((c) => c.total))

  return (
    <>
      <PageHeader title={`Bonjour, ${user.name}`} description={`Vue d'ensemble du campus · ${formatLongDate()}`}
        actions={<Link to="/annonces"><Button icon={Plus}>Annonce</Button></Link>} />

      <div className="stats-grid">
        <StatCard icon={GraduationCap} label="Étudiants actifs" value={s.students} hint={`+${s.newStudents} cette semaine`} />
        <StatCard icon={Users} label="Enseignants" value={s.teachers} tone="blue" hint="Comptes actifs" />
        <StatCard icon={MessagesSquare} label="Publications & messages" value={s.publications.total}
          hint={evo === null ? `${s.publications.thisWeek} cette semaine` : `${evo >= 0 ? '▲ +' : '▼ '}${evo} % vs semaine passée`} />
        <StatCard icon={UserCheck} label="Inscriptions à valider" value={s.pending} tone="blue" hint={s.pending ? 'À traiter' : 'Tout est traité'} />
      </div>

      <div className="grid-2">
        <Card><h2 className="card-title">Activité des 7 derniers jours</h2><ActivityChart data={s.activity} /></Card>
        <Card><h2 className="card-title">Répartition des comptes</h2><Donut students={s.students} teachers={s.teachers} /></Card>
      </div>

      <div className="grid-3">
        <Card>
          <h2 className="card-title">Comptes à valider<Link to="/utilisateurs">Tout voir</Link></h2>
          {pending.length === 0 ? <EmptyState icon={UserCheck} title="Rien à valider" description="Toutes les inscriptions sont traitées." /> : pending.slice(0, 4).map((u) => (
            <div className="item-row" key={u.id}>
              <Avatar name={u.name} />
              <div className="grow"><strong>{u.name}</strong><small>{u.info || u.email}</small></div>
              <div className="row-actions">
                <button className="icon-btn" aria-label="Valider" onClick={() => act(() => api(`/users/${u.id}`, { method: 'PATCH', body: { status: 'active' } }), 'Compte validé')}><Check size={15} /></button>
                <button className="icon-btn muted-btn" aria-label="Refuser" onClick={() => act(() => api(`/users/${u.id}`, { method: 'DELETE' }), 'Inscription refusée')}><X size={15} /></button>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h2 className="card-title">Cours les plus signalés flous</h2>
          {s.flouCourses.length === 0 ? <EmptyState title="Aucun retour" description="Les retours des étudiants apparaîtront ici." /> : s.flouCourses.map((c) => (
            <div className="bar-line" key={c.title}>
              <b>{c.title}<small>{c.flou} flou · {c.total} retour{c.total > 1 ? 's' : ''}</small></b>
              <div className="progress blue"><div style={{ width: `${(c.flou / maxFlou) * 100}%` }} /></div>
            </div>
          ))}
        </Card>
        <Card>
          <h2 className="card-title">Étudiants les plus actifs</h2>
          {s.topStudents.length === 0 ? <EmptyState title="Aucun étudiant" description="Validez ou créez des comptes étudiants." /> : s.topStudents.map((t, i) => (
            <div className="item-row" key={t.id}>
              <Avatar name={t.name} />
              <div className="grow"><strong>{t.name}</strong><small>{t.contributions} contribution{t.contributions > 1 ? 's' : ''}</small></div>
              <Badge tone={i % 2 ? 'blue' : 'green'}>#{i + 1}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </>
  )
}
