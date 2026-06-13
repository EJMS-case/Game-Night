import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Modal } from './ui.jsx'

const LABELS = {
  local: { text: 'Local only', dot: 'bg-ivory-dim/50' },
  connecting: { text: 'Syncing…', dot: 'bg-gold animate-pulse' },
  live: { text: 'Synced', dot: 'bg-forest-light' },
  error: { text: 'Sync issue', dot: 'bg-burgundy-light' },
}

export function SyncStatusPill({ onClick }) {
  const { connection, cloudEnabled, house } = useApp()
  if (!cloudEnabled) return null
  const l = LABELS[connection] || LABELS.local
  return (
    <button onClick={onClick} className="stat-chip no-tap-highlight" title={house ? `House: ${house}` : 'Set up sync'}>
      <span className={`h-2 w-2 rounded-full ${l.dot}`} />
      <span className="text-xs">{l.text}</span>
    </button>
  )
}

// Join/create-a-house form. Used both inline (settings) and in the modal.
export function JoinHouseForm({ onDone }) {
  const { setHouse } = useApp()
  const [code, setCode] = useState('')
  const submit = () => {
    const c = code.trim()
    if (!c) return
    setHouse(c)
    onDone?.()
  }
  return (
    <div className="flex gap-2">
      <input
        className="input-field"
        placeholder="Enter a house code…"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        autoFocus
      />
      <button className="btn-gold shrink-0" onClick={submit} disabled={!code.trim()}>
        Connect
      </button>
    </div>
  )
}

// Full management card for the Settings page.
export function SyncManager() {
  const { cloudEnabled, connection, house, leaveHouse } = useApp()
  if (!cloudEnabled) return null
  const l = LABELS[connection] || LABELS.local

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold">Shared sync</p>
        <span className="stat-chip">
          <span className={`h-2 w-2 rounded-full ${l.dot}`} />
          <span className="text-xs">{l.text}</span>
        </span>
      </div>

      {house ? (
        <>
          <p className="text-sm text-ivory-dim">
            Connected to house <span className="font-semibold text-gold">“{house}”</span>. Anyone who
            enters the same code on their device shares this game history live.
          </p>
          <button className="btn-ghost mt-3 w-full" onClick={leaveHouse}>
            Disconnect (keep data on this device)
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-ivory-dim">
            Pick a secret house code and enter it on every device that should share data. Enter an
            existing code to join that history; a brand-new code starts fresh from this device’s data.
          </p>
          <JoinHouseForm />
        </>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-ivory-dim/70">
        The code namespaces your data and is the only gate, so treat it like a password. It’s
        light protection, not strong security.
      </p>
    </div>
  )
}

// Dismissible prompt shown on Home when sync is available but not set up.
export function SyncBanner() {
  const { cloudEnabled, house } = useApp()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('gn-sync-dismissed') === '1')

  if (!cloudEnabled || house || dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem('gn-sync-dismissed', '1')
    setDismissed(true)
  }

  return (
    <>
      <div className="card-felt mb-5 flex items-center gap-3 p-4">
        <span className="text-2xl">🔗</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold">Play together, everywhere</p>
          <p className="text-sm text-ivory-dim">Set a house code to sync stats across phones & tablets.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button className="btn-gold px-3 py-1.5 text-sm" onClick={() => setOpen(true)}>
            Set up
          </button>
          <button className="text-[11px] text-ivory-dim/70 hover:text-ivory" onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="card p-6">
          <h3 className="heading text-2xl">Set up shared sync</h3>
          <p className="mt-2 text-sm text-ivory-dim">
            Choose a secret house code. Enter the same code on Elyce’s and Mike’s devices to share one
            live game history. Your current games on this device will seed a brand-new code.
          </p>
          <div className="mt-4">
            <JoinHouseForm onDone={() => setOpen(false)} />
          </div>
          <p className="mt-3 text-[11px] text-ivory-dim/70">
            The code is the only gate — light protection, not strong security.
          </p>
        </div>
      </Modal>
    </>
  )
}
