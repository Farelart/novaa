import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
const useConversationStore = create(
  devtools(
    (set, get) => ({
      // State
      conversations: [],
      currentConversation: null,
      loading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Fetch conversations for a user
      fetchConversations: async (userId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`http://localhost:3001/api/chat/users/${userId}/conversations`);
          if (!response.ok) throw new Error('Failed to fetch conversations');
          const conversations = await response.json();
          set({ conversations, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Fetch conversation by ID
      fetchConversationById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`);
          if (!response.ok) throw new Error('Failed to fetch conversation');
          const conversation = await response.json();
          set({ currentConversation: conversation, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Create new conversation
      createConversation: async (userId, title) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('http://localhost:3001/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title }),
          });
          if (!response.ok) throw new Error('Failed to create conversation');
          const newConversation = await response.json();
          set((state) => ({
            conversations: [newConversation, ...state.conversations],
            currentConversation: newConversation,
            loading: false,
          }));
          set({ currentConversation: newConversation });
          return newConversation;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Ajout de la méthode updateConversation
      updateConversation: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update conversation');
          const updatedConversation = await response.json();

          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === id ? { ...conv, ...updatedConversation } : conv
            ),
            currentConversation:
              state.currentConversation?.id === id
                ? { ...state.currentConversation, ...updatedConversation }
                : state.currentConversation,
            loading: false,
          }));
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },


      // Delete conversation
      deleteConversation: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete conversation');
          
          set((state) => ({
            conversations: state.conversations.filter((conv) => conv.id !== id),
            currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
            loading: false,
          }));
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Set current conversation
      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

      // Clear current conversation
      clearCurrentConversation: () => set({ currentConversation: null }),
    }),
    { name: 'conversation-store' }
  )
);

export default useConversationStore;