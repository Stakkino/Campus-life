import { useState } from 'react'
import { Check, Trash2, MessageSquareWarning, Undo2 } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Button from '../../shared/components/Button.jsx'
import FilterTabs from '../../shared/components/FilterTabs.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import Social from '../../shared/components/Social.jsx'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { FEEDBACK_STATUSES } from '../../shared/utils/constants.js'
import { timeAgo } from '../../shared/utils/dates.js'
import './feedback.css'

const statusOf = (v) => FEEDBACK_STATUSES.find((s) => s.value === v)

// Retours de cours. Étudiant : signale "c'est flou", pose une question ou dit "bien compris".
// Enseignant : voit les retours de SES cours, les marque comme traités et répond en commentaire.
export default function Feedback() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useApi('/feedbacks')
  const courses = useList('/courses')
  const act = useAction(reload)
  const [filter, setFilter] = useState('all')
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const staff = user.role !== 'student'
  const all = data ?? []
  const list = all.filter((f) => filter === 'all' || (filter === 'open' ? !f.resolved && f.status !== 'compris' : f.status === filter))

  async function send(event) {
    event.preventDefault()
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    setBusy(true)
    if (await act(() => api('/feedbacks', { method: 'POST', body }), 'Retour envoyé')) form.reset()
    setBusy(false)
  }

  return (
    <>
      <PageHeader title={staff ? 'Retours étudiants' : 'Retours de cours'} description={staff ? 'Ce que vos étudiants ont compris ou non.' : "Dites à vos enseignants ce qui est flou, ou posez une question."} />

      {!staff && (
        <Card>
          <form className="form feedback-form" onSubmit={send}>
            <div className="form-grid">
              <div className="field"><label htmlFor="fb-course">Cours</label>
                <select id="fb-course" name="courseId" required defaultValue="">
                  <option value="" disabled>Choisir un cours…</option>
                  {courses.data.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select></div>
              <div className="field"><label htmlFor="fb-status">Type</label>
                <select id="fb-status" name="status">{FEEDBACK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div className="field"><label htmlFor="fb-msg">Message</label><textarea id="fb-msg" name="message" required rows={2} placeholder="Ex. Je n'ai pas compris la différence entre INNER JOIN et LEFT JOIN." /></div>
            <div className="form-actions"><Button type="submit" disabled={busy}>Envoyer</Button></div>
          </form>
        </Card>
      )}

      <FilterTabs value={filter} onChange={setFilter} options={[
        { value: 'all', label: 'Tous', count: all.length },
        ...(staff ? [{ value: 'open', label: 'À traiter', count: all.filter((f) => !f.resolved && f.status !== 'compris').length }] : []),
        ...FEEDBACK_STATUSES.map((s) => ({ value: s.value, label: s.label, count: all.filter((f) => f.status === s.value).length }))]} />
      <ErrorNote message={error} />
      {loading ? <Loading /> : list.length === 0 ? <Card><EmptyState icon={MessageSquareWarning} title="Aucun retour" description="Les retours apparaîtront ici." /></Card> : (
        <div className="stack">
          {list.map((f) => (
            <Card key={f.id} className={f.resolved ? 'resolved' : ''}>
              <div className="post-head">
                <Avatar name={f.author} />
                <div className="grow"><strong>{f.author} <span className="muted" style={{ fontWeight: 500 }}>· {f.course}</span></strong><small>{timeAgo(f.date)}</small></div>
                {f.resolved && <Badge tone="neutral">Traité</Badge>}
                <Badge tone={statusOf(f.status)?.tone}>{statusOf(f.status)?.label}</Badge>
              </div>
              <div className="post-body"><p>{f.message}</p></div>
              <div className="feedback-actions">
                {staff && <Button size="sm" variant="outline" icon={f.resolved ? Undo2 : Check} onClick={() => act(() => api(`/feedbacks/${f.id}`, { method: 'PATCH', body: { resolved: !f.resolved } }), f.resolved ? 'Retour rouvert' : 'Retour traité')}>{f.resolved ? 'Rouvrir' : 'Marquer traité'}</Button>}
                {(staff || f.authorId === user.id) && <button className="icon-btn muted-btn" aria-label="Supprimer" onClick={() => setToDelete(f)}><Trash2 size={14} /></button>}
              </div>
              <Social item={f} basePath="/feedbacks" onChange={reload} />
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog isOpen={Boolean(toDelete)} message="Supprimer ce retour ?" onCancel={() => setToDelete(null)}
        onConfirm={async () => { await act(() => api(`/feedbacks/${toDelete.id}`, { method: 'DELETE' }), 'Retour supprimé'); setToDelete(null) }} />
    </>
  )
}
