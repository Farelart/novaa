import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useChatStore = create(
  devtools(
    (set, get) => ({
      // State
      isProcessing: false,
      error: null,
      chatConfig: {
        model: 'gemini-2.0-flash',
        baseURL: '',
        temperature: 0.7,
        max_token: 1000,
        instruction: '',
      },

      // Actions
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Update chat configuration
      updateChatConfig: (config) => set((state) => ({
        chatConfig: { ...state.chatConfig, ...config },
      })),

      // Handle chat message
      handleChatMessage: async (conversationId, userMessage, config = null) => {
        const { chatConfig } = get();
        const finalConfig = config || chatConfig;
        console.log('Final chat config:', finalConfig);
        
        set({ isProcessing: true, error: null });
        
        try {
          const response = await fetch('http://localhost:3001/api/chat/handle-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId,
              userMessage,
              ...finalConfig,
            }),
          });
          
          if (!response.ok) throw new Error('Failed to handle chat message');
          
          const data = await response.json();
          set({ isProcessing: false });
          return data.reply;
        } catch (error) {
          set({ error: error.message, isProcessing: false });
          throw error;
        }
      },
    }),
    { name: 'chat-store' }
  )
);

export default useChatStore;