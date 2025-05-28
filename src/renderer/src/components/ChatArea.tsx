/* eslint-disable prettier/prettier */
'use client'

import { ChevronDown, Info, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import ReactMarkdown from 'react-markdown'
import { useChatStore, useConversationStore, useMessageStore } from '../store'
import { useCurrentUser } from '../store/userStore'
import models from '../utils/models'

export const ChatArea = () => {
  // Local states
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<
    { id: string; from: 'user' | 'assistant'; text: string }[]
  >([])
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const [isWriting, setIsWriting] = useState(false)

  // Store states & actions
  const { isProcessing, error, chatConfig, updateChatConfig, handleChatMessage, clearError } =
    useChatStore()

  const {
    user,
    loading,
    error: userError,
    fetchUser,
    updateProfile,
    updatePreferences,
    hasFreePlan,
    getRemainingUsage
  } = useCurrentUser()

  const { fetchMessages, messages: msgs, deleteMessage } = useMessageStore()

  const {
    currentConversation,
    createConversation,
    setCurrentConversation,
    updateConversation,
    fetchConversations
  } = useConversationStore()

  // Local config states
  const [selectedModel, setSelectedModel] = useState(chatConfig.model)
  const [creativity, setCreativity] = useState('Medium')
  const [systemInstructions, setSystemInstructions] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const chatWindow = useRef<HTMLDivElement>(null)
  const prevConversationId = useRef<string | null>(null)

  // Sync local config with store
  useEffect(() => {
    fetchUser()
    updateChatConfig({
      model: currentConversation?.instruction || selectedModel,
      temperature: creativity === 'Low' ? 0.3 : creativity === 'Medium' ? 0.7 : 1,
      instruction: currentConversation?.instruction || systemInstructions
    })
    // if (inputRef.current) {
    //   inputRef.current.focus();
    // }
  }, [selectedModel, creativity, systemInstructions, updateChatConfig, fetchUser])

  // useEffect(() => {
  //   if (inputRef.current) {
  //     inputRef.current.focus();
  //   }
  // })

  useEffect(() => {
    if (inputRef.current && currentConversation?.id !== prevConversationId.current) {
      inputRef.current.focus()
      prevConversationId.current = currentConversation?.id ?? null
    }
    setSystemInstructions(currentConversation?.instruction || '')
    setSelectedModel(currentConversation?.model || user?.defaultModel || 'gemini-2.0-flash')
    setCreativity(
      currentConversation?.temperature === 0.3
        ? 'Low'
        : currentConversation?.temperature === 0.7
          ? 'Medium'
          : 'High'
    )

    updateChatConfig({
      model: currentConversation?.model || user?.defaultModel,
      temperature: currentConversation?.temperature || 0.7,
      instruction: currentConversation?.instruction || ''
    })
  }, [currentConversation])

  // 2. Met à jour le state local messages quand msgs du store change
  useEffect(() => {
    // fetchMessages(currentConversation?.id || '')
    setMessages(
      msgs.map((msg) => ({
        id: msg.id,
        from: msg.role === 'user' ? 'user' : 'assistant',
        text: msg.content || ''
      }))
    )
  }, [msgs])

  const togglePopup = () => setIsPopupVisible(!isPopupVisible)

  // Version alternative avec Promise pour un meilleur contrôle
  const simulateWordByWordStreamingWithFallback = (
    fullText: string,
    messageId: string,
    delay = 100,
    fallbackDelay = 3000 // Si inactive plus de 3s, affichage instantané
  ): Promise<void> => {
    return new Promise((resolve) => {
      const words = fullText.split(' ')
      let wordIndex = 0
      let intervalId: NodeJS.Timeout | null = null
      let fallbackTimeoutId: NodeJS.Timeout | null = null
      let isActive = !document.hidden
      
      const updateText = () => {
        wordIndex++
        const currentText = words.slice(0, wordIndex).join(' ')
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, text: currentText } : msg))
        )
        
        if (wordIndex >= words.length) {
          cleanup()
          resolve()
        }
      }
      
      const showFullText = () => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, text: fullText } : msg))
        )
        cleanup()
        resolve()
      }
      
      const cleanup = () => {
        if (intervalId) clearInterval(intervalId)
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      
      const handleVisibilityChange = () => {
        if (document.hidden) {
          isActive = false
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          // Programmer l'affichage instantané après le délai
          fallbackTimeoutId = setTimeout(showFullText, fallbackDelay)
        } else {
          isActive = true
          if (fallbackTimeoutId) {
            clearTimeout(fallbackTimeoutId)
            fallbackTimeoutId = null
          }
          if (wordIndex < words.length) {
            intervalId = setInterval(updateText, delay)
          }
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      if (isActive) {
        intervalId = setInterval(updateText, delay)
      } else {
        // Si déjà inactive au démarrage, afficher directement
        showFullText()
      }
    })
  }
  
  

  // Fonction sendMessage corrigée
  const sendMessage = async () => {
    if (!inputMessage.trim()) return
    clearError()

    const userMessage = inputMessage.trim()
    const tmpId = Date.now().toString() + Math.random().toString(36).substring(2, 15)
    const tmpAssistantId = tmpId + '_assistant'
    setMessages((prev) => [
      ...prev,
      { id: tmpId, from: 'user', text: userMessage },
      { id: tmpAssistantId, from: 'assistant', text: '' }
    ])
    setInputMessage('')
    try {
      let conv = currentConversation
      if (!conv) {
        conv = await createConversation(user.id, 'New Chat')
      }
      const reply = await handleChatMessage(conv?.id, userMessage)
      setIsWriting(true)
      await simulateWordByWordStreamingWithFallback(reply.content, tmpAssistantId)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tmpId
            ? { ...msg, id: reply.userMsgId }
            : msg.id === tmpAssistantId
              ? { ...msg, id: reply.assistantMsgId, text: reply.content }
              : msg
        )
      )

      // Met à jour le titre si c'est toujours "New Chat"
      if (!conv.title || conv.title === 'New Chat') {
        await updateConversation(conv?.id, { title: reply.content.slice(0, 50) })
      }
    } catch (err) {
      console.error(err)
      // En cas d'erreur, supprimer le message assistant vide
      setMessages((prev) => prev.filter((msg) => msg.id !== tmpAssistantId))
    } finally {
      // Remet le focus sur l'input
      inputRef.current?.focus()

      // Scroll automatique en bas
      setTimeout(() => {
        chatWindow.current?.scrollTo({
          top: chatWindow.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
      setIsWriting(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (chatWindow.current) {
        chatWindow.current.scrollTo({
          top: chatWindow.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 50) // ou même 0 si ça marche bien

    return () => clearTimeout(timeout)
  }, [messages])

  const updateSystemInstructions = (instructions: string) => {
    setSystemInstructions(instructions)
    updateChatConfig({ ...chatConfig, systemInstructions: instructions })
  }

  const updateModel = (model: string) => {
    if (currentConversation) {
      updateConversation(currentConversation?.id, { model })
    }
    setSelectedModel(model)
    updateChatConfig({ ...chatConfig, model })
  }
  const updateCreativity = (level: string) => {
    const temperature = level === 'Low' ? 0.3 : level === 'Medium' ? 0.7 : 1
    if (currentConversation) {
      updateConversation(currentConversation?.id, { temperature })
    }
    setCreativity(level)
    updateChatConfig({ ...chatConfig, temperature })
  }

  // Envoi message à l'appui de la touche Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <section className="flex-1 flex flex-col max-h-[95vh] p-4 overflow-hidden transition-all duration-[850ms] ease-in-out">
      {/* Messages */}
      <div
        ref={chatWindow}
        className="flex-1 max-h-screen overflow-y-auto overflow-x-hidden space-y-4 p-2 rounded-md"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="relative group ">
              <div
                className={`p-2 rounded-md max-w-[50vw] text-sm break-words whitespace-pre-wrap overflow-hidden ${msg.from === 'user' ? 'bg-white/15 text-white/60' : 'bg-white/25 text-white/80'}`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {/* Icônes qui apparaissent au hover */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2 bg-gray-800 rounded-md p-1 shadow-lg">
                {/* Copy */}
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(msg.text)
                    setCopiedMessageId(i)
                    setTimeout(() => setCopiedMessageId(null), 2000)
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors relative"
                  title="Copier"
                >
                  {copiedMessageId === i ? (
                    <svg
                      className="w-3 h-3 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    deleteMessage(msg.id)
                    fetchMessages(currentConversation?.id || '')
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                {/* Regenerate (seulement pour les messages de l'IA) */}
                {/* {msg.from !== 'user' && i === messages.length - 1 && (
                <button
                  onClick={() => {
                  // Your regeneration logic here
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-blue-400 transition-colors"
                  title="Régénérer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                )} */}
              </div>
            </div>
          </div>
        ))}
        {/* {isProcessing && (
        <div className="flex justify-start text-gray-400 italic">AI is typing...</div>
      )} */}
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
              <BsPlusCircle className="w-5 h-5" />
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
                        onChange={(e) => updateModel(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 appearance-none pr-8 text-sm"
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
                      onChange={(e) => updateSystemInstructions(e.target.value)}
                      onBlur={(e) => {
                        if (currentConversation) {
                          updateConversation(currentConversation.id, {
                            instruction: e.target.value
                          })
                        }
                      }}
                      placeholder="Pass additional instructions to the AI, for example to change the tone or format output"
                      className="w-full p-2 border border-gray-300 rounded-md text-gray-900 text-xs resize-none h-20"
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
                        onChange={(e) => updateCreativity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 appearance-none pr-8 text-sm"
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
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-3 bg-transparent text-white placeholder-gray-400 focus:outline-none rounded-md border border-transparent"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing || isWriting}
          />
        </div>

        {/* Model name display */}
        <div className="mt-2 px-3 hover:cursor-pointer" onClick={togglePopup}>
          <span className="text-xs text-white">Using model: {selectedModel}</span>
        </div>
      </div>

      {/* Overlay to close popup */}
      {isPopupVisible && <div className="fixed inset-0 z-40" onClick={togglePopup} />}
    </section>
  )
}
