import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { CircleCheck, CircleAlert } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, tone = 'ok') => {
    setToast({ message, tone, id: Date.now() })
    setTimeout(() => setToast((t) => (t && Date.now() - t.id >= 2800 ? null : t)), 3000)
  }, [])
  const value = useMemo(() => ({ showToast }), [showToast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.tone}`} role="status" key={toast.id}>
          {toast.tone === 'ok' ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return ctx
}
