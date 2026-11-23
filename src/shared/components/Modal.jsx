import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, title, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])
  if (!isOpen) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn muted-btn" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
