/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from 'react';
import { DeleteConfirmationDialog } from '../components/delete-confirmation-dialog';
import { useConversationStore, useMessageStore } from '../store';
import { useCurrentUser } from '../store/userStore';
import { formatRelativeTime } from '../utils/dateFormat';
type SidebarProps = {
  isVisible?: boolean
  userId: number // ID de l'utilisateur connecté
}


export const Sidebar = ({ isVisible = true, userId }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [toDeleteId, setToDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    user,
    loading: userLoading,
    error: userError,
    fetchUser,
    updateProfile,
    updatePreferences,
    hasFreePlan,
    getRemainingUsage,
  } = useCurrentUser();
  
  // Zustand store hooks
  const {
    conversations,
    currentConversation,
    loading,
    error,
    fetchConversations,
    setCurrentConversation,
    createConversation,
    deleteConversation,
    updateConversation
  } = useConversationStore()
  const { fetchMessages, messages, clearMessages } = useMessageStore()

  // Fetch conversations when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchUser()
      fetchConversations(userId)
      
    }
  }, [userId, fetchConversations])

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    
    return conversations.filter(conversation =>
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.messages?.some(msg => 
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [conversations, searchQuery])

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups: {
      today: typeof conversations,
      yesterday: typeof conversations,
      lastWeek: typeof conversations,
      older: typeof conversations
    } = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: []
    }

    filteredConversations.forEach(conversation => {
      const conversationDate = new Date(conversation.createdAt)
      const conversationDateOnly = new Date(
        conversationDate.getFullYear(),
        conversationDate.getMonth(),
        conversationDate.getDate()
      )

      if (conversationDateOnly.getTime() === today.getTime()) {
        groups.today.push(conversation)
      } else if (conversationDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conversation)
      } else if (conversationDate >= lastWeek) {
        groups.lastWeek.push(conversation)
      } else {
        groups.older.push(conversation)
      }
    })

    return groups
  }, [filteredConversations])

  // Get conversation snippet (first message content or default)
  const getConversationSnippet = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const firstMessage = conversation.messages.find(msg => msg.role === 'user')
      return firstMessage?.content?.substring(0, 50) + '...' || 'No messages yet...'
    }
    return 'Ask AI Anything...'
  }

  // Handle conversation selection
  const handleConversationSelect = async (conversation) => {
    try {
      setCurrentConversation(conversation)
      await fetchMessages(conversation.id)
    } catch (error) {
      console.error('Failed to fetch messages for conversation:', error)
    }
  }


  // Handle creating new conversation
  const handleNewChat = async () => {
    try {
      await createConversation(userId, 'New Chat')
      clearMessages()
      // fetchMessages(conv.id) // Fetch messages for the new conversation
    } catch (error) {
      console.error('Failed to create new conversation:', error)
    }
  }
  const handleConfirmDelete = async (toDeleteId) => {
    setIsDeleting(true)
    try {
      await deleteConversation(toDeleteId)
      if (currentConversation?.id === toDeleteId) {
        setCurrentConversation(null) // Clear current conversation if deleted
        clearMessages() // Clear messages in chat area
      }
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    } finally {
      setIsDeleting(false)
    }
  }
  // Handle conversation deletion
  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation() // Prevent conversation selection
    setToDeleteId(conversationId)
    setShowDeleteDialog(true)
  }

  const handleOpenSettings = () => {
    window.electron.ipcRenderer.send('open-settings-window')
  }

  // Render conversation group
  const renderConversationGroup = (conversations, groupTitle) => {
    if (conversations.length === 0) return null

    return (
      <div className="px-3 py-1" key={groupTitle}>
        <p className="text-xs text-gray-400 px-2 mb-1">{groupTitle}</p>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => handleConversationSelect(conversation)}
            className={`p-2 rounded hover:bg-white/10 cursor-pointer mb-1 group relative ${
              currentConversation?.id === conversation.id ? 'bg-white/5' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {conversation.title || 'Untitled Chat'}
                </h3>
                <p className="text-xs text-gray-300 truncate">
                  {formatRelativeTime(conversation.createdAt)}
                </p>
              </div>
              
              {/* Delete button - appears on hover */}
              <button
                onClick={(e) => handleDeleteConversation(e, conversation.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                title="Delete conversation"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside
      className={`flex flex-col bg-black/20 border-r border-white/10 transition-all duration-[850ms] ease-in-out ${
        isVisible
          ? 'w-1/3 min-w-56 max-w-80 opacity-100 translate-x-0'
          : 'w-0 opacity-0 -translate-x-full overflow-hidden'
      }`}
    >
      {/* Header with New Chat button */}
      <div className="p-3 border-b border-white/10">
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="w-full p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : '+ New Chat'}
        </button>
      </div>

      {/* Search and conversations list */}
      <div className="flex-grow overflow-y-auto space-y-2">
        <div className="mb-2 p-3">
          <input
            type="text"
            placeholder="Search Chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-black/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white/30 text-sm rounded"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-3 text-center">
            <p className="text-gray-400 text-sm">Loading conversations...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-3 text-center">
            <p className="text-red-400 text-sm">Error: {error}</p>
            <button
              onClick={() => fetchConversations(userId)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Conversations grouped by date */}
        {!loading && !error && (
          <>
            {renderConversationGroup(groupedConversations.today, 'Today')}
            {renderConversationGroup(groupedConversations.yesterday, 'Yesterday')}
            {renderConversationGroup(groupedConversations.lastWeek, 'Last Week')}
            {renderConversationGroup(groupedConversations.older, 'Older')}
            
            {/* Empty state */}
            {filteredConversations.length === 0 && !searchQuery && (
              <div className="p-3 text-center">
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-500 text-xs mt-1">Start a new chat to begin</p>
              </div>
            )}
            
            {/* No search results */}
            {filteredConversations.length === 0 && searchQuery && (
              <div className="p-3 text-center">
                <p className="text-gray-400 text-sm">No conversations found</p>
                <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </>
        )}
      </div>


      {/* Footer */}
      <footer className="p-3 border-t border-white/10">
        <div
          className="flex items-center space-x-2 p-2 rounded hover:bg-white/10 cursor-pointer"
          onClick={handleOpenSettings}
        >
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{user?.name=='none'? 'U' : user?.name.slice(0)}</span>
          </div>
          <div className="text-sm flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{user?.name=='none'? 'User' : user?.name}</p>
            <p className="text-gray-400 truncate">{user?.email=='none'? 'User' : user?.email}</p>
          </div>
        </div>
      </footer>


      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => handleConfirmDelete(toDeleteId)}
        isLoading={isDeleting}
        title="Delete Conversation"
        description={`Are you sure you want to delete ? This action cannot be undone.`}
      />
    </aside>

    
  )
}