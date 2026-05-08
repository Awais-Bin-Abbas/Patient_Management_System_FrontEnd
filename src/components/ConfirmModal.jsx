import { useEffect } from 'react'
import Button from './Button'

const ICONS = {
  danger:  { bg: 'bg-red-100',    icon: '🗑️',  color: 'text-red-600'    },
  warning: { bg: 'bg-amber-100',  icon: '⚠️',  color: 'text-amber-600'  },
  success: { bg: 'bg-green-100',  icon: '✓',   color: 'text-green-700 text-xl font-bold' },
  info:    { bg: 'bg-blue-100',   icon: 'ℹ️',  color: 'text-blue-600'   },
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Are you sure?',
  message      = '',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  loading      = false,
}) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const { bg, icon, color } = ICONS[variant] ?? ICONS.danger

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4">
        <div className="p-6 flex flex-col items-center text-center gap-4">

          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-xl`}>
            <span className={color}>{icon}</span>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">{title}</h2>
            {message && <p className="text-sm text-gray-500">{message}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              fullWidth
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'success' ? 'success' : 'danger'}
              onClick={onConfirm}
              loading={loading}
              fullWidth
            >
              {confirmLabel}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
