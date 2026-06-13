// ---------------------------------------------------------------------------
// Yahtzee / Yahtzee Words scoring math (shared by standard & full-board).
// ---------------------------------------------------------------------------
import {
  getScorecardDef,
  UPPER_BONUS_THRESHOLD,
  UPPER_BONUS_VALUE,
  BONUS_YAHTZEE_VALUE,
} from './constants.js'

export function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// card: { catKey: value }, def from getScorecardDef
export function scoreCard(card, def, bonusYahtzeeCount = 0) {
  const upperSum = def.upper.reduce((acc, c) => acc + num(card[c.key]), 0)
  const upperBonus = upperSum >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS_VALUE : 0
  const lowerSum = def.lower.reduce((acc, c) => acc + num(card[c.key]), 0)
  const bonusYahtzeePts = bonusYahtzeeCount * BONUS_YAHTZEE_VALUE
  const grand = upperSum + upperBonus + lowerSum + bonusYahtzeePts
  return { upperSum, upperBonus, lowerSum, bonusYahtzeePts, grand }
}

// How many "Yahtzees" a player rolled: the scored Yahtzee box + each bonus.
export function yahtzeeTally(card, def, bonusYahtzeeCount = 0) {
  const yCat = def.all.find((c) => c.isYahtzee)
  const scoredOne = yCat && num(card[yCat.key]) > 0 ? 1 : 0
  return scoredOne + bonusYahtzeeCount
}

export function gradeType(type, card, bonusYahtzeeCount = 0) {
  const def = getScorecardDef(type)
  return scoreCard(card, def, bonusYahtzeeCount)
}
