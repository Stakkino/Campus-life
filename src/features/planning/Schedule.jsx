import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, User, CalendarDays } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Button from '../../shared/components/Button.jsx'
import Modal from '../../shared/components/Modal.jsx'
import EntityForm from '../../shared/components/EntityForm.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import AudienceBadge from '../../shared/components/AudienceBadge.jsx'
import { audienceFields } from '../../shared/utils/audience.js'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { DAYS } from '../../shared/utils/constants.js'
import './planning.css'

// Emploi du temps de la semaine. Admin : gère tous les cours. Enseignant : gère les siens.
export default function Schedule() {
  const { user } = useAuth()
  const courses = useApi('/courses')
  const catalog = useApi('/catalog')
  const users = useList(user.role === 'admin' ? '/users' : null)
  const act = useAction(courses.reload)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const staff = user.role !== 'student'
  const list = courses.data ?? []
  const todayName = DAYS[(new Date().getDay() + 6) % 7]
  const canEdit = (c) => user.role === 'admin' || c.teacherId === user.id

  const fields = [
    { name: 'title', label: 'Intitulé du cours', required: true },
    { name: 'day', label: 'Jour', type: 'select', options: DAYS, half: true },
    { name: 'room', label: 'Salle', half: true },
    { name: 'startTime', label: 'Début', type: 'time', required: true, half: true },
    { name: 'endTime', label: 'Fin', type: 'time', required: true, half: true },
    ...audienceFields(catalog.data, user),
    ...(user.role === 'admin' ? [{ name: 'teacherId', label: 'Enseignant', type: 'select', options: [{ value: '', label: '— Non attribué —' }, ...users.data.filter((u) => u.role === 'teacher').map((u) => ({ value: u.id, label: u.name }))] }] : []),
  ]

  async function save(v) {
    const ok = editing.id
      ? await act(() => api(`/courses/${editing.id}`, { method: 'PUT', body: v }), 'Cours modifié')
      : await act(() => api('/courses', { method: 'POST', body: v }), 'Cours ajouté')
    if (ok) setEditing(null)
  }

  return (
    <>
      <PageHeader title="Emploi du temps" description="Les cours de la semaine." actions={staff && <Button icon={Plus} onClick={() => setEditing({})}>Ajouter un cours</Button>} />
      <ErrorNote message={courses.error} />
      {courses.loading ? <Loading /> : list.length === 0 ? (
        <Card><EmptyState icon={CalendarDays} title="Aucun cours" description={staff ? 'Ajoutez le premier cours avec le bouton ci-dessus.' : "L'emploi du temps n'est pas encore publié."} /></Card>
      ) : (
        <div className="week">
          {DAYS.map((day) => {
            const items = list.filter((c) => c.day === day)
            return (
              <section key={day} className={`day ${day === todayName ? 'today' : ''}`}>
                <h2>{day}{day === todayName && <span> · Aujourd'hui</span>}</h2>
                {items.length === 0 ? <p className="muted day-empty">Pas de cours</p> : items.map((c) => (
                  <Card key={c.id} className="course-card">
                    <span className="course-time">{c.startTime} – {c.endTime}</span>
                    <strong>{c.title}</strong>
                    {c.room && <small><MapPin size={13} /> {c.room}</small>}
                    {c.teacher && <small><User size={13} /> {c.teacher}</small>}
                    <AudienceBadge audience={c.audience} />
                    {staff && canEdit(c) && (
                      <div className="row-actions">
                        <button className="icon-btn muted-btn" aria-label="Modifier" onClick={() => setEditing(c)}><Pencil size={13} /></button>
                        <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(c)}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </Card>
                ))}
              </section>
            )
          })}
        </div>
      )}
      <Modal isOpen={Boolean(editing)} title={editing?.id ? 'Modifier le cours' : 'Nouveau cours'} onClose={() => setEditing(null)}>
        {editing && <EntityForm fields={fields} initial={{ ...editing, teacherId: editing.teacherId ?? '' }} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer « ${toDelete?.title} » ? Les examens et retours liés seront aussi supprimés.`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/courses/${toDelete.id}`, { method: 'DELETE' }), 'Cours supprimé'); setToDelete(null) }} />
    </>
  )
}
