import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../lib/axios'; // ← import de l'axios configuré

export const useUserStore = create(
  devtools(
    (set, get) => ({
      // State
      user: null,
      users: [], // Pour stocker la liste des utilisateurs
      loading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Fetch single user by ID
      fetchUser: async (userId=1) => {
        set({ loading: true, error: null });
        try {
          const response = await api.get(`/users/${userId}`);
          set({ user: response.data, loading: false });
          return response.data;
        } catch (err) {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur inconnue';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      // Fetch all users
      fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get('/users');
          set({ users: response.data, loading: false });
          return response.data;
        } catch (err) {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur inconnue';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      // Create new user
      createUser: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/users', userData);
          const newUser = response.data;
          
          set((state) => ({
            users: [...state.users, newUser],
            user: newUser, // Set as current user if needed
            loading: false,
          }));
          
          return newUser;
        } catch (err) {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la création';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      // Update user
      updateUser: async (userId=1, updateData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.put(`/users/${userId}`, updateData);
          const updatedUser = response.data;
          
          set((state) => ({
            users: state.users.map(user => 
              user.id === userId ? updatedUser : user
            ),
            user: state.user?.id === userId ? updatedUser : state.user,
            loading: false,
          }));
          
          return updatedUser;
        } catch (err) {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la mise à jour';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      // Delete user
      deleteUser: async (userId=1) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/users/${userId}`);
          
          set((state) => ({
            users: state.users.filter(user => user.id !== userId),
            user: state.user?.id === userId ? null : state.user,
            loading: false,
          }));
          
          return true;
        } catch (err) {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la suppression';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      // Update user profile (partial update for current user)
      updateProfile: async (updateData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Aucun utilisateur connecté' });
          return;
        }
        
        return get().updateUser(user.id, updateData);
      },

      // Update user preferences (hotkey, appearance, defaultModel)
      updatePreferences: async (preferences) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Aucun utilisateur connecté' });
          return;
        }

        const validPreferences = {};
        if (preferences.hotkey !== undefined) validPreferences.hotkey = preferences.hotkey;
        if (preferences.appearance !== undefined) validPreferences.appearance = preferences.appearance;
        if (preferences.defaultModel !== undefined) validPreferences.defaultModel = preferences.defaultModel;

        return get().updateUser(user.id, validPreferences);
      },

      // Update user plan
      updateUserPlan: async (planId) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Aucun utilisateur connecté' });
          return;
        }

        return get().updateUser(user.id, { planId });
      },

      // Clear current user
      clearUser: () => set({ user: null }),

      // Clear all users
      clearUsers: () => set({ users: [] }),

      // Set current user (for login/auth)
      setCurrentUser: (user) => set({ user }),

      // Get user by ID from store (without API call)
      getUserById: (userId) => {
        const { users } = get();
        return users.find(user => user.id === userId) || null;
      },

      // Check if user has specific plan
      hasFreePlan: () => {
        const { user } = get();
        return user?.plan?.name === 'Free';
      },

      // Check usage limit
      isUsageLimitReached: () => {
        const { user } = get();
        if (!user?.plan) return false;
        return user.plan.used_limit >= user.plan.limit;
      },

      // Get remaining usage
      getRemainingUsage: () => {
        const { user } = get();
        if (!user?.plan) return 0;
        return Math.max(0, user.plan.limit - user.plan.used_limit);
      },
    }),
    { name: 'user-store' }
  )
);

// Hook personnalisé pour utiliser le store utilisateur avec des fonctions utilitaires
export const useCurrentUser = () => {
  const {
    user,
    loading,
    error,
    fetchUser,
    updateProfile,
    updatePreferences,
    updateUserPlan,
    clearUser,
    hasFreePlan,
    isUsageLimitReached,
    getRemainingUsage,
  } = useUserStore();

  return {
    user,
    loading,
    error,
    fetchUser,
    updateProfile,
    updatePreferences,
    updateUserPlan,
    clearUser,
    hasFreePlan,
    isUsageLimitReached,
    getRemainingUsage,
    // Raccourcis pour accéder aux propriétés utilisateur
    userName: user?.name,
    userEmail: user?.email,
    userPlan: user?.plan,
    userPreferences: {
      hotkey: user?.hotkey,
      appearance: user?.appearance,
      defaultModel: user?.defaultModel,
    },
  };
};

export default useUserStore;