import { useState } from 'react'
import { Send, Pencil, Trash2, MessagesSquare } from 'lucide-react'

import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EntityForm from '../components/ui/EntityForm.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FilterTabs from '../components/ui/FilterTabs.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatDateTime } from '../utils/dateUtils.js'

// Discussion élèves ↔ enseignants : un salon général + un salon par cours.
export default function Discussion() {
  const { messages, courses, messageActions: M, currentUser, canManage } = useApp()
  const { showToast } = useToast()
  const [channel, setChannel] = useState('general')
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(null)

  const channels = [{ value: 'general', label: 'Général' }, ...courses.map((c) => ({ value: c.id, label: c.title }))]
  const list = messages.filter((m) => m.channel === channel).sort((a, b) => a.date.localeCompare(b.date))

  function send(event) {
    event.preventDefault()
    if (!text.trim()) return
    M.add({ channel, authorId: currentUser.id, author: currentUser.name, role: currentUser.role, text: text.trim(), date: new Date().toISOString() })
    setText('')
  }

  return (
    <>
      <PageHeader title="Discussion" description="Échangez entre étudiants et enseignants." />
      <div className="toolbar"><FilterTabs value={channel} onChange={setChannel} options={channels} /></div>
      <Card>
        {list.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="Aucun message" description="Lancez la discussion !" />
        ) : (
          <div className="chat">
            {list.map((m) => (
              <div key={m.id} className={`msg${m.authorId === currentUser.id ? ' mine' : ''}`}>
                <div className="msg-head">
                  <strong>{m.author}</strong> {m.role === 'teacher' && <Badge tone="success">Enseignant</Badge>}
                  <span className="muted">{formatDateTime(m.date)}</span>
                  {canManage(m) && (
                    <>
                      <button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(m)}><Pencil size={15} /></button>
                      <button className="icon-btn" aria-label="Supprimer" onClick={() => { M.remove(m.id); showToast('Message supprimé') }}><Trash2 size={15} /></button>
                    </>
                  )}
                </div>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
        )}
        <form className="comment-form" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message en tant que ${currentUser.name}…`} aria-label="Message" />
          <Button type="submit" icon={Send}>Envoyer</Button>
        </form>
      </Card>
      <Modal title="Modifier le message" isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <EntityForm key={editing.id} fields={[{ name: 'text', label: 'Message', type: 'textarea', required: true }]} initial={editing}
          onSubmit={(d) => { M.update(editing.id, d); setEditing(null); showToast('Message modifié') }} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  )
}
