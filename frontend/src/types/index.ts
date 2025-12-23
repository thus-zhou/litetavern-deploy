export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
  model?: string;
}

export interface Character {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  scenario?: string;
  firstMessage?: string;
}

export interface LoreEntry {
  keys: string[];
  content: string;
  enabled: boolean;
}

export interface ChatSession {
  id: string;
  characterId: string;
  messages: Message[];
  created: number;
  updated: number;
}
