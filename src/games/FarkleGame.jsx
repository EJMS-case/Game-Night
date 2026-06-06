import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { ConfirmModal, PlayerDot, Modal } from '../components/ui.jsx'
import WinnerModal from '../components/WinnerModal.jsx'
import { GAME_META, GAME_TYPES, FARKLE_TARGET, FARKLE_MIN_ON_BOARD, FARKLE_RULES } from '../lib/constants.js'

const meta = GAME_META[GAME_TYPES.FARKLE]

export default function FarkleGame() {
  const { activeGame, getPlayer, updateActiveGame, addGame, clearActiveGame, play } = useApp()
  const navigate = useNavigate()
  const players = activeGame.playerIds.map(getPlayer).filter(Boolean)
  const { totals, onBoard, turns, currentPlayer = 0 } = activeGame.state

  const [entry, setEntry] = useState('')
  const [hotDice, setHotDice] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [note, setNote] = useState('')

  const cur = players[currentPlayer % players.length]

  const leaderId = useMemo(() => {
    let best = null
    let bestScore = -1
    for (const p of players) {
      if (totals[p.id] > bestScore) {
        bestScore = totals[p.id]
        best = p.id
      }
    }
    return bestScore > 0 ? best : null
  }, [players, totals])

  const advance = (st) => ({ ...st, currentPlayer: (st.currentPlayer + 1) % players.length })

  const recordTurn = ({ points, busted }) => {
    const pid = cur.id
    const willBeOnBoard = onBoard[pid] || points >= FARKLE_MIN_ON_BOARD
    // If not on board yet and under the threshold, the turn scores nothing.
    const counts = !busted && willBeOnBoard
    const added = counts ? points : 0

    updateActiveGame((st) => {
      const next = {
        ...st,
        totals: { ...st.totals, [pid]: (st.totals[pid] || 0) + added },
        onBoard: { ...st.onBoard, [pid]: st.onBoard[pid] || counts },
        turns: [
          ...st.turns,
          {
            pid,
            points: added,
            attempted: points,
            busted,
            hotDice,
            prevOnBoard: st.onBoard[pid] || false,
            prevPlayer: st.currentPlayer,
          },
        ],
      }
      return advance(next)
    })

    if (busted) {
      play('bust')
    } else if (!willBeOnBoard) {
      play('undo')
      setNote(`${cur.name} needs ${FARKLE_MIN_ON_BOARD}+ in one turn to get on the board.`)
      setTimeout(() => setNote(''), 2600)
    } else {
      play('score')
    }

    // win check (against the new total)
    const newTotal = (totals[pid] || 0) + added
    if (counts && newTotal >= FARKLE_TARGET) {
      setTimeout(() => setShowWinner(true), 250)
    }

    setEntry('')
    setHotDice(false)
  }

  const bank = () => {
    const points = parseInt(entry, 10)
    if (!Number.isFinite(points) || points <= 0) return
    recordTurn({ points, busted: false })
  }

  const bust = () => recordTurn({ points: 0, busted: true })

  const undo = () => {
    if (!turns.length) return
    updateActiveGame((st) => {
      const t = st.turns[st.turns.length - 1]
      return {
        ...st,
        totals: { ...st.totals, [t.pid]: (st.totals[t.pid] || 0) - t.points },
        onBoard: { ...st.onBoard, [t.pid]: t.prevOnBoard },
        turns: st.turns.slice(0, -1),
        currentPlayer: t.prevPlayer,
      }
    })
    play('undo')
    setEntry('')
    setHotDice(false)
  }

  const finalize = () => {
    const top = Math.max(...players.map((p) => totals[p.id]))
    const winners = players.filter((p) => totals[p.id] === top).map((p) => p.id)
    return {
      type: GAME_TYPES.FARKLE,
      players: players.map((p) => p.id),
      scores: { ...totals },
      winner: winners.length === 1 ? winners[0] : winners,
      metadata: { target: FARKLE_TARGET, turns },
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

  const recentTurns = turns.slice(-6).reverse()

  return (
    <div className="animate-fade-in">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="label-caps">First to {FARKLE_TARGET.toLocaleString()}</p>
          <h1 className="heading text-2xl">{meta.label}</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setShowRules(true)}>
            Rules
          </button>
          <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setConfirmQuit(true)}>
            Quit
          </button>
        </div>
      </header>

      {/* Running winner */}
      <div className="card mb-4 flex items-center justify-between px-4 py-3">
        <span className="label-caps">Leading now</span>
        {leaderId ? (
          <span className="flex items-center gap-2 font-display text-lg font-bold">
            <PlayerDot color={getPlayer(leaderId).color} size={12} />
            {getPlayer(leaderId).name}
            <span className="text-gradient-gold">{totals[leaderId].toLocaleString()}</span>
          </span>
        ) : (
          <span className="text-ivory-dim">Tip off!</span>
        )}
      </div>

      {/* Player totals */}
      <div className="grid grid-cols-2 gap-3">
        {players.map((p, idx) => {
          const isTurn = idx === currentPlayer % players.length
          const pct = Math.min(100, (totals[p.id] / FARKLE_TARGET) * 100)
          return (
            <div
              key={p.id}
              className={`card relative overflow-hidden p-4 ${isTurn ? 'border-gold shadow-gold-glow' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <PlayerDot color={p.color} size={12} /> {p.name}
                </span>
                {isTurn && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-charcoal">Turn</span>}
              </div>
              <p className="mt-1 font-display text-4xl font-extrabold text-gradient-gold">
                {totals[p.id].toLocaleString()}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/60">
                <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ivory-dim">
                {onBoard[p.id] ? 'On the board' : `Off board · need ${FARKLE_MIN_ON_BOARD}+`}
              </p>
            </div>
          )
        })}
      </div>

      {/* Turn entry */}
      <div className="card-felt mt-4 p-4">
        <p className="label-caps mb-2 flex items-center gap-2">
          <PlayerDot color={cur.color} /> {cur.name}’s turn
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && bank()}
            placeholder="Points this turn…"
            className="input-field text-lg"
            autoFocus
          />
          <button
            onClick={() => setHotDice((h) => !h)}
            className={`btn shrink-0 px-3 ${hotDice ? 'bg-gold text-charcoal animate-pulse-glow' : 'border border-gold/30 text-ivory'}`}
            title="Hot dice — scored on all 6 dice"
          >
            🔥 Hot
          </button>
        </div>
        <div className="mt-3 flex gap-3">
          <button className="btn-burgundy flex-1" onClick={bust}>
            Farkle / Bust
          </button>
          <button className="btn-gold flex-[2]" onClick={bank} disabled={!entry || parseInt(entry, 10) <= 0}>
            Bank Points
          </button>
        </div>
        {note && <p className="mt-2 animate-fade-in text-center text-sm text-gold">{note}</p>}
      </div>

      {/* Turn log */}
      {recentTurns.length > 0 && (
        <div className="card mt-4 p-3">
          <p className="label-caps mb-2">Recent turns</p>
          <ul className="space-y-1 text-sm">
            {recentTurns.map((t, i) => {
              const p = getPlayer(t.pid)
              return (
                <li key={turns.length - i} className="flex items-center justify-between rounded-lg bg-charcoal/40 px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    <PlayerDot color={p?.color} /> {p?.name}
                    {t.hotDice && <span title="Hot dice">🔥</span>}
                  </span>
                  <span className={t.busted ? 'font-semibold text-burgundy-light' : t.points === 0 ? 'text-ivory-dim' : 'font-semibold text-gold'}>
                    {t.busted ? 'Farkle — 0' : t.points === 0 ? `${t.attempted} (off board)` : `+${t.points.toLocaleString()}`}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="sticky bottom-20 mt-4 flex gap-3">
        <button className="btn-ghost flex-1" onClick={undo} disabled={!turns.length}>↶ Undo</button>
        <button className="btn-gold flex-[2]" onClick={() => setConfirmEnd(true)}>End Game</button>
      </div>

      {/* Rules modal */}
      <Modal open={showRules} onClose={() => setShowRules(false)}>
        <div className="card max-h-[80vh] overflow-y-auto p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="heading text-2xl">Farkle Rules</h3>
            <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setShowRules(false)}>Close</button>
          </div>
          <FarkleRulesContent />
        </div>
      </Modal>

      <ConfirmModal
        open={confirmEnd}
        title="End the game?"
        message="We’ll crown whoever has the highest total."
        confirmLabel="Finish"
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
        subtitle={record ? `${record.scores[winnerPlayers[0]?.id]?.toLocaleString()} points` : ''}
        details={
          record && (
            <div className="mx-auto max-w-xs space-y-1 text-sm">
              {players
                .slice()
                .sort((a, b) => record.scores[b.id] - record.scores[a.id])
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-charcoal/40 px-3 py-1.5">
                    <span className="flex items-center gap-2"><PlayerDot color={p.color} /> {p.name}</span>
                    <span className="font-bold text-gold">{record.scores[p.id].toLocaleString()}</span>
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

export function FarkleRulesContent() {
  return (
    <div className="space-y-4">
      <div>
        <p className="label-caps mb-2">Scoring</p>
        <div className="overflow-hidden rounded-xl border border-gold/15">
          <table className="w-full text-sm">
            <tbody>
              {FARKLE_RULES.scoring.map((row, i) => (
                <tr key={row.combo} className={i % 2 ? 'bg-charcoal/30' : ''}>
                  <td className="px-3 py-1.5 text-ivory">{row.combo}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-gold">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-2">
        {FARKLE_RULES.notes.map((n) => (
          <div key={n.title} className="rounded-xl border border-gold/15 bg-charcoal/30 p-3">
            <p className="font-semibold text-gold">{n.title}</p>
            <p className="text-sm text-ivory-dim">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
