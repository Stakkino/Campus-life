import Modal from './Modal.jsx'
import Button from './Button.jsx'

// Demande une confirmation avant une action sensible (suppression, réinitialisation...).
export default function ConfirmDialog({
  isOpen,
  title = 'Confirmer cette action',
  message,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onCancel}>
      <p className="confirm-message">{message}</p>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
