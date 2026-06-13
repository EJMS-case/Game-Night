import { useEffect } from 'react'

// --- Player dot + badge ----------------------------------------------------
export function PlayerDot({ color, size = 10, className = '' }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 6px ${color}66` }}
    />
  )
}

export function PlayerBadge({ player, className = '' }) {
  if (!player) return null
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${className}`}>
      <PlayerDot color={player.color} />
      {player.name}
    </span>
  )
}

// --- Modal shell -----------------------------------------------------------
export function Modal({ open, onClose, children, closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div className="relative z-10 w-full max-w-md animate-pop-in">{children}</div>
    </div>
  )
}

// --- Confirm dialog --------------------------------------------------------
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="card p-6">
        <h3 className="heading text-2xl">{title}</h3>
        {message && <p className="mt-2 text-ivory-dim">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button className="btn-ghost flex-1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`flex-1 ${danger ? 'btn-burgundy' : 'btn-gold'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// --- Confetti (pure CSS, gold/jewel) --------------------------------------
const CONFETTI_COLORS = ['#147A5C', '#7A2E40', '#2563A8', '#7C3AED', '#C2410C']

export function Confetti({ count = 60 }) {
  const pieces = Array.from({ length: count })
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 1.5
        const duration = 2.4 + Math.random() * 1.6
        const size = 6 + Math.random() * 8
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        return (
          <span
            key={i}
            className="absolute top-0 animate-confetti-fall"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              backgroundColor: color,
              borderRadius: 2,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// --- Section header --------------------------------------------------------
export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="label-caps">{children}</h2>
      {action}
    </div>
  )
}

// --- Empty state -----------------------------------------------------------
export function EmptyState({ icon = '🎲', title, hint }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="heading text-lg">{title}</p>
      {hint && <p className="max-w-xs text-sm text-ivory-dim">{hint}</p>}
    </div>
  )
}
