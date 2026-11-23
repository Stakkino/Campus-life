import { useState } from 'react'
import { ClipboardCheck, Trash2 } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Badge from '../../shared/components/Badge.jsx'
import EntityForm from '../../shared/components/EntityForm.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatShortDate, parseISO, relativeDays } from '../../shared/utils/dates.js'
import './exams.css'

// Calendrier des examens. Tout le monde les consulte ; l'enseignant (ses cours) et l'admin les planifient.
export default function Exams() {
  const { user } = useAuth()
  const exams = useApi('/exams')
  const courses = useList('/courses')
  const act = useAction(exams.reload)
  const [toDelete, setToDelete] = useState(null)
  const staff = user.role !== 'student'
  const myCourses = courses.data.filter((c) => user.role === 'admin' || c.teacherId === user.id)

  const fields = [
    { name: 'courseId', label: 'Cours', type: 'select', required: true, options: myCourses.map((c) => ({ value: c.id, label: c.title })) },
    { name: 'title', label: 'Intitulé', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true, half: true },
    { name: 'startTime', label: 'Heure', type: 'time', required: true, half: true },
    { name: 'room', label: 'Salle' },
  ]

  return (
    <>
      <PageHeader title="Examens" description={staff ? 'Planifiez et consultez les examens. Les étudiants sont prévenus par une annonce.' : 'Les prochains examens du campus.'} />
      <div className={staff ? 'exam-layout' : ''}>
        <Card>
          <h2 className="card-title">Calendrier des examens</h2>
          {exams.error && <ErrorNote message={exams.error} />}
          {exams.loading ? <Loading /> : (exams.data ?? []).length === 0 ? <EmptyState icon={ClipboardCheck} title="Aucun examen prévu" description={staff ? 'Utilisez le formulaire pour en planifier un.' : 'Les examens apparaîtront ici.'} /> : exams.data.map((e, i) => {
            const d = parseISO(e.date)
            const mine = user.role === 'admin' || e.teacherId === user.id
            return (
              <div className="item-row exam-row" key={e.id}>
                <div className={`exam-date ${i % 2 ? 'blue' : ''}`}><span>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d).replace('.', '')}</span><strong>{d.getDate()}</strong></div>
                <div className="grow"><strong>{e.course} · {e.title}</strong><small>{e.startTime}{e.room && ` · ${e.room}`} · {formatShortDate(d)}</small></div>
                <Badge tone={e.daysLeft <= 7 ? 'blue' : 'green'}>{relativeDays(e.date)}</Badge>
                {staff && mine && <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(e)}><Trash2 size={14} /></button>}
              </div>
            )
          })}
        </Card>
        {staff && (
          <Card>
            <h2 className="card-title">Nouvel examen</h2>
            {myCourses.length === 0 ? <EmptyState title="Aucun cours" description="Créez d'abord un cours dans l'emploi du temps." /> : (
              <EntityForm key={myCourses.length + String(exams.data?.length)} fields={fields} submitLabel="Publier l'examen"
                onSubmit={(v) => act(() => api('/exams', { method: 'POST', body: v }), 'Examen publié')} />
            )}
          </Card>
        )}
      </div>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer l'examen « ${toDelete?.title} » ?`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/exams/${toDelete.id}`, { method: 'DELETE' }), 'Examen supprimé'); setToDelete(null) }} />
    </>
  )
}
