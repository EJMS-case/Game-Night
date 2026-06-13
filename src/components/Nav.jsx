import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  play: 'M8 5v14l11-7z',
  history: 'M12 8v4l3 2M3 12a9 9 0 1 0 9-9 9 9 0 0 0-8.5 6M3 4v4h4',
  rules: 'M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM14 3v5h5M8 13h8M8 17h5',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 8 1.1V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 14.6 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1A1.6 1.6 0 0 0 22.9 9H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
}

function TabIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  )
}

function Tab({ to, name, label, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wider no-tap-highlight transition-colors ${
          isActive ? 'text-gold' : 'text-ivory-dim/70 hover:text-ivory'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-gold shadow-gold-glow" />}
          <span className="relative">
            <TabIcon name={name} />
            {badge && (
              <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 animate-pulse-glow rounded-full bg-gold ring-2 ring-charcoal-card" />
            )}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Nav() {
  const { activeGame } = useApp()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-charcoal-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-2xl items-stretch px-2">
        <Tab to="/" name="home" label="Home" end />
        <Tab to="/game" name="play" label="Game" badge={!!activeGame} />
        <Tab to="/history" name="history" label="History" />
        <Tab to="/rules" name="rules" label="Rules" />
        <Tab to="/settings" name="settings" label="Settings" />
      </div>
    </nav>
  )
}
