import { useState } from 'react'
import { Plus, Check, Pencil, Trash2, ListChecks } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Button from '../../shared/components/Button.jsx'
import Modal from '../../shared/components/Modal.jsx'
import EntityForm from '../../shared/components/EntityForm.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import FilterTabs from '../../shared/components/FilterTabs.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { TASK_PRIORITIES } from '../../shared/utils/constants.js'
import { daysUntil, relativeDays } from '../../shared/utils/dates.js'
import './student.css'

const FIELDS = [
  { name: 'title', label: 'Titre', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'priority', label: 'Priorité', type: 'select', options: TASK_PRIORITIES, half: true },
  { name: 'dueDate', label: 'Échéance', type: 'date', half: true },
]
const prio = { low: 'neutral', medium: 'green', high: 'blue' }

// Mes tâches : ajouter, modifier, cocher, supprimer. Les données sont dans PostgreSQL.
export default function StudentTasks() {
  const { data, loading, error, reload } = useApi('/tasks')
  const act = useAction(reload)
  const [filter, setFilter] = useState('todo')
  const [editing, setEditing] = useState(null) // objet tâche, ou {} pour une nouvelle
  const [toDelete, setToDelete] = useState(null)
  const tasks = data ?? []
  const done = tasks.filter((t) => t.done).length
  const list = tasks.filter((t) => filter === 'all' || (filter === 'done') === t.done)

  async function save(values) {
    const body = { ...values, dueDate: values.dueDate || null }
    const ok = editing.id
      ? await act(() => api(`/tasks/${editing.id}`, { method: 'PATCH', body }), 'Tâche modifiée')
      : await act(() => api('/tasks', { method: 'POST', body }), 'Tâche ajoutée')
    if (ok) setEditing(null)
  }

  return (
    <>
      <PageHeader title="Mes tâches" description={`${done} sur ${tasks.length} terminée${done > 1 ? 's' : ''}`} actions={<Button icon={Plus} onClick={() => setEditing({})}>Nouvelle tâche</Button>} />
      {tasks.length > 0 && <div className="progress"><div style={{ width: `${(done / tasks.length) * 100}%` }} /></div>}
      <FilterTabs value={filter} onChange={setFilter} options={[
        { value: 'todo', label: 'À faire', count: tasks.length - done }, { value: 'done', label: 'Terminées', count: done }, { value: 'all', label: 'Toutes', count: tasks.length }]} />
      <ErrorNote message={error} />
      <Card>
        {loading ? <Loading /> : list.length === 0 ? <EmptyState icon={ListChecks} title="Aucune tâche" description="Ajoutez votre première tâche avec le bouton ci-dessus." /> : list.map((t) => {
          const late = t.dueDate && !t.done && daysUntil(t.dueDate) < 0
          return (
            <div className="task-card" key={t.id}>
              <button className={`task-check ${t.done ? 'done' : ''}`} aria-label={t.done ? 'Marquer à faire' : 'Marquer terminée'} onClick={() => act(() => api(`/tasks/${t.id}`, { method: 'PATCH', body: { done: !t.done } }))}>{t.done && <Check size={14} />}</button>
              <div className={`task-main ${t.done ? 'done' : ''}`}>
                <strong>{t.title}</strong>
                {t.description && <span className="muted">{t.description}</span>}
                <div className="task-meta">
                  <Badge tone={prio[t.priority]}>{TASK_PRIORITIES.find((p) => p.value === t.priority)?.label}</Badge>
                  {t.dueDate && <span className={late ? 'late' : ''}>{late ? 'En retard · ' : ''}{relativeDays(t.dueDate)}</span>}
                </div>
              </div>
              <div className="row-actions">
                <button className="icon-btn muted-btn" aria-label="Modifier" onClick={() => setEditing(t)}><Pencil size={14} /></button>
                <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(t)}><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
      </Card>
      <Modal isOpen={Boolean(editing)} title={editing?.id ? 'Modifier la tâche' : 'Nouvelle tâche'} onClose={() => setEditing(null)}>
        {editing && <EntityForm fields={FIELDS} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer « ${toDelete?.title} » ?`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/tasks/${toDelete.id}`, { method: 'DELETE' }), 'Tâche supprimée'); setToDelete(null) }} />
    </>
  )
}
