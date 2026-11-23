import { useState } from 'react'
import { ThumbsUp, Heart, MessageCircle, Trash2, Send } from 'lucide-react'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Avatar from './Avatar.jsx'
import Badge from './Badge.jsx'
import { timeAgo } from '../utils/dates.js'

// Réactions (J'aime / J'adore) + commentaires, communs aux annonces et aux retours de cours.
// basePath : '/announcements' ou '/feedbacks'.   onChange : recharge la liste après chaque action.
export default function Social({ item, basePath, onChange }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const reactions = { like: [], love: [], ...item.reactions }
  const comments = item.comments || []

  const run = async (fn) => { try { await fn(); await onChange() } catch (e) { showToast(e.message, 'error') } }
  const react = (type) => run(() => api(`${basePath}/${item.id}/react`, { method: 'POST', body: { type } }))
  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    run(() => api(`${basePath}/${item.id}/comments`, { method: 'POST', body: { text } })).then(() => setText(''))
  }

  return (
    <>
      <div className="social">
        <button className={`social-btn ${reactions.like.includes(user.id) ? 'on' : ''}`} onClick={() => react('like')}><ThumbsUp size={16} />{reactions.like.length || ''} J'aime</button>
        <button className={`social-btn ${reactions.love.includes(user.id) ? 'on' : ''}`} onClick={() => react('love')}><Heart size={16} />{reactions.love.length || ''} J'adore</button>
        <button className="social-btn" onClick={() => setOpen(!open)}><MessageCircle size={16} />{comments.length} commentaire{comments.length > 1 ? 's' : ''}</button>
      </div>
      {open && (
        <div className="comments">
          {comments.map((c) => (
            <div className="comment" key={c.id}>
              <Avatar name={c.author} size="sm" />
              <div className="comment-bubble">
                <strong>{c.author || 'Anonyme'}</strong> {c.role === 'teacher' && <Badge tone="blue">Enseignant</Badge>}
                <small className="muted"> · {timeAgo(c.date)}</small>
                <p>{c.text}</p>
              </div>
              {(user.role !== 'student' || c.authorId === user.id) && (
                <button className="icon-btn muted-btn" aria-label="Supprimer le commentaire" onClick={() => run(() => api(`${basePath}/${item.id}/comments/${c.id}`, { method: 'DELETE' }))}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          <form className="comment-form" onSubmit={send}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un commentaire…" aria-label="Commentaire" />
            <button className="icon-btn" aria-label="Envoyer"><Send size={15} /></button>
          </form>
        </div>
      )}
    </>
  )
}
