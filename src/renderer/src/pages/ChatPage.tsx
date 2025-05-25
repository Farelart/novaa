/* eslint-disable prettier/prettier */

import { ChatArea } from '@renderer/components/ChatArea'
import { useState } from 'react'
import { DraggableTopBar } from '../components/DraggableTopBar'
import { Sidebar } from '../components/Sidebar'
import { useConversationStore } from '../store'
const Chat = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const { currentConversation } = useConversationStore();
  

  const handleToggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
  }
  // Exemple dans App.tsx ou un hook

  return (
    <div
      className="min-h-screen rounded-[10px] overflow-hidden bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.28)] flex flex-col"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundClip: 'padding-box',
        boxSizing: 'border-box'
      }}
    >
      <DraggableTopBar onToggleSidebar={handleToggleSidebar} />
      <div className="flex flex-1 pt-8">
        <Sidebar userId={1} isVisible={isSidebarVisible} />
        <ChatArea />
      </div>
    </div>
  )
}

export default Chat
