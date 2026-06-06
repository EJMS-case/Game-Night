import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { PlayerDot, SectionTitle, EmptyState } from '../components/ui.jsx'
import { GAME_TYPES, GAME_META } from '../lib/constants.js'
import { headToHead } from '../lib/stats.js'
import { initialGameState } from '../lib/gameInit.js'
import { fmtDate } from '../lib/format.js'

const STAT_TYPES = [GAME_TYPES.YAHTZEE, GAME_TYPES.YAHTZEE_WORDS, GAME_TYPES.FARKLE, GAME_TYPES.FULL_BOARD]

export default function Home() {
  const { players, games, stats, getPlayer, startGame } = useApp()
  const navigate = useNavigate()

  const lastGame = stats.recent[0]

  const samePlayers = () => {
    if (!lastGame) return
    const ids = lastGame.players.filter((id) => getPlayer(id))
    if (!ids.length) return
    startGame(lastGame.type, ids, initialGameState(lastGame.type, ids))
    navigate('/game')
  }

  // pairwise combinations of players
  const pairs = []
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++) pairs.push([players[i], players[j]])

  return (
    <div className="animate-fade-in">
      <PageHeader subtitle="Welcome back" title={<span className="text-gradient-gold">Game Night</span>} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {STAT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => navigate(`/new/${t}`)}
            className="card flex items-center gap-3 p-4 text-left transition-transform active:scale-[0.98] hover:border-gold/50"
          >
            <span className="text-2xl">{GAME_META[t].icon}</span>
            <span>
              <span className="block text-[10px] uppercase tracking-wider text-gold/80">New</span>
              <span className="font-display text-lg font-bold leading-tight">{GAME_META[t].label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="btn-forest" onClick={samePlayers} disabled={!lastGame}>
          ↻ Same players
        </button>
        <button className="btn-ghost" onClick={() => navigate('/historical')}>
          ＋ Historical data
        </button>
      </div>

      {games.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🎲"
            title="No games yet"
            hint="Start a game above, or use “Historical data” to backfill past results — your stats will light up instantly."
          />
        </div>
      ) : (
        <>
          {/* Streaks */}
          <section className="mt-7">
            <SectionTitle>Current Streaks</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const s = stats.streaks[p.id] || 0
                return (
                  <div key={p.id} className={`stat-chip ${s >= 3 ? 'border-gold/60 shadow-gold-glow' : ''}`}>
                    <PlayerDot color={p.color} />
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-ivory-dim">·</span>
                    <span className={s > 0 ? 'font-bold text-gold' : 'text-ivory-dim'}>
                      {s > 0 ? `${s}W${s >= 3 ? ' 🔥' : ''}` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Head to head */}
          <section className="mt-7">
            <SectionTitle>Head to Head</SectionTitle>
            <div className="space-y-3">
              {STAT_TYPES.map((t) => {
                const typeGames = stats.byType[t].games
                if (!typeGames) return null
                return (
                  <div key={t} className="card p-4">
                    <p className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
                      <span>{GAME_META[t].icon}</span> {GAME_META[t].label}
                    </p>
                    <div className="space-y-1.5">
                      {pairs.map(([a, b]) => {
                        const h = headToHead(stats, t, a.id, b.id)
                        if (h.a === 0 && h.b === 0) return null
                        const leader = h.a === h.b ? null : h.a > h.b ? a : b
                        return (
                          <p key={a.id + b.id} className="text-sm">
                            {leader ? (
                              <>
                                <span className="font-semibold" style={{ color: leader.color }}>
                                  {leader.name}
                                </span>{' '}
                                leads {leader.id === a.id ? b.name : a.name}{' '}
                                <span className="font-bold text-gold">
                                  {Math.max(h.a, h.b)}–{Math.min(h.a, h.b)}
                                </span>
                              </>
                            ) : (
                              <>
                                {a.name} & {b.name} tied{' '}
                                <span className="font-bold text-gold">{h.a}–{h.b}</span>
                              </>
                            )}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Win counts */}
          <section className="mt-7">
            <SectionTitle>All-Time Wins</SectionTitle>
            <div className="card overflow-x-auto p-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left"><span className="label-caps">Player</span></th>
                    {STAT_TYPES.map((t) => (
                      <th key={t} className="px-2 py-2 text-center text-xs font-semibold text-ivory-dim">
                        {GAME_META[t].short}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center text-xs font-bold text-gold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id} className="border-t border-gold/5">
                      <th className="px-2 py-2 text-left">
                        <span className="flex items-center gap-2 font-semibold">
                          <PlayerDot color={p.color} /> {p.name}
                        </span>
                      </th>
                      {STAT_TYPES.map((t) => (
                        <td key={t} className="px-2 py-2 text-center text-ivory">
                          {stats.byType[t].wins[p.id] || 0}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-display text-lg font-extrabold text-gradient-gold">
                        {stats.totalWins[p.id] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Full board sweeps */}
          <section className="mt-7">
            <SectionTitle>Full Board Sweeps 🏆</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <div key={p.id} className="stat-chip">
                  <PlayerDot color={p.color} />
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-ivory-dim">· wins</span>
                  <span className="font-bold text-gold">{stats.fullBoard.wins[p.id] || 0}</span>
                  <span className="text-ivory-dim">· sweeps</span>
                  <span className="font-bold text-gold">{stats.fullBoard.sweeps[p.id] || 0}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Averages */}
          <section className="mt-7">
            <SectionTitle>Average Score</SectionTitle>
            <div className="card overflow-x-auto p-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left"><span className="label-caps">Player</span></th>
                    {STAT_TYPES.map((t) => (
                      <th key={t} className="px-2 py-2 text-center text-xs font-semibold text-ivory-dim">
                        {GAME_META[t].short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id} className="border-t border-gold/5">
                      <th className="px-2 py-2 text-left">
                        <span className="flex items-center gap-2 font-semibold">
                          <PlayerDot color={p.color} /> {p.name}
                        </span>
                      </th>
                      {STAT_TYPES.map((t) => (
                        <td key={t} className="px-2 py-2 text-center text-ivory">
                          {stats.averages[t][p.id] != null ? stats.averages[t][p.id].toLocaleString() : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent games */}
          <section className="mt-7">
            <SectionTitle action={<button className="text-xs font-semibold text-gold" onClick={() => navigate('/history')}>View all →</button>}>
              Recent Games
            </SectionTitle>
            <div className="space-y-2">
              {stats.recent.map((g) => {
                const winners = (Array.isArray(g.winner) ? g.winner : [g.winner]).map(getPlayer).filter(Boolean)
                return (
                  <div key={g.id} className="card flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <span>{GAME_META[g.type]?.icon}</span>
                        <span className="truncate">{GAME_META[g.type]?.short}</span>
                      </p>
                      <p className="text-xs text-ivory-dim">{fmtDate(g.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1.5 font-semibold">
                        {winners.length ? (
                          <>
                            <PlayerDot color={winners[0].color} />
                            {winners.map((w) => w.name).join(' & ')}
                            {g.metadata?.isSweep && <span title="Full Board Sweep">🏆</span>}
                          </>
                        ) : (
                          '—'
                        )}
                      </p>
                      <p className="text-xs text-ivory-dim">
                        {g.players
                          .map((id) => g.scores?.[id])
                          .filter((s) => s != null)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
