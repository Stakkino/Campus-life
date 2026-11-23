import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ArrowRight, CircleAlert, CircleCheck } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Button from '../../shared/components/Button.jsx'
import Badge from '../../shared/components/Badge.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import './admin.css'

// Passage d'année : à faire une fois par an.
//  - chaque étudiant monte au niveau suivant (L1 → L2…)
//  - le dernier niveau sort « ancien étudiant » (compte archivé, données conservées)
//  - les redoublants : on décoche leur nom, ils restent dans leur niveau
export default function Promotion() {
  const { data, loading, error, reload } = useApi('/catalog/promotion')
  const act = useAction(reload)
  const [stays, setStays] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState(null)

  const levels = data?.levels ?? []
  const all = levels.flatMap((l) => l.students.map((s) => ({ ...s, graduates: l.graduates })))
  const staying = all.filter((s) => stays.has(s.id)).length
  const graduating = all.filter((s) => s.graduates && !stays.has(s.id)).length
  const promoting = all.length - staying - graduating

  const toggle = (id) => setStays((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next })

  async function run() {
    setConfirming(false)
    const res = await act(() => api('/catalog/promotion', { method: 'POST', body: { excludeIds: [...stays] } }), "Passage d'année effectué")
    if (res && res !== true) { setResult(res); setStays(new Set()) }
  }

  return (
    <>
      <PageHeader title="Passage d'année" description="Faites monter les étudiants au niveau supérieur en un clic. Le dernier niveau devient « anciens étudiants »." />
      <ErrorNote message={error} />
      {result && (
        <div className="alert alert-ok" role="status" style={{ marginBottom: 14 }}>
          <CircleCheck size={18} />{result.promoted} étudiant(s) passent au niveau supérieur, {result.graduated} sortent diplômé(s), {result.repeating} redouble(nt).
        </div>
      )}
      {loading ? <Loading /> : !data ? null : (
        <>
          {!data.ready && (
            <div className="alert" role="alert" style={{ marginBottom: 14 }}>
              <CircleAlert size={18} /><span>Avant de continuer, indiquez pour chaque niveau où passent ses étudiants. <Link to="/filieres">Aller à Filières &amp; niveaux</Link></span>
            </div>
          )}
          {data.unassigned > 0 && <p className="muted" style={{ marginBottom: 12 }}>{data.unassigned} étudiant(s) sans niveau ne sont pas concernés : modifiez leur compte pour leur attribuer une filière et un niveau.</p>}
          {levels.length === 0 ? (
            <Card><EmptyState icon={TrendingUp} title="Aucun étudiant à faire passer" description="Il n'y a pas d'étudiant actif avec un niveau défini." /></Card>
          ) : (
            levels.map((l) => (
              <Card key={l.id} className="promo-level">
                <div className="promo-head">
                  <h2>{l.name}</h2><ArrowRight size={16} />
                  {l.graduates ? <Badge tone="solid">Diplômés (archivés)</Badge> : l.nextName ? <Badge tone="blue">{l.nextName}</Badge> : <Badge tone="neutral">À définir</Badge>}
                  <small className="muted">{l.students.length} étudiant{l.students.length > 1 ? 's' : ''}</small>
                </div>
                <div className="promo-list">
                  {l.students.map((s) => (
                    <label key={s.id} className={`promo-student ${stays.has(s.id) ? 'stays' : ''}`}>
                      <input type="checkbox" checked={!stays.has(s.id)} onChange={() => toggle(s.id)} />
                      <span>{s.name}{s.program && <small> · {s.program}</small>}{stays.has(s.id) && <small> · redouble</small>}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))
          )}
          {levels.length > 0 && (
            <div className="promo-bar">
              <span><strong>{promoting}</strong> passent · <strong>{graduating}</strong> sortent · <strong>{staying}</strong> redoublent <small className="muted">(décochez un nom pour le faire redoubler)</small></span>
              <Button icon={TrendingUp} disabled={!data.ready || all.length === 0} onClick={() => setConfirming(true)}>Lancer le passage d'année</Button>
            </div>
          )}
        </>
      )}
      <ConfirmDialog isOpen={confirming} title="Lancer le passage d'année ?" confirmLabel="Confirmer le passage"
        message={`${promoting} étudiant(s) passeront au niveau supérieur, ${graduating} deviendront anciens étudiants (compte archivé) et ${staying} redoubleront. Cette opération est à faire une seule fois par année.`}
        onCancel={() => setConfirming(false)} onConfirm={run} />
    </>
  )
}
