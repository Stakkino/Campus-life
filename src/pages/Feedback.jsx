import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, CheckCheck, MessageSquareWarning } from 'lucide-react'

import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EntityForm from '../components/ui/EntityForm.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FilterTabs from '../components/ui/FilterTabs.jsx'
import Social from '../components/ui/Social.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { FEEDBACK_STATUSES } from '../utils/constants.js'
import { formatShortDate, todayISO } from '../utils/dateUtils.js'

// Retours de cours : un étudiant signale un point flou, les enseignants et camarades répondent en commentaire.
export default function Feedback() {
  const { feedbacks, courses, feedbackActions: F, currentUser, canManage } = useApp()
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const courseFilter = params.get('cours') || 'all'
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const fields = [
    { name: 'courseId', label: 'Cours concerné', type: 'select', options: courses.map((c) => ({ value: c.id, label: `${c.title} (${c.day})` })) },
    { name: 'status', label: 'Mon retour', type: 'select', options: FEEDBACK_STATUSES },
    { name: 'message', label: 'Précisez ce qui est flou ou votre avis', type: 'textarea', required: true },
  ]
  const list = feedbacks
    .filter((f) => (courseFilter === 'all' || f.courseId === courseFilter) && (status === 'all' || f.status === status))
    .sort((a, b) => b.date.localeCompare(a.date))

  function save(data) {
    if (editing.id) F.update(editing.id, data)
    else F.add({ ...data, resolved: false, author: currentUser.name, authorId: currentUser.id, date: todayISO(), reactions: { like: [], love: [] }, comments: [] })
    showToast(editing.id ? 'Retour modifié' : 'Retour publié')
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Retours de cours" description="Signalez un cours flou, posez une question ou donnez votre avis."
        action={<Button icon={Plus} onClick={() => courses.length ? setEditing({}) : showToast("Ajoutez d'abord un cours", 'error')}>Nouveau retour</Button>} />
      <div className="toolbar">
        <select aria-label="Filtrer par cours" value={courseFilter} onChange={(e) => setParams(e.target.value === 'all' ? {} : { cours: e.target.value })}>
          <option value="all">Tous les cours</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <FilterTabs value={status} onChange={setStatus} options={[{ value: 'all', label: 'Tous' }, ...FEEDBACK_STATUSES]} />
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={MessageSquareWarning} title="Aucun retour" description="Aucun retour pour ce filtre." /></Card>
      ) : (
        <div className="list">
          {list.map((f) => {
            const st = FEEDBACK_STATUSES.find((s) => s.value === f.status)
            return (
              <Card as="article" key={f.id}>
                <div className="post-head">
                  <div>
                    <Badge tone={st?.tone}>{st?.label}</Badge> {f.resolved && <Badge tone="success">Résolu</Badge>}
                    <h2>{courses.find((c) => c.id === f.courseId)?.title || 'Cours supprimé'}</h2>
                    <p className="muted">{f.author} · {formatShortDate(f.date)}</p>
                  </div>
                  {canManage(f) && (
                    <div className="row-actions">
                      <button className="icon-btn" aria-label={f.resolved ? 'Rouvrir' : 'Marquer comme résolu'} onClick={() => F.update(f.id, { resolved: !f.resolved })}><CheckCheck size={18} /></button>
                      <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(f)}><Pencil size={18} /></button>
                      <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(f)}><Trash2 size={18} /></button>
                    </div>
                  )}
                </div>
                <p className="post-content">{f.message}</p>
                <Social item={f} actions={F} />
              </Card>
            )
          })}
        </div>
      )}
      <Modal title={editing?.id ? 'Modifier le retour' : 'Nouveau retour de cours'} isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id || 'new'} fields={fields} initial={{ courseId: courseFilter !== 'all' ? courseFilter : undefined, ...editing }} onSubmit={save} onCancel={() => setEditing(null)} submitLabel={editing.id ? 'Enregistrer' : 'Publier'} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message="Supprimer ce retour et ses commentaires ?"
        onCancel={() => setToDelete(null)} onConfirm={() => { F.remove(toDelete.id); setToDelete(null); showToast('Retour supprimé') }} />
    </>
  )
}
