// ---------------------------------------------------------------------------
// Game Night — shared constants & game definitions
// ---------------------------------------------------------------------------

export const STORAGE_KEY = 'game-night:v1'

export const GAME_TYPES = {
  YAHTZEE: 'yahtzee',
  YAHTZEE_WORDS: 'yahtzee-words',
  FARKLE: 'farkle',
  FULL_BOARD: 'full-board',
}

export const GAME_META = {
  [GAME_TYPES.YAHTZEE]: {
    label: 'Yahtzee',
    short: 'Yahtzee',
    accent: 'burgundy',
    icon: '🎲',
  },
  [GAME_TYPES.YAHTZEE_WORDS]: {
    label: 'Yahtzee Words',
    short: 'Words',
    accent: 'forest',
    icon: '🔤',
  },
  [GAME_TYPES.FARKLE]: {
    label: 'Farkle',
    short: 'Farkle',
    accent: 'gold',
    icon: '🎯',
  },
  [GAME_TYPES.FULL_BOARD]: {
    label: 'Full Board Yahtzee',
    short: 'Full Board',
    accent: 'burgundy',
    icon: '🏆',
  },
}

// Palette assigned to players, in priority order. Clean jewel tones, no yellow.
export const PLAYER_COLORS = [
  '#2563A8', // sapphire
  '#9B2D43', // garnet
  '#0E7490', // teal
  '#7C3AED', // violet
  '#C2410C', // terracotta
  '#15803D', // green
]

export const DEFAULT_PLAYERS = [
  { id: 'p_elyce', name: 'Elyce', color: PLAYER_COLORS[0] },
  { id: 'p_mike', name: 'Mike', color: PLAYER_COLORS[1] },
]

export const MAX_PLAYERS = 6

export const FARKLE_TARGET = 10000
export const FARKLE_MIN_ON_BOARD = 500

// --- Standard Yahtzee scorecard --------------------------------------------
export const YAHTZEE_UPPER = [
  { key: 'aces', label: 'Aces', section: 'upper', hint: 'Sum of 1s' },
  { key: 'twos', label: 'Twos', section: 'upper', hint: 'Sum of 2s' },
  { key: 'threes', label: 'Threes', section: 'upper', hint: 'Sum of 3s' },
  { key: 'fours', label: 'Fours', section: 'upper', hint: 'Sum of 4s' },
  { key: 'fives', label: 'Fives', section: 'upper', hint: 'Sum of 5s' },
  { key: 'sixes', label: 'Sixes', section: 'upper', hint: 'Sum of 6s' },
]

export const YAHTZEE_LOWER = [
  { key: 'threeKind', label: '3 of a Kind', section: 'lower', hint: 'Sum of all dice' },
  { key: 'fourKind', label: '4 of a Kind', section: 'lower', hint: 'Sum of all dice' },
  { key: 'fullHouse', label: 'Full House', section: 'lower', fixed: 25 },
  { key: 'smStraight', label: 'Sm Straight', section: 'lower', fixed: 30 },
  { key: 'lgStraight', label: 'Lg Straight', section: 'lower', fixed: 40 },
  { key: 'yahtzee', label: 'Yahtzee', section: 'lower', fixed: 50, isYahtzee: true },
  { key: 'chance', label: 'Chance', section: 'lower', hint: 'Sum of all dice' },
]

export const YAHTZEE_CATEGORIES = [...YAHTZEE_UPPER, ...YAHTZEE_LOWER]

export const UPPER_BONUS_THRESHOLD = 63
export const UPPER_BONUS_VALUE = 35
export const BONUS_YAHTZEE_VALUE = 100

// --- Yahtzee Words scorecard -----------------------------------------------
export const YW_UPPER = [
  { key: 'word3', label: '3-Letter Word', section: 'upper', word: true, hint: 'Face value' },
  { key: 'word4', label: '4-Letter Word', section: 'upper', word: true, hint: 'Face value' },
  { key: 'word5', label: '5-Letter Word', section: 'upper', word: true, hint: 'Face value' },
  { key: 'word6', label: '6-Letter Word', section: 'upper', word: true, hint: 'Face value' },
]

export const YW_LOWER = [
  { key: 'doubleLetters', label: 'Double Letters', section: 'lower', word: true, hint: 'Same letter ×2' },
  { key: 'tripleLetters', label: 'Triple Letters', section: 'lower', word: true, hint: 'Same letter ×3' },
  { key: 'fullWord', label: 'Full Word', section: 'lower', word: true, hint: 'All 5 dice' },
  { key: 'straight', label: 'Straight', section: 'lower', word: true, hint: '5 letters in sequence' },
  { key: 'yahtzeeWord', label: 'Yahtzee Word', section: 'lower', fixed: 50, isYahtzee: true, hint: 'All 5 same letter' },
  { key: 'chance', label: 'Chance', section: 'lower', word: true, hint: 'Any word' },
]

export const YW_CATEGORIES = [...YW_UPPER, ...YW_LOWER]

// Resolve the scorecard definition for a given game type.
export function getScorecardDef(type) {
  if (type === GAME_TYPES.YAHTZEE_WORDS) {
    return { upper: YW_UPPER, lower: YW_LOWER, all: YW_CATEGORIES, words: true }
  }
  return { upper: YAHTZEE_UPPER, lower: YAHTZEE_LOWER, all: YAHTZEE_CATEGORIES, words: false }
}

export const FULL_BOARD_COLUMNS = 7

// --- Farkle rules reference -------------------------------------------------
export const FARKLE_RULES = {
  scoring: [
    { combo: 'Single 1', points: '100' },
    { combo: 'Single 5', points: '50' },
    { combo: 'Three 1s', points: '300' },
    { combo: 'Three 2s', points: '200' },
    { combo: 'Three 3s', points: '300' },
    { combo: 'Three 4s', points: '400' },
    { combo: 'Three 5s', points: '500' },
    { combo: 'Three 6s', points: '600' },
    { combo: '4 of a kind', points: '1,000' },
    { combo: '5 of a kind', points: '2,000' },
    { combo: '6 of a kind', points: '3,000' },
    { combo: '1–6 Straight', points: '1,500' },
    { combo: '3 Pairs', points: '1,500' },
    { combo: '2 Triplets', points: '2,500' },
    { combo: '4 of a kind + a pair', points: '1,500' },
  ],
  notes: [
    { title: 'Hot Dice', body: 'Score on all six dice in a turn and you may roll all six again, banking points as you go.' },
    { title: 'Busting', body: 'Roll with no scoring dice and you bust — you lose every point accumulated that turn.' },
    { title: 'Winning', body: 'First player to reach 10,000 points triggers the end of the game.' },
  ],
}
