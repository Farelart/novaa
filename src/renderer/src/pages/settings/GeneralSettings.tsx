/* eslint-disable prettier/prettier */
export const GeneralSettings = () => (
  <div className="space-y-6 mx-auto max-w-md">
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
        <div className="flex items-center justify-between bg-white/5 p-3 rounded">
          <span>Open App</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl</kbd>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">+</kbd>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">N</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white/5 p-3 rounded">
          <span>Toggle Sidebar</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl</kbd>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">+</kbd>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">B</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white/5 p-3 rounded">
          <span>Open Settings</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl</kbd>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">+</kbd>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">K</kbd>
          </div>
        </div>
      </div>
    </div>
  </div>
)
