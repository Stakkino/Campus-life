import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Button from '../../shared/components/Button.jsx'
import Modal from '../../shared/components/Modal.jsx'
import EntityForm from '../../shared/components/EntityForm.jsx'
import SearchBar from '../../shared/components/SearchBar.jsx'
import FilterTabs from '../../shared/components/FilterTabs.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ANNOUNCEMENT_CATEGORIES } from '../../shared/utils/constants.js'
import PostList from './PostList.jsx'
import { postFields } from './postFields.js'

// Page Annonces (administrateur et enseignants).
export default function Announcements() {
  const { user } = useAuth()
  const catalog = useApi('/catalog')
  const { data, loading, error, reload } = useApi('/announcements')
  const act = useAction(reload)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const posts = useMemo(() => (data ?? []).filter((p) =>
    (category === 'all' || p.category === category) && `${p.title} ${p.content}`.toLowerCase().includes(search.toLowerCase())), [data, search, category])

  return (
    <>
      <PageHeader title="Annonces" description="Publiez et consultez les informations du campus." actions={<Button icon={Plus} onClick={() => setCreating(true)}>Nouvelle annonce</Button>} />
      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une annonce" />
        <FilterTabs value={category} onChange={setCategory} options={[{ value: 'all', label: 'Toutes' }, ...ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      </div>
      <ErrorNote message={error} />
      {loading ? <Loading /> : <PostList posts={posts} reload={reload} />}
      <Modal isOpen={creating} title="Nouvelle annonce" onClose={() => setCreating(false)}>
        <EntityForm fields={postFields(catalog.data, user)} onCancel={() => setCreating(false)} submitLabel="Publier"
          onSubmit={async (v) => { if (await act(() => api('/announcements', { method: 'POST', body: v }), 'Annonce publiée')) setCreating(false) }} />
      </Modal>
    </>
  )
}
