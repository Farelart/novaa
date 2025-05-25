/* eslint-disable prettier/prettier */
'use client'

import { ChevronDown, Info, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store'

import models from '../utils/models'

export const ChatArea = () => {
  // Local states
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Store states & actions
  const { isProcessing, error, chatConfig, updateChatConfig, handleChatMessage, clearError } =
    useChatStore()

  // Local config states
  const [selectedModel, setSelectedModel] = useState(chatConfig.model)
  const [creativity, setCreativity] = useState('Medium')
  const [systemInstructions, setSystemInstructions] = useState('')

  // Sync local config with store
  useEffect(() => {
    updateChatConfig({
      model: selectedModel,
      temperature: creativity === 'Low' ? 0.3 : creativity === 'Medium' ? 0.7 : 1,
      systemInstructions
    })
  }, [selectedModel, creativity, systemInstructions, updateChatConfig])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const togglePopup = () => setIsPopupVisible(!isPopupVisible)

  // Envoi message au backend via le store
  const sendMessage = async () => {
    if (!inputMessage.trim()) return
    clearError()

    const userMessage = inputMessage.trim()
    setMessages((prev) => [...prev, { from: 'user', text: userMessage }])
    setInputMessage('')

    try {
      const reply = await handleChatMessage(1, userMessage)
      setMessages((prev) => [...prev, { from: 'bot', text: reply }])
    } catch (err) {
      // erreur gérée par le store (error)
      console.error(err)
    }
  }

  // Envoi message à l'appui de la touche Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <section className="flex-1 flex flex-col h-full p-4 overflow-hidden transition-all duration-[850ms] ease-in-out">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 space-y-4 p-2 rounded-md"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`p-3 rounded-md max-w-lg ${msg.from === 'user' ? 'bg-red-500/60 text-white' : 'text-white'}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start text-gray-400 italic">AI is typing...</div>
        )}
        {error && <div className="text-red-400 font-semibold">Error: {error}</div>}
      </div>

      {/* Input & Settings */}
      <div className="mt-4 relative">
        <div className="flex items-center p-1 bg-black/20 rounded-2xl">
          <div className="relative">
            <button
              onClick={togglePopup}
              className="p-2 text-gray-400 hover:text-white focus:outline-none transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            {/* Popup Settings */}
            {isPopupVisible && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-black/50 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 z-50">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Settings</h3>
                    <button onClick={togglePopup} className="text-white hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Model</label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 appearance-none pr-8"
                      >
                        {models.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.displayName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
                    </div>
                  </div>

                  {/* System Instructions */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">System Instructions</label>
                    <textarea
                      value={systemInstructions}
                      onChange={(e) => setSystemInstructions(e.target.value)}
                      placeholder="Pass additional instructions to the AI, for example to change the tone or format output"
                      className="w-full p-2 border border-gray-300 rounded-md text-gray-900 text-sm resize-none h-20"
                    />
                  </div>

                  {/* Creativity */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white">Creativity</label>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="relative">
                      <select
                        value={creativity}
                        onChange={(e) => setCreativity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 appearance-none pr-8"
                      >
                        <option value="Low">≡ Low</option>
                        <option value="Medium">≡ Medium</option>
                        <option value="High">≡ High</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Add other settings if needed */}
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-3 bg-transparent text-white placeholder-gray-400 focus:outline-none rounded-md border border-transparent"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />
        </div>

        {/* Model name display */}
        <div className="mt-2 px-3">
          <span className="text-xs text-white">Using model: {selectedModel}</span>
        </div>
      </div>

      {/* Overlay to close popup */}
      {isPopupVisible && <div className="fixed inset-0 z-40" onClick={togglePopup} />}
    </section>
  )
}
