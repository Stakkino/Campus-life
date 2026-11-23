import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, BookOpen, Link as LinkIcon, FileText, Video, File } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Button from '../../shared/components/Button.jsx'
import Modal from '../../shared/components/Modal.jsx'
import ResourceForm from './ResourceForm.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import SearchBar from '../../shared/components/SearchBar.jsx'
import FilterTabs from '../../shared/components/FilterTabs.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import AudienceBadge from '../../shared/components/AudienceBadge.jsx'
import { audienceFields } from '../../shared/utils/audience.js'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api, uploadFile, openFile } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { RESOURCE_TYPES } from '../../shared/utils/constants.js'
import './resources.css'

const baseFields = [
  { name: 'title', label: 'Titre', required: true },
  { name: 'subject', label: 'Matière', half: true },
  { name: 'type', label: 'Type', type: 'select', options: RESOURCE_TYPES, half: true },
  { name: 'url', label: 'Lien (https://…)', type: 'url', required: true },
]
const descriptionField = { name: 'description', label: 'Description', type: 'textarea' }
const formatSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`)
const ICONS = { Lien: LinkIcon, PDF: FileText, Vidéo: Video, Document: File }

export default function Resources() {
  const { user } = useAuth()
  const catalog = useApi('/catalog')
  const { data, loading, error, reload } = useApi('/resources')
  const fields = [...baseFields, ...audienceFields(catalog.data, user), descriptionField]
  const act = useAction(reload)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const canManage = (r) => user.role !== 'student' || r.authorId === user.id

  const list = useMemo(() => (data ?? []).filter((r) => (type === 'all' || r.type === type) &&
    `${r.title} ${r.subject} ${r.description}`.toLowerCase().includes(search.toLowerCase())), [data, search, type])

  const [notice, setNotice] = useState('')

  async function save({ file, ...v }) {
    const isNew = !editing.id
    const body = { ...v, ...(v.kind === 'file' ? { url: '' } : {}) }
    let saved = null
    const ok = await act(async () => {
      saved = await api(isNew ? '/resources' : `/resources/${editing.id}`, { method: isNew ? 'POST' : 'PUT', body })
      if (file) {
        try { await uploadFile(`/resources/${saved.id}/file`, file) }
        catch (e) { if (isNew) await api(`/resources/${saved.id}`, { method: 'DELETE' }).catch(() => {}); throw e }
      }
    }, isNew ? 'Ressource ajoutée' : 'Ressource modifiée')
    if (ok) setEditing(null)
  }

  async function open(r) {
    setNotice('')
    try { await openFile(`/resources/${r.id}/file`) } catch (e) { setNotice(e.message) }
  }

  return (
    <>
      <PageHeader title="Ressources" description="Liens et fichiers (PDF, Word…) partagés." actions={<Button icon={Plus} onClick={() => setEditing({})}>Ajouter</Button>} />
      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une ressource" />
        <FilterTabs value={type} onChange={setType} options={[{ value: 'all', label: 'Tous' }, ...RESOURCE_TYPES.map((t) => ({ value: t, label: t }))]} />
      </div>
      <ErrorNote message={error || notice} />
      {loading ? <Loading /> : list.length === 0 ? <Card><EmptyState icon={BookOpen} title="Aucune ressource" description="Ajoutez un lien ou un document utile à vos camarades." /></Card> : (
        <div className="cards-grid">
          {list.map((r) => {
            const Icon = ICONS[r.type] || LinkIcon
            return (
              <Card key={r.id} className="resource-card">
                <span className="resource-icon"><Icon size={20} /></span>
                <div className="grow">
                  <h3>{r.title}</h3>
                  <div className="resource-tags">{r.subject && <Badge>{r.subject}</Badge>}<Badge tone="neutral">{r.type}</Badge><AudienceBadge audience={r.audience} /></div>
                  {r.description && <p className="muted">{r.description}</p>}
                </div>
                <div className="resource-actions">
                  {r.hasFile
                    ? <button type="button" className="btn btn-outline btn-sm" onClick={() => open(r)}><ExternalLink size={14} />Ouvrir{r.fileSize ? ` · ${formatSize(r.fileSize)}` : ''}</button>
                    : <a className="btn btn-outline btn-sm" href={r.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Ouvrir</a>}
                  {canManage(r) && (<>
                    <button className="icon-btn muted-btn" aria-label="Modifier" onClick={() => setEditing(r)}><Pencil size={14} /></button>
                    <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(r)}><Trash2 size={14} /></button>
                  </>)}
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Modal isOpen={Boolean(editing)} title={editing?.id ? 'Modifier la ressource' : 'Nouvelle ressource'} onClose={() => setEditing(null)}>
        {editing && <ResourceForm fields={fields} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer « ${toDelete?.title} » ?`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/resources/${toDelete.id}`, { method: 'DELETE' }), 'Ressource supprimée'); setToDelete(null) }} />
    </>
  )
}