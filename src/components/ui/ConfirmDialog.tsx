interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative rounded-xl p-6 w-full max-w-sm shadow-lg"
        style={{ background: 'var(--color-surface)' }}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
