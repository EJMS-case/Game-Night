# 🎲 Game Night

A premium, mobile-first dice-game tracker for **Yahtzee**, **Yahtzee Words**, **Farkle**, and
**Full Board Yahtzee**. Built for table-side play on a phone or tablet — every total
auto-calculates, and all data persists to the browser's local storage (no backend, no accounts).

Made for two primary players (Elyce & Mike) with room for up to six.

## ✨ Features

- **Dashboard** — head-to-head records, all-time wins per game type, current streaks, average
  scores, Full Board sweeps, and a recent-games log.
- **Yahtzee & Yahtzee Words** — full scorecards with live totals, auto upper bonus (+35), bonus
  Yahtzee counter (+100 each), per-player Yahtzee tally, round indicator, running winner, undo, and
  an animated winner announcement.
- **Full Board Yahtzee** — all 7 columns per player, per-column winners, columns-won tally, majority
  game winner, and the special **Full Board Sweep** achievement (winning all 7).
- **Farkle** — running totals, get-on-the-board (500) rule, hot-dice marker, bust handling, turn log,
  an always-available rules reference, and auto-win at 10,000.
- **Historical data entry** — backfill past games (including per-column Full Board scores); results
  feed every dashboard stat instantly.
- **Settings** — edit players & colors, add/remove players, toggle sounds, reset stats or everything.

## 🎨 Design

Rich dark jewel-tone theme — burgundy, forest green, antique gold, ivory on charcoal — with a felt
card-table grain overlay, Playfair Display headings, DM Sans body, gold accents, and celebratory
micro-animations.

## 🛠 Tech

React + Vite, Tailwind CSS, React Router (hash routing), Web Audio synthesized sound effects.
Local-first: all state lives in `localStorage` under the `game-night:v1` key and works fully
offline. An optional **shared backend** (Supabase) syncs players & game history across devices.

## 🔗 Shared sync (optional)

The app is local-first but can sync across devices. In **Settings → Sync** (or the Home prompt),
enter a secret **house code**. Every device that enters the same code shares one live game history
in real time. Settings like sound stay per-device.

- Data is stored in Supabase Postgres, namespaced by a hash of the house code.
- The publishable (client-safe) key ships in the bundle; the house code is the access gate, so
  treat it like a password. This is lightweight namespacing, not strong security.
- Tables: `gn_players`, `gn_games` (RLS enabled). Realtime keeps devices in sync.
- If the backend is unreachable or no code is set, the app keeps working purely from local storage.

## 🚀 Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## 🗂 Data model (localStorage)

```
players:    [{ id, name, color }]
games:      [{ id, type, date, players, scores, winner, metadata }]
activeGame: in-progress game draft (so a refresh never loses play)
settings:   { soundEnabled, theme }
```

Stats (wins, streaks, averages, head-to-head) are computed from `games` on every load.
