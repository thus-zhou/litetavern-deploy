import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface Character {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  systemPrompt: string;
  firstMessage?: string;
  
  // New Fields
  scenario?: string; // Current events / Situation
  personality?: string; // Detailed personality
  mesExample?: string; // Example dialogue
  tags?: string[]; // Categories
  creator?: string;
}

interface CharacterState {
  characters: Character[];
  activeCharacterId: string | null;
  
  addCharacter: (char: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setActiveCharacter: (id: string) => void;
  getActiveCharacter: () => Character | undefined;
}

const DEFAULT_CHARACTER: Character = {
  id: 'default',
  name: 'Assistant',
  description: 'A helpful AI assistant',
  systemPrompt: 'You are a helpful AI assistant.',
  firstMessage: 'Hello! How can I help you today?',
  tags: ['Assistant'],
  scenario: '',
  personality: ''
};

export const useCharacterStore = create<CharacterState>()(
  persist(
    immer((set, get) => ({
      characters: [DEFAULT_CHARACTER],
      activeCharacterId: 'default',

      addCharacter: (char) => set((state) => {
        state.characters.push(char);
      }),

      updateCharacter: (id, updates) => set((state) => {
        const index = state.characters.findIndex(c => c.id === id);
        if (index !== -1) {
          state.characters[index] = { ...state.characters[index], ...updates };
        }
      }),

      deleteCharacter: (id) => set((state) => {
        state.characters = state.characters.filter(c => c.id !== id);
        if (state.activeCharacterId === id) {
          state.activeCharacterId = state.characters[0]?.id || null;
        }
      }),

      setActiveCharacter: (id) => set({ activeCharacterId: id }),
      
      getActiveCharacter: () => {
        const { characters, activeCharacterId } = get();
        return characters.find(c => c.id === activeCharacterId);
      }
    })),
    {
      name: 'litetavern-characters',
    }
  )
)
