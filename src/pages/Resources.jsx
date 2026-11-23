import { useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, BookOpen } from 'lucide-react'

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
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { RESOURCE_TYPES } from '../utils/constants.js'

const FIELDS = [
  { name: 'title', label: 'Titre', required: true },
  { name: 'subject', label: 'Matière' },
  { name: 'type', label: 'Type', type: 'select', options: RESOURCE_TYPES },
  { name: 'url', label: 'Lien (https://...)', type: 'url', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
]

export default function Resources() {
  const { resources, resourceActions: R, currentUser } = useApp()
  const canEdit = currentUser.role !== 'student'
  const { showToast } = useToast()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const list = resources.filter((r) => (type === 'all' || r.type === type) && `${r.title} ${r.subject} ${r.description}`.toLowerCase().includes(q.toLowerCase()))

  function save(data) {
    if (editing.id) R.update(editing.id, data)
    else R.add(data)
    showToast(editing.id ? 'Ressource modifiée' : 'Ressource ajoutée')
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Ressources" description="Liens et documents pédagogiques."
        action={canEdit && <Button icon={Plus} onClick={() => setEditing({})}>Ajouter</Button>} />
      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher une ressource..." />
        <FilterTabs value={type} onChange={setType} options={[{ value: 'all', label: 'Tout' }, ...RESOURCE_TYPES.map((t) => ({ value: t, label: t }))]} />
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title="Aucune ressource" description="Ajoutez un lien ou un document utile." /></Card>
      ) : (
        <div className="people-grid">
          {list.map((r) => (
            <Card as="article" key={r.id}>
              <div className="post-head">
                <div><Badge tone="accent">{r.type}</Badge> {r.subject && <Badge>{r.subject}</Badge>}<h2>{r.title}</h2></div>
                {canEdit && <div className="row-actions">
                  <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(r)}><Pencil size={18} /></button>
                  <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(r)}><Trash2 size={18} /></button>
                </div>}
              </div>
              <p className="post-content">{r.description}</p>
              <a className="btn btn-secondary" href={r.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Ouvrir</a>
            </Card>
          ))}
        </div>
      )}
      <Modal title={editing?.id ? 'Modifier la ressource' : 'Nouvelle ressource'} isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id || 'new'} fields={FIELDS} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer « ${toDelete?.title} » ?`}
        onCancel={() => setToDelete(null)} onConfirm={() => { R.remove(toDelete.id); setToDelete(null); showToast('Ressource supprimée') }} />
    </>
  )
}
