import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react'

import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EntityForm from '../components/ui/EntityForm.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FilterTabs from '../components/ui/FilterTabs.jsx'
import Social from '../components/ui/Social.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { ANNOUNCEMENT_CATEGORIES } from '../utils/constants.js'
import { formatShortDate, todayISO } from '../utils/dateUtils.js'

const FIELDS = [
  { name: 'title', label: 'Titre', required: true },
  { name: 'category', label: 'Catégorie', type: 'select', options: ANNOUNCEMENT_CATEGORIES },
  { name: 'content', label: 'Contenu', type: 'textarea', required: true },
]

export default function Announcements() {
  const { announcements, announcementActions: A, currentUser, canManage } = useApp()
  const { showToast } = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [editing, setEditing] = useState(null) // null = fermé, {} = nouvelle, objet = modification
  const [toDelete, setToDelete] = useState(null)

  const list = useMemo(
    () =>
      announcements
        .filter((a) => (cat === 'all' || a.category === cat) && `${a.title} ${a.content}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [announcements, q, cat],
  )

  function save(data) {
    if (editing.id) A.update(editing.id, data)
    else A.add({ ...data, author: currentUser.name, authorId: currentUser.id, date: todayISO(), reactions: { like: [], love: [] }, comments: [] })
    showToast(editing.id ? 'Annonce modifiée' : 'Annonce publiée')
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Annonces" description="Les informations importantes du campus."
        action={<Button icon={Plus} onClick={() => setEditing({})}>Nouvelle annonce</Button>} />
      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher une annonce..." />
        <FilterTabs value={cat} onChange={setCat} options={[{ value: 'all', label: 'Toutes' }, ...ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={Megaphone} title="Aucune annonce" description="Publiez la première annonce pour les étudiants." /></Card>
      ) : (
        <div className="list">
          {list.map((a) => (
            <Card as="article" key={a.id}>
              <div className="post-head">
                <div>
                  <Badge tone="accent">{a.category}</Badge>
                  <h2>{a.title}</h2>
                  <p className="muted">{a.author} · {formatShortDate(a.date)}</p>
                </div>
                {canManage(a) && (
                  <div className="row-actions">
                    <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(a)}><Pencil size={18} /></button>
                    <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(a)}><Trash2 size={18} /></button>
                  </div>
                )}
              </div>
              <p className="post-content">{a.content}</p>
              <Social item={a} actions={A} />
            </Card>
          ))}
        </div>
      )}
      <Modal title={editing?.id ? "Modifier l'annonce" : 'Nouvelle annonce'} isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id || 'new'} fields={FIELDS} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} submitLabel={editing.id ? 'Enregistrer' : 'Publier'} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer l'annonce « ${toDelete?.title} » ?`}
        onCancel={() => setToDelete(null)} onConfirm={() => { A.remove(toDelete.id); setToDelete(null); showToast('Annonce supprimée') }} />
    </>
  )
}
