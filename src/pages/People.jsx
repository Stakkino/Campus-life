import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react'

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
import { initials } from '../components/layout/StudentLayout.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { ROLE_LABELS } from '../utils/constants.js'

const FIELDS = [
  { name: 'name', label: 'Nom complet', required: true },
  { name: 'role', label: 'Rôle', type: 'select', options: [{ value: 'student', label: 'Étudiant' }, { value: 'teacher', label: 'Enseignant' }] },
  { name: 'email', label: 'Email (identifiant de connexion)', type: 'email', required: true },
  { name: 'password', label: 'Mot de passe', required: true },
  { name: 'info', label: 'Filière / matière enseignée' },
]

// Espace administrateur : créer, modifier, supprimer des comptes et valider les inscriptions.
export default function People() {
  const { users, userActions: U } = useApp()
  const { showToast } = useToast()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const pending = users.filter((u) => u.status === 'pending').length

  const list = users.filter((u) =>
    (tab === 'all' || (tab === 'pending' ? u.status === 'pending' : u.role === tab)) &&
    `${u.name} ${u.email} ${u.info}`.toLowerCase().includes(q.toLowerCase()))

  function save(data) {
    const duplicate = users.some((u) => u.id !== editing.id && u.email.toLowerCase() === data.email.toLowerCase())
    if (duplicate) return showToast('Cet email est déjà utilisé', 'error')
    if (editing.id) U.update(editing.id, data)
    else U.add({ ...data, status: 'active' })
    showToast(editing.id ? 'Compte modifié' : 'Compte créé')
    setEditing(null)
  }

  return (
    <>
      <PageHeader title="Utilisateurs" description="Gérez les comptes étudiants et enseignants, validez les inscriptions."
        action={<Button icon={Plus} onClick={() => setEditing({})}>Ajouter un compte</Button>} />
      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher une personne..." />
        <FilterTabs value={tab} onChange={setTab} options={[
          { value: 'all', label: 'Tous' }, { value: 'student', label: 'Étudiants' }, { value: 'teacher', label: 'Enseignants' },
          { value: 'pending', label: `En attente (${pending})` }]} />
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={Users} title="Aucun résultat" description="Aucun compte ne correspond." /></Card>
      ) : (
        <div className="people-grid">
          {list.map((u) => (
            <Card key={u.id}>
              <div className="item-row">
                <div className="task-row">
                  <span className={`avatar ${u.role === 'student' ? '' : 'teacher'}`}>{initials(u.name)}</span>
                  <div>
                    <strong>{u.name}</strong><br />
                    <Badge tone={u.role === 'student' ? 'neutral' : 'success'}>{ROLE_LABELS[u.role]}</Badge>{' '}
                    {u.status === 'pending' && <Badge tone="danger">En attente</Badge>}
                    <p className="muted">{u.info}{u.email && ` · ${u.email}`}</p>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <div className="row-actions">
                    <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(u)}><Pencil size={18} /></button>
                    <button className="icon-btn" aria-label="Supprimer" onClick={() => setToDelete(u)}><Trash2 size={18} /></button>
                  </div>
                )}
              </div>
              {u.status === 'pending' && (
                <div className="modal-actions">
                  <Button variant="secondary" icon={X} onClick={() => { U.remove(u.id); showToast('Inscription refusée') }}>Refuser</Button>
                  <Button icon={Check} onClick={() => { U.update(u.id, { status: 'active' }); showToast(`${u.name} peut maintenant se connecter`) }}>Valider</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Modal title={editing?.id ? 'Modifier le compte' : 'Ajouter un compte'} isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id || 'new'} fields={FIELDS} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer le compte de ${toDelete?.name} ?`}
        onCancel={() => setToDelete(null)} onConfirm={() => { U.remove(toDelete.id); setToDelete(null); showToast('Compte supprimé') }} />
    </>
  )
}
