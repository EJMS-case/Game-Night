import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { PlayerDot } from '../components/ui.jsx'
import { GAME_META, GAME_TYPES, MAX_PLAYERS } from '../lib/constants.js'
import { initialGameState } from '../lib/gameInit.js'

export default function NewGame() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { players, addPlayer, startGame } = useApp()
  const meta = GAME_META[type]

  const [selected, setSelected] = useState(() => players.map((p) => p.id))
  const [newName, setNewName] = useState('')

  if (!meta) {
    return (
      <div className="card p-6 text-center">
        <p className="heading text-xl">Unknown game type</p>
        <button className="btn-gold mt-4" onClick={() => navigate('/')}>
          Back home
        </button>
      </div>
    )
  }

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addPlayer(name)
    setNewName('')
  }

  const ordered = players
    .filter((p) => selected.includes(p.id))
    // preserve the order the user tapped them in
    .sort((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id))

  const start = () => {
    const ids = ordered.map((p) => p.id)
    if (ids.length < 1) return
    startGame(type, ids, initialGameState(type, ids))
    navigate('/game')
  }

  return (
    <div className="animate-fade-in">
      <PageHeader subtitle="New Game" title={meta.label} />

      <div className="card p-5">
        <p className="label-caps mb-3">Who’s playing?</p>
        <div className="space-y-2">
          {players.map((p) => {
            const on = selected.includes(p.id)
            const order = selected.indexOf(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                  on
                    ? 'border-gold bg-gold/10 shadow-gold-glow'
                    : 'border-gold/15 bg-charcoal/40 opacity-60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <PlayerDot color={p.color} size={14} />
                  <span className="font-semibold">{p.name}</span>
                </span>
                {on && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
                    {order + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {players.length < MAX_PLAYERS && (
          <div className="mt-4 flex gap-2">
            <input
              className="input-field"
              placeholder="Add a player…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn-ghost shrink-0" onClick={handleAdd}>
              Add
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <button className="btn-ghost flex-1" onClick={() => navigate('/')}>
          Cancel
        </button>
        <button className="btn-gold flex-1" onClick={start} disabled={ordered.length < 1}>
          Start {meta.short} →
        </button>
      </div>

      {type === GAME_TYPES.FULL_BOARD && (
        <p className="mt-4 text-center text-sm text-ivory-dim">
          Each player fills all 7 columns. Win 4+ columns to take the game — sweep all 7 for a Full
          Board Sweep. 🏆
        </p>
      )}
    </div>
  )
}
