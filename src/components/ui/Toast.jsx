import { CircleCheck, TriangleAlert, X } from 'lucide-react'

// Zone d'affichage des notifications. Elle est rendue une seule fois par ToastProvider.
export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = toast.type === 'error' ? TriangleAlert : CircleCheck
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <Icon size={20} aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" className="icon-btn" onClick={() => onDismiss(toast.id)} aria-label="Fermer la notification">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
