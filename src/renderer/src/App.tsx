/* eslint-disable prettier/prettier */
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'
import Chat from './pages/ChatPage'
import { Settings } from './pages/Settings'
import { AISettings } from './pages/settings/AISettings'
import { AboutSettings } from './pages/settings/AboutSettings'
import { AccountSettings } from './pages/settings/AccountSettings'
import { ExtensionsSettings } from './pages/settings/ExtensionsSettings'
import { GeneralSettings } from './pages/settings/GeneralSettings'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/settings" element={<Settings />}>
          {/* Default route for settings */}
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<GeneralSettings />} />
          <Route path="extensions" element={<ExtensionsSettings />} />
          <Route path="ai" element={<AISettings />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="about" element={<AboutSettings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
