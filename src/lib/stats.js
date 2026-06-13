// ---------------------------------------------------------------------------
// Stats engine — derives all dashboard figures from the raw games array.
// Pure functions: (players, games) -> computed stats. Nothing persisted here.
// ---------------------------------------------------------------------------
import { GAME_TYPES } from './constants.js'

// A winner may be a single id or an array of ids (ties). Always work with an array.
export function asWinners(winner) {
  if (!winner) return []
  return Array.isArray(winner) ? winner : [winner]
}

export function sortGamesDesc(games) {
  return [...games].sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id > a.id ? 1 : -1))
}

export function computeStats(players, games) {
  const playerIds = players.map((p) => p.id)
  const types = Object.values(GAME_TYPES)

  // --- scaffold ---
  const blankByPlayer = () => Object.fromEntries(playerIds.map((id) => [id, 0]))

  const byType = {}
  for (const t of types) {
    byType[t] = {
      wins: blankByPlayer(),
      scoreSum: blankByPlayer(),
      scoreCount: blankByPlayer(),
      games: 0,
    }
  }

  const totalWins = blankByPlayer()
  const totalGames = blankByPlayer()

  // head-to-head: h2h[type][winnerId][loserId] = count
  const h2h = {}
  for (const t of types) {
    h2h[t] = Object.fromEntries(
      playerIds.map((id) => [id, Object.fromEntries(playerIds.map((o) => [o, 0]))]),
    )
  }

  const fullBoard = { wins: blankByPlayer(), sweeps: blankByPlayer() }

  // yahtzee / words: total yahtzees rolled per player
  const yahtzees = { [GAME_TYPES.YAHTZEE]: blankByPlayer(), [GAME_TYPES.YAHTZEE_WORDS]: blankByPlayer() }

  for (const game of games) {
    const t = game.type
    if (!byType[t]) continue
    const winners = asWinners(game.winner)
    const participants = (game.players || []).filter((id) => playerIds.includes(id))

    byType[t].games += 1

    for (const pid of participants) {
      totalGames[pid] = (totalGames[pid] || 0) + 1
      const s = game.scores?.[pid]
      if (typeof s === 'number' && !Number.isNaN(s)) {
        byType[t].scoreSum[pid] += s
        byType[t].scoreCount[pid] += 1
      }
    }

    for (const w of winners) {
      if (!playerIds.includes(w)) continue
      byType[t].wins[w] = (byType[t].wins[w] || 0) + 1
      totalWins[w] = (totalWins[w] || 0) + 1
      // head to head: winner beats every other participant
      for (const o of participants) {
        if (o === w || winners.includes(o)) continue
        h2h[t][w][o] += 1
      }
    }

    if (t === GAME_TYPES.FULL_BOARD) {
      for (const w of winners) {
        if (playerIds.includes(w)) fullBoard.wins[w] += 1
      }
      if (game.metadata?.isSweep && game.metadata?.sweepPlayer) {
        const sp = game.metadata.sweepPlayer
        if (playerIds.includes(sp)) fullBoard.sweeps[sp] += 1
      }
    }

    if (yahtzees[t] && game.metadata?.yahtzeeCount) {
      for (const [pid, n] of Object.entries(game.metadata.yahtzeeCount)) {
        if (playerIds.includes(pid)) yahtzees[t][pid] += Number(n) || 0
      }
    }
  }

  // --- averages ---
  const averages = {}
  for (const t of types) {
    averages[t] = Object.fromEntries(
      playerIds.map((id) => {
        const c = byType[t].scoreCount[id]
        return [id, c ? Math.round(byType[t].scoreSum[id] / c) : null]
      }),
    )
  }

  // --- current win streaks (consecutive most-recent participated games won) ---
  const streaks = blankByPlayer()
  const broken = {}
  for (const game of sortGamesDesc(games)) {
    const winners = asWinners(game.winner)
    const participants = (game.players || []).filter((id) => playerIds.includes(id))
    for (const pid of participants) {
      if (broken[pid]) continue
      if (winners.includes(pid)) streaks[pid] += 1
      else broken[pid] = true
    }
  }

  return {
    byType,
    averages,
    totalWins,
    totalGames,
    h2h,
    fullBoard,
    yahtzees,
    streaks,
    recent: sortGamesDesc(games).slice(0, 10),
    allTimeGames: games.length,
  }
}

// Convenience: head-to-head summary for a pair within a type.
export function headToHead(stats, type, aId, bId) {
  const a = stats.h2h?.[type]?.[aId]?.[bId] ?? 0
  const b = stats.h2h?.[type]?.[bId]?.[aId] ?? 0
  return { a, b }
}
