import { useState, useMemo } from 'react'
import { Plus, Check, Trash2, Pencil, Users } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Button from '../../shared/components/Button.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Modal from '../../shared/components/Modal.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import SearchBar from '../../shared/components/SearchBar.jsx'
import FilterTabs from '../../shared/components/FilterTabs.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import UserForm from './UserForm.jsx'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_LABELS } from '../../shared/utils/constants.js'
import './admin.css'

// L'administrateur crée les comptes, valide les inscriptions et supprime les utilisateurs.
export default function AdminUsers() {
  const { user: me } = useAuth()
  const { data, loading, error, reload } = useApi('/users')
  const catalog = useApi('/catalog')
  const act = useAction(reload)
  const [editing, setEditing] = useState(null) // null | 'new' | utilisateur à modifier
  const [toDelete, setToDelete] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const users = data ?? []

  const list = useMemo(() => users.filter((u) =>
    (filter === 'all' ? u.status !== 'archived' : filter === 'pending' || filter === 'archived' ? u.status === filter : u.role === filter && u.status === 'active') &&
    `${u.name} ${u.email} ${u.info}`.toLowerCase().includes(search.toLowerCase())), [users, filter, search])
  const count = (f) => users.filter((u) => (f === 'all' ? u.status !== 'archived' : f === 'pending' || f === 'archived' ? u.status === f : u.role === f && u.status === 'active')).length

  return (
    <>
      <PageHeader title="Utilisateurs" description="Créez des comptes et validez les inscriptions." actions={<Button icon={Plus} onClick={() => setEditing('new')}>Nouvel utilisateur</Button>} />
      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Nom, email, filière…" />
        <FilterTabs value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'Tous', count: count('all') }, { value: 'pending', label: 'À valider', count: count('pending') },
          { value: 'student', label: 'Étudiants', count: count('student') }, { value: 'teacher', label: 'Enseignants', count: count('teacher') }, { value: 'admin', label: 'Admins', count: count('admin') }, { value: 'archived', label: 'Anciens', count: count('archived') }]} />
      </div>
      <ErrorNote message={error} />
      <Card>
        {loading ? <Loading /> : list.length === 0 ? <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun résultat pour ce filtre." /> : (
          <table className="users-table">
            <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Filière / matière</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td><div className="user-cell"><Avatar name={u.baseName} /><div><strong>{u.name}</strong><small>{u.email}</small></div></div></td>
                  <td><Badge tone={u.role === 'teacher' ? 'blue' : u.role === 'admin' ? 'solid' : 'green'}>{ROLE_LABELS[u.role]}</Badge></td>
                  <td className="muted">{u.info || '—'}</td>
                  <td>{u.status === 'pending' ? <Badge tone="blue">En attente</Badge> : u.status === 'archived' ? <Badge tone="neutral">Ancien</Badge> : <Badge tone="neutral">Actif</Badge>}</td>
                  <td><div className="row-actions">
                    {u.status !== 'active' && <button className="icon-btn" aria-label={u.status === 'pending' ? 'Valider' : 'Réactiver'} title={u.status === 'pending' ? 'Valider' : 'Réactiver'} onClick={() => act(() => api(`/users/${u.id}`, { method: 'PATCH', body: { status: 'active' } }), 'Compte validé')}><Check size={15} /></button>}
                    <button className="icon-btn muted-btn" aria-label="Modifier" onClick={() => setEditing(u)}><Pencil size={15} /></button>
                    {u.id !== me.id && <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(u)}><Trash2 size={15} /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal isOpen={Boolean(editing)} title={editing === 'new' ? 'Nouvel utilisateur' : "Modifier l'utilisateur"} onClose={() => setEditing(null)}>
        {editing && (
          <UserForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing}
            catalog={catalog.data ?? { programs: [], levels: [] }} onCancel={() => setEditing(null)}
            onSubmit={async (body) => {
              const create = editing === 'new'
              const ok = await act(() => api(create ? '/users' : `/users/${editing.id}`, { method: create ? 'POST' : 'PATCH', body }), create ? 'Compte créé' : 'Compte modifié')
              if (ok) setEditing(null)
            }} />
        )}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer le compte de ${toDelete?.name} ? Ses contenus seront conservés sans auteur.`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/users/${toDelete.id}`, { method: 'DELETE' }), 'Compte supprimé'); setToDelete(null) }} />
    </>
  )
}
