import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCharacterStore } from './character'
import { useSettingsStore } from './settings'
import { useRuntimeStore } from './runtime'

interface User {
  id: number;
  username: string;
  is_admin: boolean;
  power_balance: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  
  login: (user: User) => void;
  updatePower: (newBalance: number) => void;
  logout: () => void;
  syncDown: () => Promise<void>;
  syncUp: () => Promise<void>;
  setError: (error: string | null) => void;
  error: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      error: null,

      setError: (error) => set({ error }),

      login: (user) => {
        set({ user, isAuthenticated: true, error: null });
        // Trigger initial pull
        get().syncDown();
      },

      updatePower: (newBalance) => {
          set((state) => {
              if (state.user) {
                  return { user: { ...state.user, power_balance: newBalance } };
              }
              return {};
          });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Ideally clear other stores or reset them to default
        window.location.reload(); // Simple way to clear state
      },

      syncDown: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Pull Characters
          const charRes = await fetch(`/api/sync/pull/${user.id}/characters`);
          const charData = await charRes.json();
          if (charData.content) {
            useCharacterStore.setState({ characters: charData.content.characters, activeCharacterId: charData.content.activeCharacterId });
          }

          // Pull Settings
          const setRes = await fetch(`/api/sync/pull/${user.id}/settings`);
          const setData = await setRes.json();
          if (setData.content) {
             // Merge carefully
             useSettingsStore.setState((state) => ({ ...state, ...setData.content }));
          }

          // Pull Runtime (History)
          const runRes = await fetch(`/api/sync/pull/${user.id}/runtime`);
          const runData = await runRes.json();
          if (runData.content) {
            useRuntimeStore.setState((state) => ({ ...state, ...runData.content }));
          }
        } catch (e) {
          console.error("Sync Failed", e);
        }
      },

      syncUp: async () => {
        const { user } = get();
        if (!user) return;
        
        // Push all stores
        const chars = useCharacterStore.getState();
        const settings = useSettingsStore.getState();
        const runtime = useRuntimeStore.getState(); // This contains messages

        // We only push relevant parts
        await fetch('/api/sync/push', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: user.id,
                data_type: 'characters',
                content: { characters: chars.characters, activeCharacterId: chars.activeCharacterId }
            })
        });

        await fetch('/api/sync/push', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: user.id,
                data_type: 'settings',
                content: { 
                    model: settings.model,
                    jailbreak: settings.jailbreak,
                    globalLore: settings.globalLore
                }
            })
        });

        await fetch('/api/sync/push', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: user.id,
                data_type: 'runtime',
                content: { messages: runtime.messages, activeCharacterId: runtime.activeCharacterId }
            })
        });
      }
    }),
    {
      name: 'litetavern-auth',
    }
  )
)

// Auto-Sync Hook
export const setupAutoSync = () => {
    // Subscribe to stores and debounce syncUp
    let timeout: any;
    const triggerSync = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            useAuthStore.getState().syncUp();
        }, 2000); // 2s debounce
    };

    useCharacterStore.subscribe(triggerSync);
    useSettingsStore.subscribe(triggerSync);
    useRuntimeStore.subscribe(triggerSync);
};
