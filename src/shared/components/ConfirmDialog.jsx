import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function ConfirmDialog({ isOpen, title = 'Confirmer', message, confirmLabel = 'Supprimer', onConfirm, onCancel }) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p className="muted">{message}</p>
      <div className="form-actions" style={{ marginTop: 20 }}>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="dark" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
