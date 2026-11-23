import { useState } from 'react'
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'

import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EntityForm from '../components/ui/EntityForm.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FilterTabs from '../components/ui/FilterTabs.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { TASK_PRIORITIES } from '../utils/constants.js'
import { formatShortDate, isOverdue } from '../utils/dateUtils.js'

const FIELDS = [
  { name: 'title', label: 'Titre', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'priority', label: 'Priorité', type: 'select', options: TASK_PRIORITIES },
  { name: 'dueDate', label: 'Date limite', type: 'date' },
]
const TONES = { low: 'neutral', medium: 'accent', high: 'danger' }

export default function Tasks() {
  const { tasks, taskActions: T, currentUser } = useApp()
  const { showToast } = useToast()
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const list = tasks
    .filter((t) => t.ownerId === currentUser.id)
    .filter((t) => filter === 'all' || (filter === 'done' ? t.done : !t.done))
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.dueDate || '9').localeCompare(b.dueDate || '9'))

  function save(data) {
    if (editing.id) T.update(editing.id, data)
    else T.add({ ...data, done: false, ownerId: currentUser.id })
    showToast(editing.id ? 'Tâche modifiée' : 'Tâche ajoutée')
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Mes tâches" description="Suivez vos devoirs et vos échéances."
        action={<Button icon={Plus} onClick={() => setEditing({})}>Nouvelle tâche</Button>} />
      <div className="toolbar">
        <FilterTabs value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Toutes' }, { value: 'todo', label: 'À faire' }, { value: 'done', label: 'Terminées' }]} />
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={ListChecks} title="Aucune tâche" description="Ajoutez votre première tâche." /></Card>
      ) : (
        <div className="list">
          {list.map((t) => (
            <Card key={t.id} className={`task-row${t.done ? ' is-done' : ''}`}>
              <input type="checkbox" checked={t.done} aria-label={`Terminer ${t.title}`} onChange={() => T.update(t.id, { done: !t.done })} />
              <div className="task-main">
                <strong className="task-title">{t.title}</strong>
                {t.description && <p className="muted">{t.description}</p>}
                <p>
                  <Badge tone={TONES[t.priority]}>{TASK_PRIORITIES.find((p) => p.value === t.priority)?.label}</Badge>{' '}
                  {t.dueDate && <span className="muted">Pour le {formatShortDate(t.dueDate)}</span>}{' '}
                  {!t.done && isOverdue(t.dueDate) && <Badge tone="danger">En retard</Badge>}
                </p>
              </div>
              <div className="row-actions">
                <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(t)}><Pencil size={18} /></button>
                <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(t)}><Trash2 size={18} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal title={editing?.id ? 'Modifier la tâche' : 'Nouvelle tâche'} isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id || 'new'} fields={FIELDS} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer la tâche « ${toDelete?.title} » ?`}
        onCancel={() => setToDelete(null)} onConfirm={() => { T.remove(toDelete.id); setToDelete(null); showToast('Tâche supprimée') }} />
    </>
  )
}
