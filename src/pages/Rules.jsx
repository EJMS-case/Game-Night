import { useState } from 'react'
import { PageHeader } from '../components/Layout.jsx'
import { FarkleRulesContent } from '../games/FarkleGame.jsx'
import {
  GAME_TYPES,
  GAME_META,
  YAHTZEE_UPPER,
  YAHTZEE_LOWER,
  YW_UPPER,
  YW_LOWER,
  UPPER_BONUS_THRESHOLD,
} from '../lib/constants.js'

const TABS = [GAME_TYPES.YAHTZEE, GAME_TYPES.YAHTZEE_WORDS, GAME_TYPES.FARKLE, GAME_TYPES.FULL_BOARD]

function CategoryTable({ title, rows }) {
  return (
    <div>
      <p className="label-caps mb-2">{title}</p>
      <div className="overflow-hidden rounded-xl border border-gold/15">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={i % 2 ? 'bg-charcoal/30' : ''}>
                <td className="px-3 py-1.5 text-ivory">{r.label}</td>
                <td className="px-3 py-1.5 text-right text-ivory-dim">
                  {r.fixed ? `${r.fixed} pts` : r.hint}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function YahtzeeRules() {
  return (
    <div className="space-y-4">
      <p className="text-ivory-dim">
        Thirteen categories, one game. Roll up to three times per turn and bank the result in a
        category. The upper section earns a <span className="text-gold">+35 bonus</span> when its total
        reaches {UPPER_BONUS_THRESHOLD}. Each extra Yahtzee after the first is worth{' '}
        <span className="text-gold">+100</span>.
      </p>
      <CategoryTable title="Upper Section" rows={YAHTZEE_UPPER} />
      <CategoryTable title="Lower Section" rows={YAHTZEE_LOWER} />
    </div>
  )
}

function WordsRules() {
  return (
    <div className="space-y-4">
      <p className="text-ivory-dim">
        Same shape as Yahtzee, but with lettered dice. Spell words to fill each category, entering the
        word and its face value. Upper section earns a <span className="text-gold">+35 bonus</span> at{' '}
        {UPPER_BONUS_THRESHOLD}. A Yahtzee Word (all five dice the same letter) is{' '}
        <span className="text-gold">50 pts</span>.
      </p>
      <CategoryTable title="Upper Section" rows={YW_UPPER} />
      <CategoryTable title="Lower Section" rows={YW_LOWER} />
    </div>
  )
}

function FullBoardRules() {
  return (
    <div className="space-y-4">
      <p className="text-ivory-dim">
        A marathon: every player fills <span className="text-gold">all 7 columns</span> of a standard
        Yahtzee card in one session.
      </p>
      <div className="space-y-2">
        {[
          { t: 'Column winners', b: 'Each column is won by the highest grand total in it.' },
          { t: 'Game winner', b: 'Take the majority of columns (4 or more of 7) to win the game.' },
          { t: 'Full Board Sweep', b: 'Win all 7 columns for the rare Full Board Sweep — tracked as a special achievement. 🏆' },
          { t: 'Scoring', b: 'Standard Yahtzee scoring applies in every column, bonuses included.' },
        ].map((n) => (
          <div key={n.t} className="rounded-xl border border-gold/15 bg-charcoal/30 p-3">
            <p className="font-semibold text-gold">{n.t}</p>
            <p className="text-sm text-ivory-dim">{n.b}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Rules() {
  const [tab, setTab] = useState(TABS[0])
  return (
    <div className="animate-fade-in">
      <PageHeader subtitle="How to play" title="Rules" />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? 'border-gold bg-gold/15 text-gold' : 'border-gold/20 text-ivory-dim hover:text-ivory'
            }`}
          >
            {GAME_META[t].icon} {GAME_META[t].short}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {tab === GAME_TYPES.YAHTZEE && <YahtzeeRules />}
        {tab === GAME_TYPES.YAHTZEE_WORDS && <WordsRules />}
        {tab === GAME_TYPES.FARKLE && <FarkleRulesContent />}
        {tab === GAME_TYPES.FULL_BOARD && <FullBoardRules />}
      </div>
    </div>
  )
}
