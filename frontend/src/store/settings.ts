import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface SettingsState {
  // apiKey: string; // Removed for ordinary users
  // apiUrl: string; // Removed for ordinary users
  model: string; // This is now the Model ID (Database ID)
  theme: 'dark' | 'light';
  language: 'en' | 'zh';
  fontFamily: string;
  jailbreak: boolean;
  globalLore?: string; 
  availableModels: any[]; // Changed to objects
  
  setModel: (model: string) => void;
  setLanguage: (lang: 'en' | 'zh') => void;
  setFontFamily: (font: string) => void;
  setJailbreak: (enabled: boolean) => void;
  setGlobalLore: (lore: string) => void;
  setAvailableModels: (models: any[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      // apiKey: "",
      // apiUrl: "",
      model: "1", // Default to ID 1
      theme: 'dark',
      language: 'zh', // Forced default to Chinese
      fontFamily: "Inter, system-ui, sans-serif",
      jailbreak: false,
      globalLore: "",
      availableModels: [],

      setModel: (model: string) => set({ model: model }),
      setLanguage: (lang: 'en' | 'zh') => set({ language: lang }),
      setFontFamily: (font: string) => set({ fontFamily: font }),
      setJailbreak: (enabled: boolean) => set({ jailbreak: enabled }),
      setGlobalLore: (lore: string) => set({ globalLore: lore }),
      setAvailableModels: (models: any[]) => set({ availableModels: models }),
    })),
    {
      name: 'litetavern-settings',
      partialize: (state) => ({ 
        model: state.model,
        language: state.language,
        fontFamily: state.fontFamily,
        jailbreak: state.jailbreak,
        globalLore: state.globalLore
      }),
    }
  )
)
