/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react' // Import useState and useEffect

export const GeneralSettings = () => {
  // State to hold the current hotkey, defaulting to 'Ctrl+N'
  // In a real app, you'd fetch this from user settings/backend
  const [openAppHotkey, setOpenAppHotkey] = useState('Ctrl+N')
  const [toggleSidebarHotkey, setToggleSidebarHotkey] = useState('Ctrl+B') // Added state for sidebar hotkey
  const [openSettingsHotkey, setOpenSettingsHotkey] = useState('Ctrl+K') // Added state for settings hotkey

  const [recordingHotkeyFor, setRecordingHotkeyFor] = useState<string | null>(null) // To track which hotkey is being recorded

  // Placeholder for saving the hotkey
  const saveHotkey = (hotkeyType: string, newHotkey: string) => {
    console.log('Hotkey saved:', hotkeyType, newHotkey)
    window.electron.ipcRenderer.send('update-hotkey', hotkeyType, newHotkey)
    setRecordingHotkeyFor(null)
    // You might want to add some user feedback here (e.g., a toast notification)
  }

  const handleRecordClick = (hotkeyType: string) => {
    setRecordingHotkeyFor(hotkeyType)
    if (hotkeyType === 'open-app') setOpenAppHotkey('')
    if (hotkeyType === 'toggle-sidebar') setToggleSidebarHotkey('')
    if (hotkeyType === 'open-settings') setOpenSettingsHotkey('')
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!recordingHotkeyFor) return

      event.preventDefault()
      const keys: string[] = []
      if (event.ctrlKey) keys.push('Ctrl')
      if (event.altKey) keys.push('Alt')
      if (event.shiftKey) keys.push('Shift')
      if (event.metaKey) keys.push('Meta')

      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(event.key.toUpperCase())
      }

      const newHotkey = keys.join('+')
      if (recordingHotkeyFor === 'open-app') setOpenAppHotkey(newHotkey)
      if (recordingHotkeyFor === 'toggle-sidebar') setToggleSidebarHotkey(newHotkey)
      if (recordingHotkeyFor === 'open-settings') setOpenSettingsHotkey(newHotkey)
    }

    if (recordingHotkeyFor) {
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.removeEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [recordingHotkeyFor])

  const renderHotkeyControl = (hotkeyType: string, currentHotkey: string, displayLabel: string) => {
    const isRecordingThis = recordingHotkeyFor === hotkeyType
    return (
      <div className="flex items-center justify-between bg-white/5 p-3 rounded">
        <span>{displayLabel}</span>
        {isRecordingThis ? (
          <input
            type="text"
            value={currentHotkey}
            readOnly
            placeholder="Press keys..."
            className="bg-white/20 outline-none rounded px-2 py-1 text-center w-32"
            onBlur={() => setRecordingHotkeyFor(null)} // Stop recording on blur
          />
        ) : (
          <button
            onClick={() => handleRecordClick(hotkeyType)}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-sm w-32 text-center"
          >
            {currentHotkey || 'Click to set'}
          </button>
        )}
        {isRecordingThis && (
          <button
            onClick={() => saveHotkey(hotkeyType, currentHotkey)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm ml-2"
          >
            Save
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 mx-auto max-w-md">
      {/* ... existing code ... */}
      <div className="flex items-center justify-between ">
        <span>Theme</span>
        <select className="bg-white/10 outline-none rounded px-2 py-1">
          <option className="text-gray-900">System</option>
          <option className="text-gray-900">Light</option>
          <option className="text-gray-900">Dark</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span>Language</span>
        <select className="bg-white/10 outline-none rounded px-2 py-1">
          <option className="text-gray-900">English</option>
          <option className="text-gray-900">Spanish</option>
          <option className="text-gray-900">French</option>
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Hotkeys</h3>
        <div className="space-y-2">
          {renderHotkeyControl('open-app', openAppHotkey, 'Open App')}
          {renderHotkeyControl('toggle-sidebar', toggleSidebarHotkey, 'Toggle Sidebar')}
          {renderHotkeyControl('open-settings', openSettingsHotkey, 'Open Settings')}
        </div>
      </div>
    </div>
  )
}
