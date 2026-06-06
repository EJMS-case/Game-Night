import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { ConfirmModal, PlayerDot } from '../components/ui.jsx'
import WinnerModal from '../components/WinnerModal.jsx'
import { GAME_META, GAME_TYPES, getScorecardDef, FULL_BOARD_COLUMNS, UPPER_BONUS_THRESHOLD } from '../lib/constants.js'
import { scoreCard, num } from '../lib/yahtzeeScoring.js'

const def = getScorecardDef(GAME_TYPES.YAHTZEE)

// Determine the winner of a single column (unique highest grand total > 0).
function columnWinner(grands) {
  const entries = Object.entries(grands)
  const top = Math.max(...entries.map(([, g]) => g))
  if (top <= 0) return null
  const leaders = entries.filter(([, g]) => g === top)
  return leaders.length === 1 ? leaders[0][0] : null
}

export default function FullBoardYahtzee() {
  const { activeGame, getPlayer, updateActiveGame, addGame, clearActiveGame, play } = useApp()
  const navigate = useNavigate()
  const meta = GAME_META[GAME_TYPES.FULL_BOARD]
  const players = activeGame.playerIds.map(getPlayer).filter(Boolean)
  const { columns, bonusYahtzee, activeColumn = 0, log = [] } = activeGame.state

  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [flash, setFlash] = useState(null)

  // grands[col][pid]
  const grands = useMemo(() => {
    return columns.map((col, ci) => {
      const g = {}
      for (const p of players) g[p.id] = scoreCard(col[p.id], def, bonusYahtzee[ci][p.id] || 0).grand
      return g
    })
  }, [columns, bonusYahtzee, players])

  const colWinners = useMemo(() => grands.map((g) => columnWinner(g)), [grands])

  const columnsWon = useMemo(() => {
    const c = Object.fromEntries(players.map((p) => [p.id, 0]))
    for (const w of colWinners) if (w) c[w] += 1
    return c
  }, [colWinners, players])

  const totals = useMemo(() => {
    const t = Object.fromEntries(players.map((p) => [p.id, 0]))
    for (const g of grands) for (const p of players) t[p.id] += g[p.id]
    return t
  }, [grands, players])

  const currentLeader = useMemo(() => {
    let best = null
    let bestWon = -1
    for (const p of players) {
      if (columnsWon[p.id] > bestWon) {
        bestWon = columnsWon[p.id]
        best = p.id
      }
    }
    const tied = players.filter((p) => columnsWon[p.id] === bestWon).length > 1
    return bestWon > 0 ? { id: best, won: bestWon, tied } : null
  }, [players, columnsWon])

  // --- mutations ---
  const setCell = (ci, pid, cat, value) => {
    updateActiveGame((st) => {
      const cols = st.columns.map((c, i) =>
        i === ci ? { ...c, [pid]: { ...c[pid], [cat]: value } } : c,
      )
      return {
        ...st,
        columns: cols,
        log: [...(st.log || []), { kind: 'score', ci, pid, cat, prev: st.columns[ci][pid][cat] }],
      }
    })
    setFlash(`${ci}:${pid}:${cat}`)
    setTimeout(() => setFlash(null), 700)
    play('score')
  }

  const bumpBonus = (ci, pid, delta) => {
    updateActiveGame((st) => {
      const by = st.bonusYahtzee.map((b, i) =>
        i === ci ? { ...b, [pid]: Math.max(0, (b[pid] || 0) + delta) } : b,
      )
      return {
        ...st,
        bonusYahtzee: by,
        log: [...(st.log || []), { kind: 'bonus', ci, pid, prev: st.bonusYahtzee[ci][pid] || 0 }],
      }
    })
    play(delta > 0 ? 'score' : 'undo')
  }

  const setActiveColumn = (ci) => updateActiveGame((st) => ({ ...st, activeColumn: ci }))

  const undo = () => {
    if (!log.length) return
    updateActiveGame((st) => {
      const e = st.log[st.log.length - 1]
      const next = { ...st, log: st.log.slice(0, -1) }
      if (e.kind === 'score') {
        next.columns = st.columns.map((c, i) =>
          i === e.ci ? { ...c, [e.pid]: { ...c[e.pid], [e.cat]: e.prev } } : c,
        )
        next.activeColumn = e.ci
      } else if (e.kind === 'bonus') {
        next.bonusYahtzee = st.bonusYahtzee.map((b, i) =>
          i === e.ci ? { ...b, [e.pid]: e.prev } : b,
        )
        next.activeColumn = e.ci
      }
      return next
    })
    play('undo')
  }

  const colComplete = (ci) => players.every((p) => def.all.every((c) => columns[ci][p.id][c.key] !== ''))
  const completedCount = useMemo(
    () => columns.reduce((acc, _, ci) => acc + (colComplete(ci) ? 1 : 0), 0),
    [columns], // eslint-disable-line
  )

  const finalize = () => {
    const won = columnsWon
    const maxWon = Math.max(...players.map((p) => won[p.id]))
    let contenders = players.filter((p) => won[p.id] === maxWon)
    // tie-break on total points
    if (contenders.length > 1) {
      const topTotal = Math.max(...contenders.map((p) => totals[p.id]))
      contenders = contenders.filter((p) => totals[p.id] === topTotal)
    }
    const winners = contenders.map((p) => p.id)
    const sweepPlayer = players.find((p) => won[p.id] === FULL_BOARD_COLUMNS)?.id || null
    const columnScores = Object.fromEntries(
      players.map((p) => [p.id, grands.map((g) => g[p.id])]),
    )
    return {
      type: GAME_TYPES.FULL_BOARD,
      players: players.map((p) => p.id),
      scores: { ...totals },
      winner: winners.length === 1 ? winners[0] : winners,
      metadata: {
        columnWinners: colWinners,
        columnsWon: { ...won },
        columnScores,
        isSweep: !!sweepPlayer,
        sweepPlayer,
        cards: columns,
        bonusYahtzee,
      },
    }
  }

  const record = useMemo(() => (showWinner ? finalize() : null), [showWinner]) // eslint-disable-line
  const winnerPlayers = record
    ? (Array.isArray(record.winner) ? record.winner : [record.winner]).map(getPlayer)
    : []

  const saveAndHome = () => {
    addGame(record)
    navigate('/')
  }
  const quit = () => {
    clearActiveGame()
    navigate('/')
  }

  const ci = activeColumn

  const Cell = ({ p, cat }) => {
    const value = columns[ci][p.id][cat.key]
    const isFlash = flash === `${ci}:${p.id}:${cat.key}`
    return (
      <td className={`p-1 ${isFlash ? 'animate-score-flash rounded-lg' : ''}`}>
        {cat.fixed ? (
          <div className="flex gap-1">
            <button
              onClick={() => setCell(ci, p.id, cat.key, num(value) === cat.fixed ? '' : cat.fixed)}
              className={`flex-1 rounded-md py-1.5 text-sm font-bold ${
                num(value) === cat.fixed ? 'bg-gold text-charcoal' : 'border border-gold/25 bg-charcoal/50 text-ivory'
              }`}
            >
              {cat.fixed}
            </button>
            <button
              onClick={() => setCell(ci, p.id, cat.key, value === 0 || value === '0' ? '' : 0)}
              className={`w-8 rounded-md py-1.5 text-sm font-bold ${
                value === 0 || value === '0' ? 'bg-burgundy text-ivory' : 'border border-gold/15 bg-charcoal/40 text-ivory-dim'
              }`}
            >
              ✗
            </button>
          </div>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setCell(ci, p.id, cat.key, e.target.value)}
            placeholder="–"
            className="w-full rounded-md border border-gold/20 bg-charcoal/60 px-1.5 py-1.5 text-center text-base font-semibold text-ivory placeholder:text-ivory-dim/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
        )}
      </td>
    )
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="label-caps">{completedCount} / {FULL_BOARD_COLUMNS} columns done</p>
          <h1 className="heading text-2xl">{meta.label}</h1>
        </div>
        <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setConfirmQuit(true)}>
          Quit
        </button>
      </header>

      {/* Running winner */}
      <div className="card mb-4 flex items-center justify-between px-4 py-3">
        <span className="label-caps">Leading columns</span>
        {currentLeader ? (
          <span className="flex items-center gap-2 font-display text-lg font-bold">
            <PlayerDot color={getPlayer(currentLeader.id).color} size={12} />
            {currentLeader.tied ? 'Tied' : getPlayer(currentLeader.id).name}
            <span className="text-gradient-gold">{currentLeader.won} cols</span>
          </span>
        ) : (
          <span className="text-ivory-dim">No columns decided yet</span>
        )}
      </div>

      {/* Column tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {columns.map((_, idx) => {
          const done = colComplete(idx)
          const w = colWinners[idx]
          return (
            <button
              key={idx}
              onClick={() => setActiveColumn(idx)}
              className={`relative flex min-w-[58px] flex-col items-center rounded-xl border px-3 py-2 transition-all ${
                idx === ci ? 'border-gold bg-gold/10 shadow-gold-glow' : 'border-gold/15 bg-charcoal/40'
              }`}
            >
              <span className="text-xs font-semibold text-ivory-dim">Col</span>
              <span className="font-display text-xl font-bold text-ivory">{idx + 1}</span>
              {w ? (
                <PlayerDot color={getPlayer(w).color} size={8} className="mt-0.5" />
              ) : (
                <span className={`mt-0.5 h-2 w-2 rounded-full ${done ? 'bg-ivory-dim/40' : 'bg-transparent'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Active column scorecard */}
      <div className="card overflow-x-auto p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-charcoal-card px-2 py-2 text-left">
                <span className="label-caps">Column {ci + 1}</span>
              </th>
              {players.map((p) => (
                <th key={p.id} className="min-w-[88px] px-1 py-2 text-center">
                  <span className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                    <PlayerDot color={p.color} /> <span className="truncate">{p.name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {def.upper.map((cat) => (
              <tr key={cat.key} className="border-t border-gold/5">
                <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-1 text-left text-sm font-medium text-ivory backdrop-blur">
                  {cat.label}
                </th>
                {players.map((p) => (
                  <Cell key={p.id} p={p} cat={cat} />
                ))}
              </tr>
            ))}
            <tr className="bg-gold/5">
              <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-1.5 text-left text-xs font-semibold text-ivory-dim backdrop-blur">
                Bonus (≥{UPPER_BONUS_THRESHOLD})
              </th>
              {players.map((p) => (
                <td key={p.id} className="px-2 py-1.5 text-center text-sm font-bold">
                  {scoreCard(columns[ci][p.id], def, bonusYahtzee[ci][p.id] || 0).upperBonus ? '+35' : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-10 bg-charcoal-card px-2 pb-1 pt-3 text-left">
                <span className="label-caps">Lower</span>
              </th>
              {players.map((p) => <td key={p.id} />)}
            </tr>
            {def.lower.map((cat) => (
              <tr key={cat.key} className="border-t border-gold/5">
                <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-1 text-left text-sm font-medium text-ivory backdrop-blur">
                  {cat.label}
                </th>
                {players.map((p) => (
                  <Cell key={p.id} p={p} cat={cat} />
                ))}
              </tr>
            ))}
            {/* Bonus Yahtzee stepper row */}
            <tr className="border-t border-gold/10">
              <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-1.5 text-left text-xs font-semibold text-ivory-dim backdrop-blur">
                Bonus Yahtzees
              </th>
              {players.map((p) => (
                <td key={p.id} className="px-1 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <button className="h-6 w-6 rounded-md border border-gold/30 hover:bg-gold/10" onClick={() => bumpBonus(ci, p.id, -1)}>−</button>
                    <span className="w-4 text-center font-bold text-gold">{bonusYahtzee[ci][p.id] || 0}</span>
                    <button className="h-6 w-6 rounded-md border border-gold/30 hover:bg-gold/10" onClick={() => bumpBonus(ci, p.id, 1)}>+</button>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="bg-gold/10">
              <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-2 text-left text-sm font-bold text-ivory backdrop-blur">
                Column Total
              </th>
              {players.map((p) => {
                const g = grands[ci][p.id]
                const win = colWinners[ci] === p.id
                return (
                  <td key={p.id} className={`px-2 py-2 text-center font-display text-lg font-extrabold ${win ? 'text-gradient-gold' : 'text-ivory'}`}>
                    {g}
                    {win && <span className="ml-0.5 text-xs">👑</span>}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Column summary */}
      <div className="card mt-4 overflow-x-auto p-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left"><span className="label-caps">Summary</span></th>
              {players.map((p) => (
                <th key={p.id} className="px-2 py-2 text-center">
                  <PlayerDot color={p.color} /> {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grands.map((g, idx) => (
              <tr key={idx} className="border-t border-gold/5">
                <th className="px-2 py-1.5 text-left font-medium text-ivory-dim">Col {idx + 1}</th>
                {players.map((p) => (
                  <td key={p.id} className={`px-2 py-1.5 text-center ${colWinners[idx] === p.id ? 'font-bold text-gold' : 'text-ivory'}`}>
                    {g[p.id] || '—'}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-gold/20 bg-gold/5">
              <th className="px-2 py-2 text-left font-bold">Columns Won</th>
              {players.map((p) => (
                <td key={p.id} className="px-2 py-2 text-center font-display text-lg font-extrabold text-gradient-gold">
                  {columnsWon[p.id]}
                </td>
              ))}
            </tr>
            <tr>
              <th className="px-2 py-1.5 text-left text-ivory-dim">Grand Total</th>
              {players.map((p) => (
                <td key={p.id} className="px-2 py-1.5 text-center font-semibold">{totals[p.id]}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-20 mt-4 flex gap-3">
        <button className="btn-ghost flex-1" onClick={undo} disabled={!log.length}>↶ Undo</button>
        <button className="btn-gold flex-[2]" onClick={() => setConfirmEnd(true)}>End Game</button>
      </div>

      <ConfirmModal
        open={confirmEnd}
        title="End the Full Board?"
        message="We’ll decide each column, total the columns won, and check for a sweep."
        confirmLabel="Tally & Finish"
        onConfirm={() => { setConfirmEnd(false); setShowWinner(true) }}
        onCancel={() => setConfirmEnd(false)}
      />
      <ConfirmModal
        open={confirmQuit}
        title="Quit without saving?"
        message="This game won’t be added to your history."
        confirmLabel="Discard"
        danger
        onConfirm={quit}
        onCancel={() => setConfirmQuit(false)}
      />

      <WinnerModal
        open={showWinner}
        winners={winnerPlayers}
        subtitle={
          record
            ? record.metadata.isSweep
              ? '🏆 FULL BOARD SWEEP — all 7 columns!'
              : `Won ${record.metadata.columnsWon[winnerPlayers[0]?.id]} of ${FULL_BOARD_COLUMNS} columns`
            : ''
        }
        details={
          record && (
            <div className="mx-auto max-w-xs space-y-1 text-sm">
              {players
                .slice()
                .sort((a, b) => record.metadata.columnsWon[b.id] - record.metadata.columnsWon[a.id])
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-charcoal/40 px-3 py-1.5">
                    <span className="flex items-center gap-2"><PlayerDot color={p.color} /> {p.name}</span>
                    <span className="font-bold text-gold">
                      {record.metadata.columnsWon[p.id]} cols · {record.scores[p.id]} pts
                    </span>
                  </div>
                ))}
            </div>
          )
        }
        onClose={() => setShowWinner(false)}
        onHome={saveAndHome}
      />
    </div>
  )
}
