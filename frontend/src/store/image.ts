import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface ImageSettingsState {
  enabled: boolean;
  useSameKey: boolean;
  apiKey: string;
  apiUrl: string;
  model: string;
  size: string;
  quality: 'standard' | 'hd';
  
  setEnabled: (v: boolean) => void;
  setUseSameKey: (v: boolean) => void;
  setApiKey: (v: string) => void;
  setApiUrl: (v: string) => void;
  setModel: (v: string) => void;
  setSize: (v: string) => void;
  setQuality: (v: 'standard' | 'hd') => void;
}

export const useImageStore = create<ImageSettingsState>()(
  persist(
    immer((set) => ({
      enabled: false,
      useSameKey: true,
      apiKey: "",
      apiUrl: "https://api.openai.com/v1/images/generations",
      model: "dall-e-3",
      size: "1024x1024",
      quality: "standard",

      setEnabled: (v) => set({ enabled: v }),
      setUseSameKey: (v) => set({ useSameKey: v }),
      setApiKey: (v) => set({ apiKey: v }),
      setApiUrl: (v) => set({ apiUrl: v }),
      setModel: (v) => set({ model: v }),
      setSize: (v) => set({ size: v }),
      setQuality: (v) => set({ quality: v }),
    })),
    {
      name: 'litetavern-image-settings',
    }
  )
)
