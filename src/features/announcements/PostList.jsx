import { useState } from 'react'
import { Pencil, Trash2, Newspaper } from 'lucide-react'

import Card from '../../shared/components/Card.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Modal from '../../shared/components/Modal.jsx'
import EntityForm from '../../shared/components/EntityForm.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Social from '../../shared/components/Social.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import AudienceBadge from '../../shared/components/AudienceBadge.jsx'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { timeAgo } from '../../shared/utils/dates.js'
import { postFields } from './postFields.js'

// Liste de publications (utilisée par l'accueil étudiant ET la page Annonces).
// Chacun modifie / supprime ses publications ; le personnel modère tout.
export default function PostList({ posts, reload }) {
  const { user } = useAuth()
  const catalog = useApi('/catalog')
  const act = useAction(reload)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const canManage = (p) => user.role !== 'student' || p.authorId === user.id

  if (posts.length === 0) return <Card><EmptyState icon={Newspaper} title="Aucune publication" description="Rien à afficher pour le moment." /></Card>

  return (
    <>
      <div className="stack">
        {posts.map((p) => (
          <Card as="article" key={p.id} className="post">
            <div className="post-head">
              <Avatar name={p.author} />
              <div className="grow"><strong>{p.author}</strong><small>{timeAgo(p.date)}</small></div>
              <AudienceBadge audience={p.audience} />
              <Badge tone={p.category === 'Examens' ? 'blue' : 'green'}>{p.category}</Badge>
              {canManage(p) && (
                <div className="row-actions">
                  <button className="icon-btn muted-btn" aria-label="Modifier" onClick={() => setEditing(p)}><Pencil size={14} /></button>
                  <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(p)}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <div className="post-body"><h3>{p.title}</h3><p>{p.content}</p></div>
            <Social item={p} basePath="/announcements" onChange={reload} />
          </Card>
        ))}
      </div>
      <Modal isOpen={Boolean(editing)} title="Modifier la publication" onClose={() => setEditing(null)}>
        {editing && <EntityForm fields={postFields(catalog.data, user)} initial={editing} onCancel={() => setEditing(null)}
          onSubmit={async (v) => { if (await act(() => api(`/announcements/${editing.id}`, { method: 'PUT', body: v }), 'Publication modifiée')) setEditing(null) }} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer « ${toDelete?.title} » ?`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/announcements/${toDelete.id}`, { method: 'DELETE' }), 'Publication supprimée'); setToDelete(null) }} />
    </>
  )
}
