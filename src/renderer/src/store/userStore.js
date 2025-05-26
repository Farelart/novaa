import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const API_BASE_URL = 'http://localhost:3001/api'; // change ça selon ton backend

const useUserStore = create(
  devtools(
    (set, get) => ({
      user: null,
      users: [],
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      fetchUser: async (userId = 1) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`http://localhost:3001/api/users/${userId}`);
          if (!res.ok) throw await res.json();
          const data = await res.json();
          set({ user: data, loading: false });
          return data;
        } catch (err) {
          const errorMessage = err.error || err.message || 'Erreur inconnue';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`http://localhost:3001/api/users`);
          if (!res.ok) throw await res.json();
          const data = await res.json();
          set({ users: data, loading: false });
          return data;
        } catch (err) {
          const errorMessage = err.error || err.message || 'Erreur inconnue';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      createUser: async (userData) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`http://localhost:3001/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          if (!res.ok) throw await res.json();
          const newUser = await res.json();
          set((state) => ({
            users: [...state.users, newUser],
            user: newUser,
            loading: false,
          }));
          return newUser;
        } catch (err) {
          const errorMessage = err.error || err.message || 'Erreur lors de la création';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      updateUser: async (userId = 1, updateData) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`http://localhost:3001/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });
          if (!res.ok) throw await res.json();
          const updatedUser = await res.json();
          set((state) => ({
            users: state.users.map((user) =>
              user.id === userId ? updatedUser : user
            ),
            user: state.user?.id === userId ? updatedUser : state.user,
            loading: false,
          }));
          return updatedUser;
        } catch (err) {
          const errorMessage = err.error || err.message || 'Erreur lors de la mise à jour';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      deleteUser: async (userId = 1) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`http://localhost:3001/api/users/${userId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw await res.json();
          set((state) => ({
            users: state.users.filter((user) => user.id !== userId),
            user: state.user?.id === userId ? null : state.user,
            loading: false,
          }));
          return true;
        } catch (err) {
          const errorMessage = err.error || err.message || 'Erreur lors de la suppression';
          set({ error: errorMessage, loading: false });
          throw err;
        }
      },

      updateProfile: async (updateData) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Aucun utilisateur connecté' });
          return;
        }
        return get().updateUser(user.id, updateData);
      },

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

      updateUserPlan: async (planId) => {
        const { user } = get();
        if (!user) {
          set({ error: 'Aucun utilisateur connecté' });
          return;
        }
        return get().updateUser(user.id, { planId });
      },

      clearUser: () => set({ user: null }),
      clearUsers: () => set({ users: [] }),
      setCurrentUser: (user) => set({ user }),
      getUserById: (userId) => {
        const { users } = get();
        return users.find((user) => user.id === userId) || null;
      },
      hasFreePlan: () => {
        const { user } = get();
        return user?.plan?.name === 'Free';
      },
      isUsageLimitReached: () => {
        const { user } = get();
        if (!user?.plan) return false;
        return user.plan.used_limit >= user.plan.limit;
      },
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