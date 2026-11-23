import { Link } from 'react-router-dom'
import { CalendarDays, MessageSquareWarning, MessageCircle, ClipboardCheck, Plus, Check } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import StatCard from '../../shared/components/StatCard.jsx'
import Card from '../../shared/components/Card.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Button from '../../shared/components/Button.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { FEEDBACK_STATUSES } from '../../shared/utils/constants.js'
import '../admin/admin.css'
import { formatLongDate, formatShortDate, timeAgo, parseISO } from '../../shared/utils/dates.js'

const statusOf = (v) => FEEDBACK_STATUSES.find((s) => s.value === v)

// Tableau de bord de l'enseignant : ce que ses étudiants lui disent + ses examens.
export default function TeacherDashboard() {
  const { user } = useAuth()
  const stats = useApi('/stats/teacher')
  const feedbacks = useList('/feedbacks')
  const exams = useList('/exams')
  const act = useAction(stats.reload, feedbacks.reload)
  const s = stats.data

  if (stats.loading) return <Loading />
  if (!s) return <ErrorNote message={stats.error} />

  const todo = feedbacks.data.filter((f) => !f.resolved && f.status !== 'compris').slice(0, 4)
  const myExams = exams.data.filter((e) => e.teacherId === user.id).slice(0, 3)

  return (
    <>
      <PageHeader title={`Bonjour, ${user.name}`} description={`Ce que vos étudiants vous disent · ${formatLongDate()}`}
        actions={<Link to="/examens"><Button icon={Plus}>Planifier un examen</Button></Link>} />
      <div className="stats-grid">
        <StatCard icon={CalendarDays} label="Mes cours" value={s.courses} hint="Voir l'emploi du temps" />
        <StatCard icon={MessageSquareWarning} label="Points flous" value={s.flou} tone="blue" hint="À reprendre en cours" />
        <StatCard icon={MessageCircle} label="Questions" value={s.questions} hint="Sans réponse" />
        <StatCard icon={ClipboardCheck} label="Prochain examen" value={s.nextExam ? (s.nextExam.daysLeft === 0 ? "Auj." : `J-${s.nextExam.daysLeft}`) : '—'} tone="blue"
          hint={s.nextExam ? `${s.nextExam.course} · ${formatShortDate(parseISO(s.nextExam.date))}` : 'Aucun examen prévu'} />
      </div>
      <div className="grid-2">
        <Card>
          <h2 className="card-title">Retours à traiter<Link to="/retours">Voir tout</Link></h2>
          {todo.length === 0 ? <EmptyState icon={MessageSquareWarning} title="Tout est clair" description="Aucun point flou ni question en attente." /> : todo.map((f) => (
            <div className="item-row" key={f.id}>
              <Avatar name={f.author} />
              <div className="grow"><strong>{f.author} <span className="muted" style={{ fontWeight: 500 }}>· {f.course}</span></strong><small>{f.message}</small><small style={{ display: 'block' }}>{timeAgo(f.date)}</small></div>
              <Badge tone={statusOf(f.status)?.tone}>{statusOf(f.status)?.label}</Badge>
              <button className="icon-btn" aria-label="Marquer comme traité" onClick={() => act(() => api(`/feedbacks/${f.id}`, { method: 'PATCH', body: { resolved: true } }), 'Retour traité')}><Check size={15} /></button>
            </div>
          ))}
        </Card>
        <div className="stack">
          <Card>
            <h2 className="card-title">Mes examens à venir<Link to="/examens">Gérer</Link></h2>
            {myExams.length === 0 ? <EmptyState title="Aucun examen" description="Planifiez-en un depuis la page Examens." /> : myExams.map((e) => (
              <div className="item-row" key={e.id}>
                <div className="grow"><strong>{e.course}</strong><small>{formatShortDate(parseISO(e.date))} · {e.startTime}{e.room && ` · ${e.room}`}</small></div>
                <Badge tone="blue">J-{e.daysLeft}</Badge>
              </div>
            ))}
          </Card>
          <Card>
            <h2 className="card-title">Clarté par cours</h2>
            {s.clarity.length === 0 ? <EmptyState title="Pas encore de retours" /> : s.clarity.map((c) => (
              <div className="bar-line" key={c.title}>
                <b>{c.title}<small>{Math.round((c.flou / c.total) * 100)} % flou</small></b>
                <div className="progress blue"><div style={{ width: `${(c.flou / c.total) * 100}%` }} /></div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}
