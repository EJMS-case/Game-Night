import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { loadState, saveState, uid } from '../lib/storage.js'
import { computeStats } from '../lib/stats.js'
import { sounds } from '../lib/sound.js'
import { PLAYER_COLORS, MAX_PLAYERS, DEFAULT_PLAYERS } from '../lib/constants.js'
import * as cloud from '../lib/cloud.js'

const AppContext = createContext(null)
const HOUSE_KEY = 'game-night:house'

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState())
  const [house, setHouseState] = useState(() => localStorage.getItem(HOUSE_KEY) || '')
  // connection: 'local' | 'connecting' | 'live' | 'error'
  const [connection, setConnection] = useState('local')

  // Refs so async callbacks always see the latest values.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const houseKey = useMemo(() => (house ? cloud.houseId(house) : null), [house])
  const houseKeyRef = useRef(houseKey)
  useEffect(() => {
    houseKeyRef.current = houseKey
  }, [houseKey])

  const connRef = useRef(connection)
  useEffect(() => {
    connRef.current = connection
  }, [connection])

  // Persist the local cache on every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  // ---- cloud connection lifecycle (runs when the house code changes) ----
  useEffect(() => {
    if (!cloud.cloudConfigured || !houseKey) {
      setConnection('local')
      return
    }
    let cancelled = false
    let unsubscribe = null
    let debounce = null

    const refetch = async () => {
      try {
        const remote = await cloud.fetchAll(houseKey)
        if (cancelled) return
        setState((s) => ({ ...s, players: remote.players, games: remote.games }))
      } catch (err) {
        if (!cancelled) {
          console.error('Cloud refetch failed', err)
          setConnection('error')
        }
      }
    }

    const connect = async () => {
      setConnection('connecting')
      try {
        const remote = await cloud.fetchAll(houseKey)
        if (cancelled) return
        if (remote.players.length === 0) {
          // Fresh house — seed it from whatever this device already has locally.
          const local = stateRef.current
          await cloud.upsertPlayers(houseKey, local.players)
          await cloud.upsertGames(houseKey, local.games)
        } else {
          // Existing house — adopt the shared data (settings stay per-device).
          setState((s) => ({ ...s, players: remote.players, games: remote.games }))
        }
        if (cancelled) return
        setConnection('live')
        unsubscribe = cloud.subscribe(houseKey, () => {
          clearTimeout(debounce)
          debounce = setTimeout(refetch, 350)
        })
      } catch (err) {
        if (!cancelled) {
          console.error('Cloud connect failed', err)
          setConnection('error')
        }
      }
    }

    connect()
    return () => {
      cancelled = true
      clearTimeout(debounce)
      if (unsubscribe) unsubscribe()
    }
  }, [houseKey])

  // Fire-and-forget cloud write; failures drop us to a recoverable error state.
  const push = useCallback((fn) => {
    if (connRef.current !== 'live' || !houseKeyRef.current) return
    Promise.resolve()
      .then(() => fn(houseKeyRef.current))
      .catch((err) => {
        console.error('Cloud write failed', err)
        setConnection('error')
      })
  }, [])

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
  const addPlayer = useCallback(
    (name) => {
      const s = stateRef.current
      if (s.players.length >= MAX_PLAYERS) return
      const used = new Set(s.players.map((p) => p.color))
      const color =
        PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[s.players.length % PLAYER_COLORS.length]
      const player = { id: uid('p'), name: name?.trim() || `Player ${s.players.length + 1}`, color }
      const players = [...s.players, player]
      setState((st) => ({ ...st, players }))
      push((h) => cloud.upsertPlayers(h, players))
    },
    [push],
  )

  const updatePlayer = useCallback(
    (id, patch) => {
      const players = stateRef.current.players.map((p) => (p.id === id ? { ...p, ...patch } : p))
      setState((st) => ({ ...st, players }))
      push((h) => cloud.upsertPlayers(h, players))
    },
    [push],
  )

  const removePlayer = useCallback(
    (id) => {
      const s = stateRef.current
      if (s.players.length <= 1) return
      const players = s.players.filter((p) => p.id !== id)
      setState((st) => ({ ...st, players }))
      push(async (h) => {
        await cloud.deletePlayerRow(h, id)
        await cloud.upsertPlayers(h, players)
      })
    },
    [push],
  )

  // --- games ---
  const addGame = useCallback(
    (game) => {
      const record = { id: uid('g'), date: new Date().toISOString(), ...game }
      setState((s) => ({ ...s, games: [...s.games, record], activeGame: null }))
      push((h) => cloud.upsertGame(h, record))
      return record
    },
    [push],
  )

  const deleteGame = useCallback(
    (id) => {
      setState((s) => ({ ...s, games: s.games.filter((g) => g.id !== id) }))
      push((h) => cloud.deleteGameRow(h, id))
    },
    [push],
  )

  const resetStats = useCallback(() => {
    setState((s) => ({ ...s, games: [], activeGame: null }))
    push((h) => cloud.deleteAllGames(h))
  }, [push])

  // --- settings (per-device, never synced) ---
  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  // --- active game draft (per-device) ---
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
    const players = structuredClone(DEFAULT_PLAYERS)
    setState({
      players,
      games: [],
      activeGame: null,
      settings: { soundEnabled: true, theme: 'jewel' },
      version: 1,
    })
    push(async (h) => {
      await cloud.deleteHouseData(h)
      await cloud.upsertPlayers(h, players)
    })
  }, [push])

  // --- house code (shared backend) management ---
  const setHouse = useCallback((code) => {
    const c = (code || '').trim()
    if (c) localStorage.setItem(HOUSE_KEY, c)
    else localStorage.removeItem(HOUSE_KEY)
    setHouseState(c)
  }, [])

  const leaveHouse = useCallback(() => {
    localStorage.removeItem(HOUSE_KEY)
    setHouseState('')
    setConnection('local')
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
    // cloud
    house,
    connection,
    setHouse,
    leaveHouse,
    cloudEnabled: cloud.cloudConfigured,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
