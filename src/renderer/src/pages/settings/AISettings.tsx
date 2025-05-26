/* eslint-disable prettier/prettier */
import { useState } from 'react'

export const AISettings = () => {
  const [enabled, setEnabled] = useState(false)
  const messagesLeft = 32
  const usagePercentage = 36

  return (
    <div className="space-y-6 mx-auto max-w-md text-center">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16L4 8l1.41-1.41L12 13.17l6.59-6.58L20 8l-8 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">novaa AI</h2>
        <p className="text-gray-400">
          Let your computer do the work.
          <br />
          novaa finds what you need across your apps and gets the task done instantly.
        </p>
      </div>

      {/* <div className="flex justify-center">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={`${enabled ? 'bg-blue-600' : 'bg-gray-600'}
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          <span className="sr-only">Enable AI</span>
          <span
            className={`${enabled ? 'translate-x-6' : 'translate-x-1'}
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div> */}

      <div className="bg-white/5 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span>Try AI</span>
          <div className="flex items-center space-x-4">
            <span>{messagesLeft} Messages Left</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">{usagePercentage}% Used</span>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      <div className="bg-green-900/20 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-green-500 text-xs px-2 py-1 rounded font-medium">Pro</span>
          <span className="text-sm">Upgrade for unlimited messages</span>
        </div>
        <button className="text-sm hover:text-green-500 transition-colors">
          Start a 14-day free trial →
        </button>
      </div>
    </div>
  )
}
