// ---------------------------------------------------------------------------
// Supabase data layer for the shared backend.
//
// Every row is namespaced by `house` — a hash of the shared passphrase. Two
// devices that enter the same code see the same data. The raw passphrase is
// never stored remotely; only its hash is used as the namespace.
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js'

export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = cloudConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null

// Stable namespace from a passphrase (FNV-1a 32-bit). Casual collision-free.
export function houseId(passphrase) {
  const s = (passphrase || '').trim().toLowerCase()
  if (!s) return null
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return 'h_' + (h >>> 0).toString(16).padStart(8, '0')
}

const rowToPlayer = (r) => ({ id: r.id, name: r.name, color: r.color })
const rowToGame = (r) => ({
  id: r.id,
  type: r.type,
  date: r.date,
  players: r.players || [],
  scores: r.scores || {},
  winner: r.winner ?? null,
  metadata: r.metadata || {},
})

export async function fetchAll(house) {
  const [{ data: pl, error: pe }, { data: gm, error: ge }] = await Promise.all([
    supabase.from('gn_players').select('*').eq('house', house).order('sort', { ascending: true }),
    supabase.from('gn_games').select('*').eq('house', house).order('date', { ascending: true }),
  ])
  if (pe) throw pe
  if (ge) throw ge
  return { players: (pl || []).map(rowToPlayer), games: (gm || []).map(rowToGame) }
}

export async function upsertPlayers(house, players) {
  const rows = players.map((p, i) => ({
    id: p.id,
    house,
    name: p.name,
    color: p.color,
    sort: i,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('gn_players').upsert(rows)
  if (error) throw error
}

export async function deletePlayerRow(house, id) {
  const { error } = await supabase.from('gn_players').delete().eq('house', house).eq('id', id)
  if (error) throw error
}

export async function upsertGame(house, game) {
  const { error } = await supabase.from('gn_games').upsert({
    id: game.id,
    house,
    type: game.type,
    date: game.date,
    players: game.players,
    scores: game.scores,
    winner: game.winner ?? null,
    metadata: game.metadata ?? {},
  })
  if (error) throw error
}

export async function upsertGames(house, games) {
  if (!games.length) return
  const rows = games.map((g) => ({
    id: g.id,
    house,
    type: g.type,
    date: g.date,
    players: g.players,
    scores: g.scores,
    winner: g.winner ?? null,
    metadata: g.metadata ?? {},
  }))
  const { error } = await supabase.from('gn_games').upsert(rows)
  if (error) throw error
}

export async function deleteGameRow(house, id) {
  const { error } = await supabase.from('gn_games').delete().eq('house', house).eq('id', id)
  if (error) throw error
}

export async function deleteAllGames(house) {
  const { error } = await supabase.from('gn_games').delete().eq('house', house)
  if (error) throw error
}

export async function deleteHouseData(house) {
  await supabase.from('gn_games').delete().eq('house', house)
  await supabase.from('gn_players').delete().eq('house', house)
}

// Subscribe to remote changes for a house. Returns an unsubscribe fn.
export function subscribe(house, onChange) {
  const channel = supabase
    .channel(`gn_${house}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_games', filter: `house=eq.${house}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_players', filter: `house=eq.${house}` }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
