import { useState } from 'react'
import { Plus, Pencil, Trash2, Layers } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Button from '../../shared/components/Button.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Modal from '../../shared/components/Modal.jsx'
import EntityForm from '../../shared/components/EntityForm.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import './admin.css'

const STANDARD_LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2']

// Une liste modifiable (filières OU niveaux) : ajouter, renommer, supprimer.
function CatalogCard({ title, hint, placeholder, path, items, act, quickAdd, extra }) {
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  async function add(event) {
    event.preventDefault()
    if (!name.trim()) return
    if (await act(() => api(`/catalog/${path}`, { method: 'POST', body: { name } }), 'Ajouté')) setName('')
  }

  return (
    <Card>
      <h2 className="card-title">{title}</h2>
      <p className="catalog-hint">{hint}</p>
      <form className="catalog-add" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} aria-label={title} />
        <Button type="submit" icon={Plus}>Ajouter</Button>
      </form>
      {items.length === 0 ? (
        <>
          <EmptyState icon={Layers} title="Liste vide" description="Ajoutez le premier élément ci-dessus." />
          {quickAdd && (
            <Button variant="outline" onClick={() => act(async () => { for (const n of quickAdd) await api(`/catalog/${path}`, { method: 'POST', body: { name: n } }) }, 'Niveaux ajoutés')}>
              Ajouter {quickAdd[0]} à {quickAdd[quickAdd.length - 1]}
            </Button>
          )}
        </>
      ) : (
        items.map((item) => (
          <div className="catalog-row" key={item.id}>
            <strong>{item.name}</strong>
            {extra?.(item)}
            <Badge tone="neutral">{item.students} utilisateur{item.students > 1 ? 's' : ''}</Badge>
            <button className="icon-btn muted-btn" aria-label="Renommer" onClick={() => setRenaming(item)}><Pencil size={15} /></button>
            <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(item)}><Trash2 size={15} /></button>
          </div>
        ))
      )}
      <Modal isOpen={Boolean(renaming)} title="Renommer" onClose={() => setRenaming(null)}>
        {renaming && (
          <EntityForm fields={[{ name: 'name', label: 'Nom', required: true }]} initial={renaming} onCancel={() => setRenaming(null)}
            onSubmit={async (v) => { if (await act(() => api(`/catalog/${path}/${renaming.id}`, { method: 'PATCH', body: v }), 'Renommé')) setRenaming(null) }} />
        )}
      </Modal>
      <ConfirmDialog isOpen={Boolean(toDelete)} message={`Supprimer « ${toDelete?.name} » ?`} onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/catalog/${path}/${toDelete.id}`, { method: 'DELETE' }), 'Supprimé'); setToDelete(null) }} />
    </Card>
  )
}

// L'admin définit UNE fois les filières et les niveaux : ensuite tout le monde les choisit dans une liste.
export default function AdminCatalog() {
  const { data, loading, error, reload } = useApi('/catalog')
  const act = useAction(reload)
  return (
    <>
      <PageHeader title="Filières & niveaux" description="Définissez les listes proposées à l'inscription et dans la création des comptes." />
      <ErrorNote message={error} />
      {loading ? <Loading /> : (
        <div className="catalog-grid">
          <CatalogCard title="Filières" hint="Ex. Informatique, Gestion, Droit…" placeholder="Nouvelle filière" path="programs" items={data.programs} act={act} />
          <CatalogCard title="Niveaux" hint="Ex. L1, L2, L3, M1, M2… Indiquez aussi où passent les étudiants l'année suivante : c'est ce qui permet le passage d'année." placeholder="Nouveau niveau" path="levels" items={data.levels} act={act} quickAdd={STANDARD_LEVELS}
            extra={(item) => (
              <select className="next-select" aria-label={`Année suivante de ${item.name}`} value={item.graduates ? 'graduate' : item.nextLevelId || ''}
                onChange={(e) => { const v = e.target.value; act(() => api(`/catalog/levels/${item.id}`, { method: 'PATCH', body: v === 'graduate' ? { graduates: true } : { nextLevelId: v || null, graduates: false } }), 'Enregistré') }}>
                <option value="">Année suivante : à définir</option>
                {data.levels.filter((l) => l.id !== item.id).map((l) => <option key={l.id} value={l.id}>Passe en {l.name}</option>)}
                <option value="graduate">Diplômé (quitte le campus)</option>
              </select>
            )} />
        </div>
      )}
    </>
  )
}
