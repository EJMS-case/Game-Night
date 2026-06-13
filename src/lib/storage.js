// ---------------------------------------------------------------------------
// localStorage persistence layer
// ---------------------------------------------------------------------------
import { STORAGE_KEY, DEFAULT_PLAYERS } from './constants.js'

const DEFAULT_STATE = {
  players: DEFAULT_PLAYERS,
  games: [],
  activeGame: null, // in-progress game draft, persisted so a refresh never loses play
  settings: { soundEnabled: true, theme: 'jewel' },
  version: 1,
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_STATE)
    const parsed = JSON.parse(raw)
    // Merge with defaults so newly added fields never crash an old payload.
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      players:
        Array.isArray(parsed.players) && parsed.players.length
          ? parsed.players
          : structuredClone(DEFAULT_PLAYERS),
      games: Array.isArray(parsed.games) ? parsed.games : [],
      activeGame: parsed.activeGame || null,
    }
  } catch (err) {
    console.error('Failed to load Game Night state, resetting.', err)
    return structuredClone(DEFAULT_STATE)
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save Game Night state.', err)
  }
}

export function exportState() {
  return JSON.stringify(loadState(), null, 2)
}

// Lightweight unique id generator (no external deps).
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
