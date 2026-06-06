// ---------------------------------------------------------------------------
// Builders for a fresh in-progress game's state, keyed by game type.
// Kept separate so both the setup screen and "same players" shortcut share it.
// ---------------------------------------------------------------------------
import { GAME_TYPES, getScorecardDef, FULL_BOARD_COLUMNS } from './constants.js'

function blankCard(def) {
  const card = {}
  for (const cat of def.all) card[cat.key] = ''
  return card
}

function blankWords(def) {
  const words = {}
  for (const cat of def.all) if (cat.word) words[cat.key] = ''
  return words
}

export function initialGameState(type, playerIds) {
  switch (type) {
    case GAME_TYPES.YAHTZEE:
    case GAME_TYPES.YAHTZEE_WORDS: {
      const def = getScorecardDef(type)
      const scores = {}
      const words = {}
      const bonusYahtzee = {}
      for (const pid of playerIds) {
        scores[pid] = blankCard(def)
        words[pid] = blankWords(def)
        bonusYahtzee[pid] = 0
      }
      return { scores, words, bonusYahtzee, log: [] }
    }
    case GAME_TYPES.FULL_BOARD: {
      const def = getScorecardDef(GAME_TYPES.YAHTZEE)
      // columns[col][pid][catKey]
      const columns = Array.from({ length: FULL_BOARD_COLUMNS }, () => {
        const col = {}
        for (const pid of playerIds) col[pid] = blankCard(def)
        return col
      })
      const bonusYahtzee = Array.from({ length: FULL_BOARD_COLUMNS }, () =>
        Object.fromEntries(playerIds.map((p) => [p, 0])),
      )
      return { columns, bonusYahtzee, activeColumn: 0, log: [] }
    }
    case GAME_TYPES.FARKLE: {
      const totals = Object.fromEntries(playerIds.map((p) => [p, 0]))
      return { totals, turns: [], currentPlayer: 0 }
    }
    default:
      return {}
  }
}
