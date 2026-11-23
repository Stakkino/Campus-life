import { useState } from 'react'
import { Link } from 'react-router-dom'

import Card from '../../shared/components/Card.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Badge from '../../shared/components/Badge.jsx'
import Button from '../../shared/components/Button.jsx'
import Loading from '../../shared/components/Loading.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ANNOUNCEMENT_CATEGORIES, DAYS } from '../../shared/utils/constants.js'
import { studentChoices } from '../../shared/utils/audience.js'
import { formatShortDate, parseISO, relativeDays } from '../../shared/utils/dates.js'
import PostList from '../announcements/PostList.jsx'
import './student.css'

// Prochain cours : le premier cours qui n'est pas encore terminé cette semaine (sinon le premier de la semaine suivante).
function nextCourse(courses) {
  const now = new Date()
  const today = (now.getDay() + 6) % 7
  const minutes = now.getHours() * 60 + now.getMinutes()
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const score = (c) => {
    let diff = DAYS.indexOf(c.day) - today
    if (diff < 0 || (diff === 0 && toMin(c.endTime) <= minutes)) diff += 7
    return diff * 1440 + toMin(c.startTime)
  }
  return [...courses].sort((a, b) => score(a) - score(b))[0]
}

// Accueil de l'étudiant : fil d'actualité + prochain cours + tâches + examens.
export default function StudentHome() {
  const { user } = useAuth()
  const posts = useApi('/announcements')
  const catalog = useApi('/catalog')
  const choices = studentChoices(catalog.data, user)
  const courses = useList('/courses')
  const tasks = useList('/tasks')
  const exams = useList('/exams')
  const act = useAction(posts.reload)
  const [busy, setBusy] = useState(false)

  async function publish(event) {
    event.preventDefault()
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    const audience = choices.find((c) => c.value === body.audience) ?? choices[0]
    delete body.audience
    Object.assign(body, { programId: audience.programId, levelId: audience.levelId })
    setBusy(true)
    if (await act(() => api('/announcements', { method: 'POST', body }), 'Publication ajoutée')) form.reset()
    setBusy(false)
  }

  const next = nextCourse(courses.data)
  const doneCount = tasks.data.filter((t) => t.done).length
  const todo = tasks.data.filter((t) => !t.done).slice(0, 3)

  return (
    <div className="split">
      <div className="stack">
        <Card>
          <form className="composer" onSubmit={publish}>
            <div className="composer-top">
              <Avatar name={user.name} />
              <input name="title" required className="composer-input" placeholder={`Quoi de neuf, ${user.name.split(' ')[0]} ?`} aria-label="Titre" />
            </div>
            <textarea name="content" required rows={2} className="composer-input" placeholder="Écrivez votre publication…" aria-label="Contenu" />
            <div className="toolbar">
              <div className="composer-options">
                <select name="category" className="input" style={{ width: 'auto' }} aria-label="Catégorie">{ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                <select name="audience" className="input" style={{ width: 'auto' }} aria-label="Destinataires" title="Qui verra cette publication ?">{choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
              </div>
              <Button type="submit" disabled={busy}>Publier</Button>
            </div>
          </form>
        </Card>
        <ErrorNote message={posts.error} />
        {posts.loading ? <Loading /> : <PostList posts={posts.data ?? []} reload={posts.reload} />}
      </div>

      <aside className="stack">
        <div className="next-course">
          <span>{next ? 'PROCHAIN COURS' : 'EMPLOI DU TEMPS'}</span>
          {next ? (<><strong>{next.title}</strong><p>{next.day} · {next.startTime}–{next.endTime}{next.room && ` · ${next.room}`}{next.teacher && ` · ${next.teacher}`}</p></>)
            : (<><strong>Aucun cours</strong><p>L'emploi du temps n'est pas encore publié.</p></>)}
        </div>
        <Card>
          <h2 className="card-title">Mes tâches<Link to="/taches">Voir tout</Link></h2>
          {tasks.data.length === 0 ? <p className="muted">Aucune tâche pour le moment.</p> : (
            <>
              {todo.map((t) => <div className="mini-task" key={t.id}><span className="chk" /><div><strong>{t.title}</strong>{t.dueDate && <small>{relativeDays(t.dueDate)}</small>}</div></div>)}
              <div className="progress"><div style={{ width: `${(doneCount / tasks.data.length) * 100}%` }} /></div>
              <small className="muted">{doneCount} tâche{doneCount > 1 ? 's' : ''} sur {tasks.data.length} terminée{doneCount > 1 ? 's' : ''}</small>
            </>
          )}
        </Card>
        <Card>
          <h2 className="card-title">Examens à venir<Link to="/examens">Voir tout</Link></h2>
          {exams.data.length === 0 ? <p className="muted">Aucun examen prévu.</p> : exams.data.slice(0, 3).map((e) => (
            <div className="item-row" key={e.id}><div className="grow"><strong>{e.course}</strong><small>{formatShortDate(parseISO(e.date))} · {e.startTime}</small></div><Badge tone="blue">{relativeDays(e.date)}</Badge></div>
          ))}
        </Card>
      </aside>
    </div>
  )
}
