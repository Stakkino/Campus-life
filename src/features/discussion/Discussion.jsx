import { useState, useEffect, useRef } from 'react'
import { Send, Hash, Pencil, Trash2, MessagesSquare } from 'lucide-react'

import PageHeader from '../../shared/components/PageHeader.jsx'
import Card from '../../shared/components/Card.jsx'
import Avatar from '../../shared/components/Avatar.jsx'
import Badge from '../../shared/components/Badge.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import ErrorNote from '../../shared/components/ErrorNote.jsx'
import { useApi, useList, useAction } from '../../shared/hooks/useApi.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDateTime } from '../../shared/utils/dates.js'
import './chat.css'

// Discussion : salon général, salon de sa filière, de sa classe et de ses cours (l'admin les voit tous). Les messages se rafraîchissent toutes les 5 secondes.
const SECTIONS = [{ kind: 'general', label: 'Salons' }, { kind: 'program', label: 'Filières' }, { kind: 'class', label: 'Classes' }, { kind: 'course', label: 'Cours' }]

export default function Discussion() {
  const { user } = useAuth()
  const channelList = useList('/channels') // salons que CET utilisateur a le droit de voir
  const [channel, setChannel] = useState('general')
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const messages = useApi(`/messages?channel=${encodeURIComponent(channel)}`, { refreshMs: 5000 })
  const act = useAction(messages.reload)
  const endRef = useRef(null)
  const list = messages.data ?? []

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [list.length, channel])

  async function send(event) {
    event.preventDefault()
    if (!text.trim()) return
    const ok = editingId
      ? await act(() => api(`/messages/${editingId}`, { method: 'PUT', body: { text } }))
      : await act(() => api('/messages', { method: 'POST', body: { channel, text } }))
    if (ok) { setText(''); setEditingId(null) }
  }

  const current = channelList.data.find((c) => c.id === channel)
  const mine = (m) => m.authorId === user.id
  const canManage = (m) => user.role !== 'student' || mine(m)

  return (
    <>
      <PageHeader title="Discussion" description="Échangez entre étudiants et enseignants." />
      <div className="chat">
        <Card className="chat-channels">
          {SECTIONS.map(({ kind, label }) => {
            const items = channelList.data.filter((c) => c.kind === kind)
            if (items.length === 0) return null
            return (
              <div key={kind} className="channel-group">
                <div className="nav-label">{label}</div>
                {items.map((c) => (
                  <button key={c.id} className={`channel ${channel === c.id ? 'active' : ''}`} onClick={() => { setChannel(c.id); setEditingId(null); setText('') }}><Hash size={15} />{c.name}</button>
                ))}
              </div>
            )
          })}
          {user.role === 'admin' && <small className="muted channel-note">Administrateur : vous voyez tous les salons.</small>}
        </Card>
        <Card className="chat-box">
          {current && <div className="chat-title"><Hash size={16} />{current.name}</div>}
          <ErrorNote message={messages.error} />
          <div className="chat-messages" aria-live="polite">
            {list.length === 0 && !messages.loading ? <EmptyState icon={MessagesSquare} title="Aucun message" description="Lancez la discussion !" /> : list.map((m) => (
              <div className={`msg ${mine(m) ? 'me' : ''}`} key={m.id}>
                <Avatar name={m.author} size="sm" />
                <div className="msg-body">
                  <small>{mine(m) ? 'Vous' : m.author} {m.role === 'teacher' && <Badge tone="blue">Enseignant</Badge>} · {formatDateTime(m.date)}</small>
                  <div className="bubble">{m.text}</div>
                  {canManage(m) && (
                    <div className="msg-actions">
                      {mine(m) && <button aria-label="Modifier" onClick={() => { setEditingId(m.id); setText(m.text) }}><Pencil size={12} /></button>}
                      <button aria-label="Supprimer" onClick={() => act(() => api(`/messages/${m.id}`, { method: 'DELETE' }))}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-form" onSubmit={send}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={editingId ? 'Modifier le message…' : 'Écrire un message…'} aria-label="Message" />
            {editingId && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingId(null); setText('') }}>Annuler</button>}
            <button className="btn" aria-label="Envoyer"><Send size={16} /></button>
          </form>
        </Card>
      </div>
    </>
  )
}
