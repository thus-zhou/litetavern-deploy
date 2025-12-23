import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Character, LoreEntry } from '../types'

interface DataState {
  characters: Character[];
  lorebooks: Record<string, LoreEntry[]>; // charId -> entries
  addCharacter: (char: Character) => void;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
}

export const useDataStore = create<DataState>()(
  immer((set: any) => ({
    characters: [] as Character[],
    lorebooks: {},
    addCharacter: (char: Character) => set((state: DataState) => {
      state.characters.push(char);
    }),
    updateCharacter: (id: string, patch: Partial<Character>) => set((state: DataState) => {
      const idx = state.characters.findIndex(c => c.id === id);
      if (idx !== -1) {
        Object.assign(state.characters[idx], patch);
      }
    }),
  }))
)
