import { useEffect } from 'react'
import { Modal, Confetti, PlayerDot } from './ui.jsx'
import { useApp } from '../context/AppContext.jsx'

// Celebratory end-of-game announcement.
// winners: array of player objects (supports ties). details: optional JSX block.
export default function WinnerModal({ open, winners = [], subtitle, details, onClose, onHome }) {
  const { play } = useApp()

  useEffect(() => {
    if (open) play('win')
  }, [open, play])

  if (!open) return null
  const isTie = winners.length > 1

  return (
    <Modal open={open} onClose={onClose} closeOnBackdrop={false}>
      <Confetti />
      <div className="card-felt relative overflow-hidden p-8 text-center shadow-card-lg">
        <div className="pointer-events-none absolute inset-0 animate-pulse-glow rounded-2xl" />
        <p className="label-caps animate-fade-in">{isTie ? 'It’s a tie!' : 'Winner'}</p>

        <div className="my-5 flex flex-col items-center gap-3">
          <div className="text-5xl animate-pop-in">{isTie ? '🤝' : '👑'}</div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {winners.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-2 font-display text-4xl font-extrabold text-gradient-gold animate-slide-up"
              >
                <PlayerDot color={w.color} size={16} />
                {w.name}
              </span>
            ))}
          </div>
          {subtitle && <p className="text-ivory-dim animate-fade-in">{subtitle}</p>}
        </div>

        {details && <div className="mt-4 animate-fade-in">{details}</div>}

        <div className="mt-7 flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            View Scorecard
          </button>
          <button className="btn-gold flex-1" onClick={onHome}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}
