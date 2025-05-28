/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react' // Import useEffect and useState
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'
import Chat from './pages/ChatPage'
import { Settings } from './pages/Settings'
import { AISettings } from './pages/settings/AISettings'
import { AboutSettings } from './pages/settings/AboutSettings'
import { AccountSettings } from './pages/settings/AccountSettings'
import { ExtensionsSettings } from './pages/settings/ExtensionsSettings'
import { GeneralSettings } from './pages/settings/GeneralSettings'

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // State for sidebar visibility

  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsSidebarOpen((prev) => !prev)
      console.log('Sidebar toggled, new state:', !isSidebarOpen)
      // In a real app, you would update the UI based on this state
    }

    const cleanup = window.electron.ipcRenderer.on('toggle-sidebar', handleToggleSidebar)

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [isSidebarOpen]) // Rerun effect if isSidebarOpen changes, to ensure console log is correct

  return (
    <Router>
      {/* You might want to pass isSidebarOpen to Chat or a layout component */}
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
