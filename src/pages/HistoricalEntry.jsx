import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { PlayerDot } from '../components/ui.jsx'
import { GAME_TYPES, GAME_META, FULL_BOARD_COLUMNS } from '../lib/constants.js'
import { num } from '../lib/yahtzeeScoring.js'
import { toDateInput } from '../lib/format.js'

const TYPES = [GAME_TYPES.YAHTZEE, GAME_TYPES.YAHTZEE_WORDS, GAME_TYPES.FARKLE, GAME_TYPES.FULL_BOARD]

export default function HistoricalEntry() {
  const { players, addGame } = useApp()
  const navigate = useNavigate()

  const [type, setType] = useState(GAME_TYPES.YAHTZEE)
  const [date, setDate] = useState(toDateInput(new Date().toISOString()))
  const [selected, setSelected] = useState(() => Object.fromEntries(players.map((p) => [p.id, true])))
  const [scores, setScores] = useState({}) // pid -> value (standard)
  const [yc, setYc] = useState({}) // pid -> yahtzee count
  const [fb, setFb] = useState({}) // pid -> [7] column scores
  const [winnerOverride, setWinnerOverride] = useState({}) // pid -> bool (manual)
  const [saved, setSaved] = useState(false)

  const isFullBoard = type === GAME_TYPES.FULL_BOARD
  const isYahtzeeish = type === GAME_TYPES.YAHTZEE || type === GAME_TYPES.YAHTZEE_WORDS
  const included = players.filter((p) => selected[p.id])

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }))

  const setFbCell = (pid, col, val) =>
    setFb((f) => {
      const arr = (f[pid] || Array(FULL_BOARD_COLUMNS).fill('')).slice()
      arr[col] = val
      return { ...f, [pid]: arr }
    })

  // --- derived: full board column winners & columns won ---
  const fbDerived = useMemo(() => {
    if (!isFullBoard) return null
    const columnWinners = []
    const columnsWon = Object.fromEntries(included.map((p) => [p.id, 0]))
    const totals = Object.fromEntries(included.map((p) => [p.id, 0]))
    for (let c = 0; c < FULL_BOARD_COLUMNS; c++) {
      let top = -1
      let leaders = []
      for (const p of included) {
        const v = num((fb[p.id] || [])[c])
        totals[p.id] += v
        if (v > top) { top = v; leaders = [p.id] }
        else if (v === top) leaders.push(p.id)
      }
      const w = top > 0 && leaders.length === 1 ? leaders[0] : null
      columnWinners.push(w)
      if (w) columnsWon[w] += 1
    }
    return { columnWinners, columnsWon, totals }
  }, [isFullBoard, included, fb])

  // --- derived winner(s) ---
  const derivedWinners = useMemo(() => {
    const manual = included.filter((p) => winnerOverride[p.id]).map((p) => p.id)
    if (manual.length) return manual
    if (isFullBoard && fbDerived) {
      const maxWon = Math.max(0, ...included.map((p) => fbDerived.columnsWon[p.id]))
      if (maxWon === 0) return []
      let c = included.filter((p) => fbDerived.columnsWon[p.id] === maxWon)
      if (c.length > 1) {
        const topT = Math.max(...c.map((p) => fbDerived.totals[p.id]))
        c = c.filter((p) => fbDerived.totals[p.id] === topT)
      }
      return c.map((p) => p.id)
    }
    // standard: highest score
    const vals = included.map((p) => num(scores[p.id]))
    const top = Math.max(-1, ...vals)
    if (top <= 0) return []
    return included.filter((p) => num(scores[p.id]) === top).map((p) => p.id)
  }, [included, winnerOverride, isFullBoard, fbDerived, scores])

  const canSave = included.length >= 1 && derivedWinners.length >= 1

  const save = () => {
    if (!canSave) return
    const playerIds = included.map((p) => p.id)
    let scoreMap = {}
    let metadata = {}

    if (isFullBoard) {
      scoreMap = Object.fromEntries(included.map((p) => [p.id, fbDerived.totals[p.id]]))
      const sweepPlayer = included.find((p) => fbDerived.columnsWon[p.id] === FULL_BOARD_COLUMNS)?.id || null
      metadata = {
        columnWinners: fbDerived.columnWinners,
        columnsWon: fbDerived.columnsWon,
        columnScores: Object.fromEntries(
          included.map((p) => [p.id, (fb[p.id] || Array(FULL_BOARD_COLUMNS).fill('')).map((v) => num(v))]),
        ),
        isSweep: !!sweepPlayer,
        sweepPlayer,
        historical: true,
      }
    } else {
      scoreMap = Object.fromEntries(included.map((p) => [p.id, num(scores[p.id])]))
      metadata = { historical: true }
      if (isYahtzeeish) {
        metadata.yahtzeeCount = Object.fromEntries(included.map((p) => [p.id, num(yc[p.id])]))
      }
    }

    // Build an ISO timestamp at noon on the chosen date (stable, local-ish).
    const iso = new Date(`${date}T12:00:00`).toISOString()

    addGame({
      type,
      date: iso,
      players: playerIds,
      scores: scoreMap,
      winner: derivedWinners.length === 1 ? derivedWinners[0] : derivedWinners,
      metadata,
    })

    setSaved(true)
    setTimeout(() => navigate('/'), 700)
  }

  if (saved) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-pop-in">
        <span className="text-5xl">✅</span>
        <p className="heading mt-3 text-2xl">Saved to history</p>
        <p className="text-ivory-dim">Updating your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader subtitle="Backfill the books" title="Historical Data" />

      {/* Game type */}
      <section>
        <p className="label-caps mb-2">Game type</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`card flex items-center gap-2 p-3 text-left transition-all ${
                type === t ? 'border-gold bg-gold/10 shadow-gold-glow' : ''
              }`}
            >
              <span className="text-xl">{GAME_META[t].icon}</span>
              <span className="font-semibold">{GAME_META[t].short}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Date */}
      <section className="mt-5">
        <p className="label-caps mb-2">Date</p>
        <input type="date" value={date} max={toDateInput(new Date().toISOString())} onChange={(e) => setDate(e.target.value)} className="input-field" />
      </section>

      {/* Players */}
      <section className="mt-5">
        <p className="label-caps mb-2">Players & scores</p>
        <div className="space-y-2">
          {players.map((p) => {
            const on = selected[p.id]
            const isWinner = derivedWinners.includes(p.id)
            return (
              <div key={p.id} className={`card p-3 ${on ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(p.id)} className="flex items-center gap-2 font-semibold">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${on ? 'border-gold bg-gold text-charcoal' : 'border-gold/30'}`}>
                      {on && '✓'}
                    </span>
                    <PlayerDot color={p.color} /> {p.name}
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    {on && (
                      <button
                        onClick={() => setWinnerOverride((w) => ({ ...w, [p.id]: !w[p.id] }))}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isWinner ? 'border-gold bg-gold/20 text-gold' : 'border-gold/25 text-ivory-dim'
                        }`}
                        title="Mark as winner (overrides auto)"
                      >
                        {isWinner ? '👑 Winner' : 'Mark winner'}
                      </button>
                    )}
                  </div>
                </div>

                {on && !isFullBoard && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={scores[p.id] ?? ''}
                      onChange={(e) => setScores((s) => ({ ...s, [p.id]: e.target.value }))}
                      placeholder="Final score"
                      className="input-field"
                    />
                    {isYahtzeeish && (
                      <input
                        type="number"
                        inputMode="numeric"
                        value={yc[p.id] ?? ''}
                        onChange={(e) => setYc((s) => ({ ...s, [p.id]: e.target.value }))}
                        placeholder="Yahtzees"
                        className="input-field w-28"
                      />
                    )}
                  </div>
                )}

                {on && isFullBoard && (
                  <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                    {Array.from({ length: FULL_BOARD_COLUMNS }).map((_, c) => (
                      <div key={c}>
                        <label className="mb-0.5 block text-center text-[10px] uppercase text-ivory-dim">C{c + 1}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={(fb[p.id] || [])[c] ?? ''}
                          onChange={(e) => setFbCell(p.id, c, e.target.value)}
                          className="input-field px-1 py-1.5 text-center text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Full board live summary */}
      {isFullBoard && fbDerived && included.length > 0 && (
        <section className="mt-4">
          <div className="card p-4">
            <p className="label-caps mb-2">Column winners</p>
            <div className="flex flex-wrap gap-1.5">
              {fbDerived.columnWinners.map((w, i) => {
                const p = w ? players.find((x) => x.id === w) : null
                return (
                  <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-gold/20 bg-charcoal/40 px-2 py-1 text-xs">
                    <span className="text-ivory-dim">{i + 1}</span>
                    {p ? <><PlayerDot color={p.color} size={8} /> {p.name}</> : <span className="text-ivory-dim">—</span>}
                  </span>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {included.map((p) => (
                <span key={p.id} className="stat-chip">
                  <PlayerDot color={p.color} /> {p.name} · {fbDerived.columnsWon[p.id]} cols · {fbDerived.totals[p.id]} pts
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Winner preview */}
      <div className="mt-5 rounded-xl border border-gold/20 bg-charcoal/40 px-4 py-3 text-center text-sm">
        {derivedWinners.length ? (
          <span>
            Winner:{' '}
            <span className="font-bold text-gold">
              {derivedWinners.map((id) => players.find((p) => p.id === id)?.name).join(' & ')}
            </span>
          </span>
        ) : (
          <span className="text-ivory-dim">Enter scores or mark a winner to save.</span>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button className="btn-ghost flex-1" onClick={() => navigate('/')}>Cancel</button>
        <button className="btn-gold flex-[2]" onClick={save} disabled={!canSave}>Save to History</button>
      </div>
    </div>
  )
}
