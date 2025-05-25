import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useMessageStore = create(
  devtools(
    (set, get) => ({
      // State
      messages: [],
      loading: false,
      error: null,
      isTyping: false,

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setIsTyping: (isTyping) => set({ isTyping }),

      // Fetch messages for a conversation
      fetchMessages: async (conversationId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`http://localhost:3001/api/chat/conversations/${conversationId}/messages`);
          if (!response.ok) throw new Error('Failed to fetch messages');
          const messages = await response.json();
          console.log('Fetched messages:', messages);
          set({ messages:messages, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Create new message
      createMessage: async (messageData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('http://localhost:3001/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData),
          });
          if (!response.ok) throw new Error('Failed to create message');
          const newMessage = await response.json();
          
          set((state) => ({
            messages: [...state.messages, newMessage],
            loading: false,
          }));
          return newMessage;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Delete message
      deleteMessage: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`http://localhost:3001/api/chat/messages/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete message');
          
          set((state) => ({
            messages: state.messages.filter((msg) => msg.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Add message to store (for optimistic updates)
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),

      // Update message in store
      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map((msg) => 
          msg.id === id ? { ...msg, ...updates } : msg
        ),
      })),

      // Clear messages
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'message-store' }
  )
);

export default useMessageStore;