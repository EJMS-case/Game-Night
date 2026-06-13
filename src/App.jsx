import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'
import Rules from './pages/Rules.jsx'
import Settings from './pages/Settings.jsx'
import HistoricalEntry from './pages/HistoricalEntry.jsx'
import NewGame from './pages/NewGame.jsx'
import ActiveGame from './pages/ActiveGame.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new/:type" element={<NewGame />} />
        <Route path="/game" element={<ActiveGame />} />
        <Route path="/history" element={<History />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/historical" element={<HistoricalEntry />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
