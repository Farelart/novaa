"use client"

import { ChevronDown, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatStore, useConversationStore, useMessageStore } from "../store";
import { useCurrentUser } from '../store/userStore';

import models from "../utils/models";

export const ChatArea = () => {
  // Local states
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<{ from: "user" | "assistant"; text: string }[]>([])


  // Store states & actions
  const { isProcessing, error, chatConfig, updateChatConfig, handleChatMessage, clearError } = useChatStore()

  const {
    user,
    loading,
    error: userError,
    fetchUser,
    updateProfile,
    updatePreferences,
    hasFreePlan,
    getRemainingUsage,
  } = useCurrentUser();

  const { fetchMessages, messages: msgs } = useMessageStore()

  const { currentConversation, createConversation, setCurrentConversation, updateConversation,fetchConversations } = useConversationStore()

  // Local config states
  const [selectedModel, setSelectedModel] = useState(chatConfig.model)
  const [creativity, setCreativity] = useState("Medium")
  const [systemInstructions, setSystemInstructions] = useState("")
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindow = useRef<HTMLDivElement>(null)
  const prevConversationId = useRef<string | null>(null);
  // Sync local config with store
  useEffect(() => {
    fetchUser()
    updateChatConfig({
      model: currentConversation?.instruction || selectedModel,
      temperature: creativity === "Low" ? 0.3 : creativity === "Medium" ? 0.7 : 1,
      instruction: currentConversation?.instruction || systemInstructions,
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
    if (
      inputRef.current &&
      currentConversation?.id !== prevConversationId.current
    ) {
      inputRef.current.focus();
      prevConversationId.current = currentConversation?.id ?? null;
    }
    setSystemInstructions(currentConversation?.instruction || "")
    setSelectedModel(currentConversation?.model || user?.defaultModel || "gemini-2.0-flash")
    setCreativity(currentConversation?.temperature === 0.3 ? "Low" : currentConversation?.temperature === 0.7 ? "Medium" : "High")

    updateChatConfig({
      model: currentConversation?.model || user?.defaultModel,
      temperature: currentConversation?.temperature || 0.7,
      instruction: currentConversation?.instruction || "",
    })

  }, [currentConversation]);
  
  // 2. Met à jour le state local messages quand msgs du store change
  useEffect(() => {
    setMessages(
      msgs.map((msg) => ({
        from: msg.role === "user" ? "user" : "assistant",
        text: msg.content || "",
      }))
    )
  }, [msgs])
  


  const togglePopup = () => setIsPopupVisible(!isPopupVisible)


  // Envoi message au backend via le store
  const sendMessage = async () => {
    if (!inputMessage.trim()) return
    clearError()

    const userMessage = inputMessage.trim()
    setMessages((prev) => [...prev, { from: "user", text: userMessage }])
    setInputMessage("")

    try {
      if (!currentConversation) {
        const conv=await createConversation(user.id, 'New Chat')
        const reply = await handleChatMessage(conv?.id, userMessage)
        setMessages((prev) => [...prev, { from: "assistant", text: reply }])
        if( conv.title === 'New Chat' || !conv.title){
          await updateConversation(conv?.id,{title: reply.slice(0, 50)})
        }
        
      }
      else{
        const reply = await handleChatMessage(currentConversation?.id, userMessage)
        setMessages((prev) => [...prev, { from: "assistant", text: reply }])
        if( currentConversation.title === 'New Chat' || !currentConversation.title){
          await updateConversation(currentConversation?.id,{title: reply.slice(0, 50)})
        }
      }
      
    } catch (err) {
      // erreur gérée par le store (error)
      console.error(err)
    } finally {
      // Réinitialise le focus sur l'input après l'envoi
      if (inputRef.current) {
        inputRef.current.focus()
      }
      // Scroll vers le bas de la fenêtre de chat
      if (chatWindow.current) {
        chatWindow.current.scrollTo({
          top: chatWindow.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }

    
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (chatWindow.current) {
        chatWindow.current.scrollTo({
          top: chatWindow.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50); // ou même 0 si ça marche bien
  
    return () => clearTimeout(timeout);
  }, [messages]);
  
  const updateSystemInstructions = (instructions: string) => {
    
    if (currentConversation) {
      updateConversation(currentConversation?.id, { instruction: instructions })
    }
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
    const temperature = level === "Low" ? 0.3 : level === "Medium" ? 0.7 : 1
    if (currentConversation) {
      updateConversation(currentConversation?.id, { temperature })
    }
    setCreativity(level)
    updateChatConfig({ ...chatConfig, temperature })
  }

  // Envoi message à l'appui de la touche Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <section className="flex-1 flex flex-col max-h-[95vh] p-4 overflow-hidden transition-all duration-[850ms] ease-in-out">
      {/* Messages */}
      <div ref={chatWindow} className="flex-1 max-h-screen overflow-y-auto space-y-4 p-2 rounded-md">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-lg max-w-xs ${msg.from === "user" ? "bg-red-500/60 text-white" : "bg-gray-700 text-white"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start text-gray-400 italic">AI is typing...</div>
        )}
        {error && (
          <div className="text-red-400 font-semibold">Error: {error}</div>
        )}
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
