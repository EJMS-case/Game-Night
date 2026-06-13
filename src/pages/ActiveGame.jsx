import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { EmptyState } from '../components/ui.jsx'
import { GAME_TYPES, GAME_META } from '../lib/constants.js'
import YahtzeeGame from '../games/YahtzeeGame.jsx'
import FullBoardYahtzee from '../games/FullBoardYahtzee.jsx'
import FarkleGame from '../games/FarkleGame.jsx'

export default function ActiveGame() {
  const { activeGame } = useApp()
  const navigate = useNavigate()

  if (!activeGame) {
    return (
      <div className="animate-fade-in">
        <PageHeader subtitle="Active Game" title="No game in progress" />
        <EmptyState
          icon="🎲"
          title="Nothing on the table"
          hint="Start a new game from the home screen and it’ll show up here."
        />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {Object.entries(GAME_META).map(([type, meta]) => (
            <button key={type} className="btn-ghost" onClick={() => navigate(`/new/${type}`)}>
              {meta.icon} {meta.short}
            </button>
          ))}
        </div>
      </div>
    )
  }

  switch (activeGame.type) {
    case GAME_TYPES.YAHTZEE:
    case GAME_TYPES.YAHTZEE_WORDS:
      return <YahtzeeGame key={activeGame.id} />
    case GAME_TYPES.FULL_BOARD:
      return <FullBoardYahtzee key={activeGame.id} />
    case GAME_TYPES.FARKLE:
      return <FarkleGame key={activeGame.id} />
    default:
      return null
  }
}
