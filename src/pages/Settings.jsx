import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { PlayerDot, SectionTitle, ConfirmModal } from '../components/ui.jsx'
import { MAX_PLAYERS, PLAYER_COLORS } from '../lib/constants.js'
import { SyncManager } from '../components/Sync.jsx'

export default function Settings() {
  const { players, settings, updateSettings, addPlayer, updatePlayer, removePlayer, resetStats, resetAll, play } = useApp()
  const [newName, setNewName] = useState('')
  const [confirm, setConfirm] = useState(null) // 'stats' | 'all' | {removeId}

  const handleAdd = () => {
    const n = newName.trim()
    if (!n) return
    addPlayer(n)
    setNewName('')
  }

  return (
    <div className="animate-fade-in">
      <PageHeader subtitle="Make it yours" title="Settings" />

      {/* Players */}
      <section>
        <SectionTitle>Players</SectionTitle>
        <div className="card divide-y divide-gold/10 p-2">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-2">
              <label className="relative shrink-0 cursor-pointer" title="Change color">
                <PlayerDot color={p.color} size={20} />
                <select
                  value={p.color}
                  onChange={(e) => updatePlayer(p.id, { color: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                >
                  {PLAYER_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <input
                className="input-field flex-1"
                value={p.name}
                onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
              />
              <button
                className="btn-ghost shrink-0 px-3 py-2 text-sm disabled:opacity-30"
                onClick={() => setConfirm({ removeId: p.id, name: p.name })}
                disabled={players.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {players.length < MAX_PLAYERS ? (
          <div className="mt-3 flex gap-2">
            <input
              className="input-field"
              placeholder="Add a player…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn-gold shrink-0" onClick={handleAdd}>Add</button>
          </div>
        ) : (
          <p className="mt-2 text-center text-xs text-ivory-dim">Maximum of {MAX_PLAYERS} players.</p>
        )}
      </section>

      {/* Shared sync */}
      <section className="mt-7">
        <SectionTitle>Sync</SectionTitle>
        <SyncManager />
      </section>

      {/* Preferences */}
      <section className="mt-7">
        <SectionTitle>Preferences</SectionTitle>
        <div className="card flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Sound effects</p>
            <p className="text-sm text-ivory-dim">Score chimes, winner fanfare & more.</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.soundEnabled}
            onClick={() => {
              const next = !settings.soundEnabled
              updateSettings({ soundEnabled: next })
              if (next) play('score')
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${settings.soundEnabled ? 'bg-gold' : 'bg-charcoal ring-1 ring-black/10'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.soundEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-7">
        <SectionTitle>Data</SectionTitle>
        <div className="card space-y-3 p-4">
          <button className="btn-ghost w-full" onClick={() => setConfirm('stats')}>
            Reset all stats & history
          </button>
          <button className="btn-burgundy w-full" onClick={() => setConfirm('all')}>
            Reset everything (players too)
          </button>
          <p className="text-center text-xs text-ivory-dim">
            All data lives only in this browser’s local storage.
          </p>
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-ivory-dim/60">Game Night · made for table-side play</p>

      <ConfirmModal
        open={confirm === 'stats'}
        title="Reset all stats?"
        message="Every saved game and historical entry will be deleted. Players stay. This can’t be undone."
        confirmLabel="Reset stats"
        danger
        onConfirm={() => { resetStats(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'all'}
        title="Reset everything?"
        message="Players reset to Elyce & Mike and all history is wiped. This can’t be undone."
        confirmLabel="Reset all"
        danger
        onConfirm={() => { resetAll(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={!!(confirm && confirm.removeId)}
        title={`Remove ${confirm?.name}?`}
        message="Their past games stay in history, but they’ll be removed from the roster."
        confirmLabel="Remove"
        danger
        onConfirm={() => { removePlayer(confirm.removeId); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
