import { useState } from 'react'
import { Pencil, Trash2, Newspaper } from 'lucide-react'

import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EntityForm from '../components/ui/EntityForm.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Social from '../components/ui/Social.jsx'
import { initials } from '../components/layout/StudentLayout.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { ANNOUNCEMENT_CATEGORIES } from '../utils/constants.js'
import { formatShortDate, todayISO } from '../utils/dateUtils.js'

const FIELDS = [
  { name: 'title', label: 'Titre', required: true },
  { name: 'category', label: 'Catégorie', type: 'select', options: ANNOUNCEMENT_CATEGORIES },
  { name: 'content', label: 'Contenu', type: 'textarea', required: true },
]

// Fil d'actualité étudiant (style Facebook) : on publie, réagit, commente, modifie et supprime ses publications.
export default function Feed() {
  const { announcements, users, announcementActions: A, currentUser: me, canManage } = useApp()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const list = [...announcements].sort((a, b) => b.date.localeCompare(a.date))
  const roleOf = (post) => users.find((u) => u.id === post.authorId)?.role

  function publish(event) {
    event.preventDefault()
    const d = Object.fromEntries(new FormData(event.currentTarget))
    A.add({ ...d, author: me.name, authorId: me.id, date: todayISO(), reactions: { like: [], love: [] }, comments: [] })
    event.currentTarget.reset()
    showToast('Publication ajoutée')
  }

  return (
    <>
      <Card className="composer">
        <form onSubmit={publish} className="entity-form">
          <div className="task-row">
            <span className="avatar">{initials(me.name)}</span>
            <input name="title" required placeholder={`Quoi de neuf, ${me.name.split(' ')[0]} ?`} aria-label="Titre" className="composer-input" />
          </div>
          <textarea name="content" required rows={2} placeholder="Écrivez votre publication…" aria-label="Contenu" className="composer-input" />
          <div className="toolbar">
            <select name="category" aria-label="Catégorie">{ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <Button type="submit">Publier</Button>
          </div>
        </form>
      </Card>
      {list.length === 0 ? (
        <Card><EmptyState icon={Newspaper} title="Aucune publication" description="Soyez le premier à publier !" /></Card>
      ) : (
        <div className="list">
          {list.map((a) => (
            <Card as="article" key={a.id}>
              <div className="post-head">
                <div className="task-row">
                  <span className={`avatar ${roleOf(a) === 'teacher' ? 'teacher' : ''}`}>{initials(a.author)}</span>
                  <div><strong>{a.author}</strong> {roleOf(a) === 'teacher' && <Badge tone="success">Enseignant</Badge>}{roleOf(a) === 'admin' && <Badge tone="success">Admin</Badge>}
                    <p className="muted">{formatShortDate(a.date)} · {a.category}</p></div>
                </div>
                {canManage(a) && a.authorId === me.id && (
                  <div className="row-actions">
                    <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(a)}><Pencil size={18} /></button>
                    <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(a)}><Trash2 size={18} /></button>
                  </div>
                )}
              </div>
              <h2 className="post-title">{a.title}</h2>
              <p className="post-content">{a.content}</p>
              <Social item={a} actions={A} />
            </Card>
          ))}
        </div>
      )}
      <Modal title="Modifier la publication" isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id} fields={FIELDS} initial={editing} onCancel={() => setEditing(null)}
          onSubmit={(d) => { A.update(editing.id, d); setEditing(null); showToast('Publication modifiée') }} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message="Supprimer cette publication ?"
        onCancel={() => setToDelete(null)} onConfirm={() => { A.remove(toDelete.id); setToDelete(null); showToast('Publication supprimée') }} />
    </>
  )
}
