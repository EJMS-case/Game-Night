import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { ConfirmModal, PlayerDot } from '../components/ui.jsx'
import WinnerModal from '../components/WinnerModal.jsx'
import {
  GAME_META,
  getScorecardDef,
  UPPER_BONUS_THRESHOLD,
} from '../lib/constants.js'
import { scoreCard, yahtzeeTally, num } from '../lib/yahtzeeScoring.js'

export default function YahtzeeGame() {
  const { activeGame, getPlayer, updateActiveGame, addGame, clearActiveGame, play } = useApp()
  const navigate = useNavigate()

  const type = activeGame.type
  const meta = GAME_META[type]
  const def = useMemo(() => getScorecardDef(type), [type])
  const isWords = def.words
  const players = activeGame.playerIds.map(getPlayer).filter(Boolean)
  const { scores, words, bonusYahtzee, log = [] } = activeGame.state

  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [flash, setFlash] = useState(null) // `${pid}:${cat}`

  // --- live results ---
  const results = useMemo(() => {
    const r = {}
    for (const p of players) {
      r[p.id] = scoreCard(scores[p.id], def, bonusYahtzee[p.id] || 0)
    }
    return r
  }, [players, scores, def, bonusYahtzee])

  const leaderId = useMemo(() => {
    let best = null
    let bestScore = -1
    for (const p of players) {
      if (results[p.id].grand > bestScore) {
        bestScore = results[p.id].grand
        best = p.id
      }
    }
    // only a "leader" if someone has scored anything
    return bestScore > 0 ? best : null
  }, [players, results])

  const tiedLead = useMemo(() => {
    if (!leaderId) return false
    const top = results[leaderId].grand
    return players.filter((p) => results[p.id].grand === top).length > 1
  }, [leaderId, players, results])

  // round = the round the slowest player is on (1..13)
  const round = useMemo(() => {
    const counts = players.map((p) => def.all.filter((c) => scores[p.id][c.key] !== '').length)
    const minFilled = counts.length ? Math.min(...counts) : 0
    return Math.min(def.all.length, minFilled + 1)
  }, [players, def, scores])

  const allComplete = useMemo(
    () => players.every((p) => def.all.every((c) => scores[p.id][c.key] !== '')),
    [players, def, scores],
  )

  // --- mutations (each logs the previous value for undo) ---
  const setScore = (pid, cat, value) => {
    updateActiveGame((st) => ({
      ...st,
      scores: { ...st.scores, [pid]: { ...st.scores[pid], [cat]: value } },
      log: [...(st.log || []), { kind: 'score', pid, cat, prev: st.scores[pid][cat] }],
    }))
    setFlash(`${pid}:${cat}`)
    setTimeout(() => setFlash(null), 700)
    play('score')
  }

  const setWord = (pid, cat, value) => {
    updateActiveGame((st) => ({
      ...st,
      words: { ...st.words, [pid]: { ...st.words[pid], [cat]: value } },
    }))
  }

  const bumpBonus = (pid, delta) => {
    updateActiveGame((st) => {
      const next = Math.max(0, (st.bonusYahtzee[pid] || 0) + delta)
      return {
        ...st,
        bonusYahtzee: { ...st.bonusYahtzee, [pid]: next },
        log: [...(st.log || []), { kind: 'bonus', pid, prev: st.bonusYahtzee[pid] || 0 }],
      }
    })
    play(delta > 0 ? 'score' : 'undo')
  }

  const undo = () => {
    if (!log.length) return
    updateActiveGame((st) => {
      const entry = st.log[st.log.length - 1]
      const next = { ...st, log: st.log.slice(0, -1) }
      if (entry.kind === 'score') {
        next.scores = { ...st.scores, [entry.pid]: { ...st.scores[entry.pid], [entry.cat]: entry.prev } }
      } else if (entry.kind === 'bonus') {
        next.bonusYahtzee = { ...st.bonusYahtzee, [entry.pid]: entry.prev }
      }
      return next
    })
    play('undo')
  }

  const finalize = () => {
    const grand = {}
    const yc = {}
    for (const p of players) {
      grand[p.id] = results[p.id].grand
      yc[p.id] = yahtzeeTally(scores[p.id], def, bonusYahtzee[p.id] || 0)
    }
    const top = Math.max(...players.map((p) => grand[p.id]))
    const winners = players.filter((p) => grand[p.id] === top).map((p) => p.id)
    return {
      type,
      players: players.map((p) => p.id),
      scores: grand,
      winner: winners.length === 1 ? winners[0] : winners,
      metadata: { yahtzeeCount: yc, cards: scores, words, bonusYahtzee },
    }
  }

  const record = useMemo(() => (showWinner ? finalize() : null), [showWinner]) // eslint-disable-line

  const winnerPlayers = record
    ? (Array.isArray(record.winner) ? record.winner : [record.winner]).map(getPlayer)
    : []

  const handleEndConfirm = () => {
    setConfirmEnd(false)
    setShowWinner(true)
  }

  const saveAndHome = () => {
    addGame(record)
    navigate('/')
  }

  const quit = () => {
    clearActiveGame()
    navigate('/')
  }

  // --- cell renderer ---
  const Cell = ({ p, cat }) => {
    const value = scores[p.id][cat.key]
    const isFlash = flash === `${p.id}:${cat.key}`
    const wordVal = isWords && cat.word ? words[p.id]?.[cat.key] ?? '' : null

    return (
      <td className={`p-1 align-top ${isFlash ? 'animate-score-flash rounded-lg' : ''}`}>
        <div className="flex flex-col gap-1">
          {isWords && cat.word && (
            <input
              type="text"
              value={wordVal}
              onChange={(e) => setWord(p.id, cat.key, e.target.value.toUpperCase())}
              placeholder="word"
              maxLength={6}
              className="w-full rounded-md border border-gold/15 bg-charcoal/50 px-1.5 py-1 text-center text-[11px] uppercase tracking-wide text-ivory-dim placeholder:text-ivory-dim/30 focus:border-gold/60 focus:outline-none"
            />
          )}
          {cat.fixed ? (
            <div className="flex gap-1">
              <button
                onClick={() => setScore(p.id, cat.key, num(value) === cat.fixed ? '' : cat.fixed)}
                className={`flex-1 rounded-md py-1.5 text-sm font-bold transition-colors ${
                  num(value) === cat.fixed
                    ? 'bg-gold text-charcoal'
                    : 'border border-gold/25 bg-charcoal/50 text-ivory'
                }`}
              >
                {cat.fixed}
              </button>
              <button
                onClick={() => setScore(p.id, cat.key, value === '0' || value === 0 ? '' : 0)}
                className={`w-8 rounded-md py-1.5 text-sm font-bold transition-colors ${
                  value === 0 || value === '0'
                    ? 'bg-burgundy text-ivory'
                    : 'border border-gold/15 bg-charcoal/40 text-ivory-dim'
                }`}
                title="Scratch (0)"
              >
                ✗
              </button>
            </div>
          ) : (
            <input
              type="number"
              inputMode="numeric"
              value={value}
              onChange={(e) => setScore(p.id, cat.key, e.target.value)}
              placeholder="–"
              className="w-full rounded-md border border-gold/20 bg-charcoal/60 px-1.5 py-1.5 text-center text-base font-semibold text-ivory placeholder:text-ivory-dim/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          )}
        </div>
      </td>
    )
  }

  const TotalRow = ({ label, get, accent }) => (
    <tr className={accent ? 'bg-gold/5' : ''}>
      <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-1.5 text-left text-xs font-semibold text-ivory-dim backdrop-blur">
        {label}
      </th>
      {players.map((p) => (
        <td key={p.id} className="px-2 py-1.5 text-center text-sm font-bold text-ivory">
          {get(p.id)}
        </td>
      ))}
    </tr>
  )

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="label-caps">Round {round} / {def.all.length}</p>
          <h1 className="heading text-2xl">{meta.label}</h1>
        </div>
        <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setConfirmQuit(true)}>
          Quit
        </button>
      </header>

      {/* Running winner banner */}
      <div className="card mb-4 flex items-center justify-between px-4 py-3">
        <span className="label-caps">Leading now</span>
        {leaderId ? (
          <span className="flex items-center gap-2 font-display text-lg font-bold">
            <PlayerDot color={getPlayer(leaderId).color} size={12} />
            {tiedLead ? 'Tied' : getPlayer(leaderId).name}
            <span className="text-gradient-gold">{results[leaderId].grand}</span>
          </span>
        ) : (
          <span className="text-ivory-dim">No scores yet</span>
        )}
      </div>

      {/* Player summary cards */}
      <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
        {players.map((p) => (
          <div key={p.id} className="card min-w-[150px] flex-1 p-3">
            <div className="flex items-center gap-2">
              <PlayerDot color={p.color} size={12} />
              <span className="truncate font-semibold">{p.name}</span>
            </div>
            <p className="mt-1 font-display text-3xl font-extrabold text-gradient-gold">
              {results[p.id].grand}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-ivory-dim">
              <span>{isWords ? '🔤' : '🎲'} ×{yahtzeeTally(scores[p.id], def, bonusYahtzee[p.id] || 0)}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase">Bonus</span>
                <button
                  className="h-6 w-6 rounded-md border border-gold/30 text-ivory hover:bg-gold/10"
                  onClick={() => bumpBonus(p.id, -1)}
                >
                  −
                </button>
                <span className="w-4 text-center font-bold text-gold">{bonusYahtzee[p.id] || 0}</span>
                <button
                  className="h-6 w-6 rounded-md border border-gold/30 text-ivory hover:bg-gold/10"
                  onClick={() => bumpBonus(p.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scorecard */}
      <div className="card overflow-x-auto p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-charcoal-card px-2 py-2 text-left">
                <span className="label-caps">Upper</span>
              </th>
              {players.map((p) => (
                <th key={p.id} className="min-w-[92px] px-1 py-2 text-center">
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
                  {cat.hint && <span className="ml-1 text-[10px] text-ivory-dim/60">{cat.hint}</span>}
                </th>
                {players.map((p) => (
                  <Cell key={p.id} p={p} cat={cat} />
                ))}
              </tr>
            ))}
            <TotalRow label={`Upper Subtotal`} get={(id) => results[id].upperSum} />
            <TotalRow
              label={`Bonus (≥${UPPER_BONUS_THRESHOLD} → +35)`}
              get={(id) => (results[id].upperBonus ? '+35' : '—')}
              accent
            />

            <tr>
              <th className="sticky left-0 z-10 bg-charcoal-card px-2 pb-1 pt-3 text-left">
                <span className="label-caps">Lower</span>
              </th>
              {players.map((p) => (
                <td key={p.id} />
              ))}
            </tr>
            {def.lower.map((cat) => (
              <tr key={cat.key} className="border-t border-gold/5">
                <th className="sticky left-0 z-10 bg-charcoal-card/95 px-2 py-1 text-left text-sm font-medium text-ivory backdrop-blur">
                  {cat.label}
                  {cat.hint && <span className="ml-1 text-[10px] text-ivory-dim/60">{cat.hint}</span>}
                </th>
                {players.map((p) => (
                  <Cell key={p.id} p={p} cat={cat} />
                ))}
              </tr>
            ))}
            <TotalRow label="Bonus Yahtzees (+100)" get={(id) => results[id].bonusYahtzeePts || '—'} />
            <TotalRow label="Grand Total" get={(id) => results[id].grand} accent />
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="sticky bottom-20 mt-4 flex gap-3">
        <button className="btn-ghost flex-1" onClick={undo} disabled={!log.length}>
          ↶ Undo
        </button>
        <button className="btn-gold flex-[2]" onClick={() => setConfirmEnd(true)}>
          End Game
        </button>
      </div>
      {!allComplete && (
        <p className="mt-2 text-center text-xs text-ivory-dim">
          Tip: you can end early — totals are final as shown.
        </p>
      )}

      <ConfirmModal
        open={confirmEnd}
        title="End the game?"
        message="We’ll tally the final scores and crown a winner."
        confirmLabel="Tally & Finish"
        onConfirm={handleEndConfirm}
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
        subtitle={record ? `${meta.label} • ${record.scores[winnerPlayers[0]?.id]} points` : ''}
        details={
          record && (
            <div className="mx-auto max-w-xs space-y-1 text-sm">
              {players
                .slice()
                .sort((a, b) => record.scores[b.id] - record.scores[a.id])
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-charcoal/40 px-3 py-1.5">
                    <span className="flex items-center gap-2">
                      <PlayerDot color={p.color} /> {p.name}
                    </span>
                    <span className="font-bold text-gold">{record.scores[p.id]}</span>
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
