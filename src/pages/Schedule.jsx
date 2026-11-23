import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, MapPin, UserRound, MessageSquareWarning } from 'lucide-react'

import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EntityForm from '../components/ui/EntityForm.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { DAYS } from '../utils/constants.js'

export default function Schedule() {
  const { courses, users, courseActions: C, currentUser } = useApp()
  const canEdit = currentUser.role !== 'student'
  const { showToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const teachers = [{ value: '', label: '— Non précisé —' }, ...users.filter((u) => u.role === 'teacher' && u.status !== 'pending').map((u) => ({ value: u.name, label: u.name }))]
  const fields = [
    { name: 'title', label: 'Matière / cours', required: true },
    { name: 'day', label: 'Jour', type: 'select', options: DAYS },
    { name: 'startTime', label: 'Début', type: 'time', required: true },
    { name: 'endTime', label: 'Fin', type: 'time', required: true },
    { name: 'room', label: 'Salle' },
    { name: 'teacher', label: 'Enseignant', type: 'select', options: teachers },
  ]

  function save(data) {
    if (data.endTime <= data.startTime) return showToast("L'heure de fin doit être après l'heure de début", 'error')
    if (editing.id) C.update(editing.id, data)
    else C.add(data)
    showToast(editing.id ? 'Cours modifié' : 'Cours ajouté à l\'emploi du temps')
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Emploi du temps" description="Les cours et horaires de la semaine."
        action={canEdit && <Button icon={Plus} onClick={() => setEditing({})}>Publier un cours</Button>} />
      <div className="week">
        {DAYS.map((day) => {
          const list = courses.filter((c) => c.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
          return (
            <Card as="section" key={day} className="day-col">
              <h2>{day}</h2>
              {list.length === 0 && <p className="muted">Aucun cours</p>}
              {list.map((c) => (
                <div className="course" key={c.id}>
                  <div className="item-row">
                    <div>
                      <span className="muted">{c.startTime} – {c.endTime}</span>
                      <strong>{c.title}</strong>
                      {c.room && <span className="muted"><MapPin size={13} /> {c.room}</span>}<br />
                      {c.teacher && <span className="muted"><UserRound size={13} /> {c.teacher}</span>}
                    </div>
                    {canEdit && <div className="row-actions">
                      <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(c)}><Pencil size={16} /></button>
                      <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(c)}><Trash2 size={16} /></button>
                    </div>}
                  </div>
                  <Link className="muted" to={`/retours?cours=${c.id}`}><MessageSquareWarning size={13} /> Retours sur ce cours</Link>
                </div>
              ))}
            </Card>
          )
        })}
      </div>
      <Modal title={editing?.id ? 'Modifier le cours' : 'Publier un cours'} isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id || 'new'} fields={fields} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Retirer « ${toDelete?.title} » de l'emploi du temps ?`}
        onCancel={() => setToDelete(null)} onConfirm={() => { C.remove(toDelete.id); setToDelete(null); showToast('Cours supprimé') }} />
    </>
  )
}
