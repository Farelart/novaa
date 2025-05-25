/* eslint-disable prettier/prettier */

import { ChatArea } from '@renderer/components/ChatArea'
import { useEffect, useState } from 'react'
import { DraggableTopBar } from '../components/DraggableTopBar'
import { Sidebar } from '../components/Sidebar'
import { useUserStore } from '../store/userStore'
const Chat = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const { user, fetchUser, loading, error } = useUserStore()

  useEffect(() => {
    fetchUser()
  }, [])

  const handleToggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
  }

  const [message, setMessage] = useState('')
  // Exemple dans App.tsx ou un hook

  return (
    <div
      className="min-h-screen max-h-screen rounded-[10px] overflow-hidden bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.28)] flex flex-col"
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
