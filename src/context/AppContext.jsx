import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { loadState, saveState, uid } from '../lib/storage.js'
import { computeStats } from '../lib/stats.js'
import { sounds } from '../lib/sound.js'
import { PLAYER_COLORS, MAX_PLAYERS, DEFAULT_PLAYERS } from '../lib/constants.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState())

  // Persist the whole payload on every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  const stats = useMemo(() => computeStats(state.players, state.games), [state.players, state.games])

  // --- sound ---
  const play = useCallback(
    (name) => {
      const fn = sounds[name]
      if (fn) fn(state.settings.soundEnabled)
    },
    [state.settings.soundEnabled],
  )

  // --- players ---
  const addPlayer = useCallback((name) => {
    setState((s) => {
      if (s.players.length >= MAX_PLAYERS) return s
      const used = new Set(s.players.map((p) => p.color))
      const color = PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[s.players.length % PLAYER_COLORS.length]
      const player = { id: uid('p'), name: name?.trim() || `Player ${s.players.length + 1}`, color }
      return { ...s, players: [...s.players, player] }
    })
  }, [])

  const updatePlayer = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }, [])

  const removePlayer = useCallback((id) => {
    setState((s) => {
      if (s.players.length <= 1) return s
      return { ...s, players: s.players.filter((p) => p.id !== id) }
    })
  }, [])

  // --- games ---
  const addGame = useCallback((game) => {
    const record = { id: uid('g'), date: new Date().toISOString(), ...game }
    setState((s) => ({ ...s, games: [...s.games, record], activeGame: null }))
    return record
  }, [])

  const deleteGame = useCallback((id) => {
    setState((s) => ({ ...s, games: s.games.filter((g) => g.id !== id) }))
  }, [])

  const resetStats = useCallback(() => {
    setState((s) => ({ ...s, games: [], activeGame: null }))
  }, [])

  // --- settings ---
  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  // --- active game draft ---
  const startGame = useCallback((type, playerIds, initialState) => {
    const draft = {
      id: uid('draft'),
      type,
      playerIds,
      startedAt: new Date().toISOString(),
      state: initialState || {},
    }
    setState((s) => ({ ...s, activeGame: draft }))
    return draft
  }, [])

  const updateActiveGame = useCallback((updater) => {
    setState((s) => {
      if (!s.activeGame) return s
      const nextState =
        typeof updater === 'function' ? updater(s.activeGame.state) : { ...s.activeGame.state, ...updater }
      return { ...s, activeGame: { ...s.activeGame, state: nextState } }
    })
  }, [])

  const clearActiveGame = useCallback(() => {
    setState((s) => ({ ...s, activeGame: null }))
  }, [])

  const resetAll = useCallback(() => {
    setState({
      players: structuredClone(DEFAULT_PLAYERS),
      games: [],
      activeGame: null,
      settings: { soundEnabled: true, theme: 'jewel' },
      version: 1,
    })
  }, [])

  const getPlayer = useCallback((id) => state.players.find((p) => p.id === id), [state.players])

  const value = {
    ...state,
    stats,
    play,
    addPlayer,
    updatePlayer,
    removePlayer,
    getPlayer,
    addGame,
    deleteGame,
    resetStats,
    resetAll,
    updateSettings,
    startGame,
    updateActiveGame,
    clearActiveGame,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
