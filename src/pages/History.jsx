import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { PlayerDot, EmptyState, Modal, ConfirmModal } from '../components/ui.jsx'
import { GAME_TYPES, GAME_META } from '../lib/constants.js'
import { sortGamesDesc, asWinners } from '../lib/stats.js'
import { fmtDateTime } from '../lib/format.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: GAME_TYPES.YAHTZEE, label: 'Yahtzee' },
  { key: GAME_TYPES.YAHTZEE_WORDS, label: 'Words' },
  { key: GAME_TYPES.FARKLE, label: 'Farkle' },
  { key: GAME_TYPES.FULL_BOARD, label: 'Full Board' },
]

export default function History() {
  const { games, getPlayer, deleteGame } = useApp()
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const filtered = useMemo(() => {
    const sorted = sortGamesDesc(games)
    return filter === 'all' ? sorted : sorted.filter((g) => g.type === filter)
  }, [games, filter])

  return (
    <div className="animate-fade-in">
      <PageHeader subtitle="The record books" title="History" />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.key ? 'border-gold bg-gold/15 text-gold' : 'border-gold/20 text-ivory-dim hover:text-ivory'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📜" title="No games here yet" hint="Finished games and historical entries land here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => {
            const winners = asWinners(g.winner).map(getPlayer).filter(Boolean)
            return (
              <button
                key={g.id}
                onClick={() => setDetail(g)}
                className="card flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99] hover:border-gold/40"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <span>{GAME_META[g.type]?.icon}</span>
                    <span className="truncate">{GAME_META[g.type]?.label}</span>
                    {g.metadata?.isSweep && <span title="Full Board Sweep">🏆</span>}
                  </p>
                  <p className="text-xs text-ivory-dim">{fmtDateTime(g.date)}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1.5 font-semibold">
                    {winners.length ? (
                      <>
                        <PlayerDot color={winners[0].color} />
                        {winners.map((w) => w.name).join(' & ')}
                      </>
                    ) : '—'}
                  </p>
                  <p className="text-xs text-ivory-dim">
                    {g.players.map((id) => g.scores?.[id]).filter((s) => s != null).join(' · ')}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div className="card max-h-[80vh] overflow-y-auto p-6">
            <div className="mb-1 flex items-center justify-between">
              <p className="label-caps">{fmtDateTime(detail.date)}</p>
              <button className="text-ivory-dim hover:text-ivory" onClick={() => setDetail(null)}>✕</button>
            </div>
            <h3 className="heading flex items-center gap-2 text-2xl">
              <span>{GAME_META[detail.type]?.icon}</span> {GAME_META[detail.type]?.label}
            </h3>

            <div className="mt-4 space-y-2">
              {detail.players
                .slice()
                .sort((a, b) => (detail.scores?.[b] || 0) - (detail.scores?.[a] || 0))
                .map((id) => {
                  const p = getPlayer(id)
                  const isWinner = asWinners(detail.winner).includes(id)
                  return (
                    <div key={id} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${isWinner ? 'bg-gold/10 ring-1 ring-gold/40' : 'bg-charcoal/40'}`}>
                      <span className="flex items-center gap-2 font-semibold">
                        <PlayerDot color={p?.color} /> {p?.name || 'Unknown'}
                        {isWinner && <span>👑</span>}
                      </span>
                      <span className="font-display text-lg font-bold text-gold">
                        {(detail.scores?.[id] ?? 0).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
            </div>

            {/* Full board column breakdown */}
            {detail.type === GAME_TYPES.FULL_BOARD && detail.metadata?.columnWinners && (
              <div className="mt-4">
                <p className="label-caps mb-2">Columns won</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.metadata.columnWinners.map((w, i) => {
                    const p = w ? getPlayer(w) : null
                    return (
                      <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-gold/20 bg-charcoal/40 px-2 py-1 text-xs">
                        <span className="text-ivory-dim">{i + 1}</span>
                        {p ? <><PlayerDot color={p.color} size={8} /> {p.name}</> : <span className="text-ivory-dim">split</span>}
                      </span>
                    )
                  })}
                </div>
                {detail.metadata.isSweep && (
                  <p className="mt-2 text-sm font-semibold text-gold">🏆 Full Board Sweep!</p>
                )}
              </div>
            )}

            {/* Yahtzee counts */}
            {detail.metadata?.yahtzeeCount && (
              <div className="mt-4">
                <p className="label-caps mb-2">Yahtzees</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(detail.metadata.yahtzeeCount).map(([id, n]) => {
                    const p = getPlayer(id)
                    if (!p) return null
                    return (
                      <span key={id} className="stat-chip">
                        <PlayerDot color={p.color} /> {p.name} · {n}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              className="btn-burgundy mt-6 w-full"
              onClick={() => { setToDelete(detail); setDetail(null) }}
            >
              Delete this game
            </button>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        title="Delete this game?"
        message="It will be removed from history and your stats will update."
        confirmLabel="Delete"
        danger
        onConfirm={() => { deleteGame(toDelete.id); setToDelete(null) }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
