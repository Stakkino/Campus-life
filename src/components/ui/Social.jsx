import { useState } from 'react'
import { ThumbsUp, Heart, MessageCircle, Send, Trash2 } from 'lucide-react'

import Badge from './Badge.jsx'
import Button from './Button.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { formatDateTime } from '../../utils/dateUtils.js'

const REACTIONS = [
  { type: 'like', label: "J'aime", icon: ThumbsUp },
  { type: 'love', label: "J'adore", icon: Heart },
]

// Réactions + commentaires, réutilisés sous les annonces et les retours de cours.
// `actions` = les actions de la collection (react, comment, removeComment).
export default function Social({ item, actions }) {
  const { currentUser } = useApp()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const comments = item.comments || []

  function submit(event) {
    event.preventDefault()
    if (!text.trim()) return
    actions.comment(item.id, {
      authorId: currentUser.id, author: currentUser.name, role: currentUser.role,
      text: text.trim(), date: new Date().toISOString(),
    })
    setText('')
  }

  return (
    <div className="social">
      <div className="social-bar">
        {REACTIONS.map(({ type, label, icon: Icon }) => {
          const list = item.reactions?.[type] || []
          const active = list.includes(currentUser.id)
          return (
            <button key={type} type="button" aria-pressed={active}
              className={`react-btn react-${type}${active ? ' is-active' : ''}`}
              onClick={() => actions.react(item.id, type, currentUser.id)}>
              <Icon size={16} aria-hidden="true" /> {label} <b>{list.length}</b>
            </button>
          )
        })}
        <button type="button" className="react-btn" onClick={() => setOpen(!open)}>
          <MessageCircle size={16} aria-hidden="true" /> Commentaires <b>{comments.length}</b>
        </button>
      </div>
      {open && (
        <div className="comments">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <div>
                <strong>{c.author}</strong> {c.role === 'teacher' && <Badge tone="success">Enseignant</Badge>}{' '}
                <span className="muted">{formatDateTime(c.date)}</span>
                <p>{c.text}</p>
              </div>
              {(c.authorId === currentUser.id || currentUser.role === 'teacher') && (
                <button type="button" className="icon-btn" aria-label="Supprimer le commentaire"
                  onClick={() => actions.removeComment(item.id, c.id)}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <form className="comment-form" onSubmit={submit}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un commentaire…" aria-label="Commentaire" />
            <Button type="submit" icon={Send}>Envoyer</Button>
          </form>
        </div>
      )}
    </div>
  )
}
