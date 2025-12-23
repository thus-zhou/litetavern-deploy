import { readPngChunks } from './pngReader';
import { parseTavernCard } from './parsers';
import type { CanonicalCharacter } from '../../types/character';

export async function importCharacter(file: File): Promise<CanonicalCharacter> {
  try {
    // 1. Try PNG Parsing
    if (file.type === 'image/png') {
      const rawText = await readPngChunks(file);
      if (rawText) {
        // Tavern cards are base64 encoded inside 'chara' chunk
        try {
          const jsonStr = atob(rawText);
          const json = JSON.parse(jsonStr);
          const char = parseTavernCard(json);
          if (char) {
            // Attach avatar blob
            const reader = new FileReader();
            return new Promise((resolve) => {
              reader.onload = (e) => {
                char.meta.avatar = e.target?.result as string;
                resolve(char);
              };
              reader.readAsDataURL(file);
            });
          }
        } catch (e) {
          console.error("Failed to decode/parse PNG chunk", e);
        }
      }
    }

    // 2. Try JSON Parsing
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const text = await file.text();
      const json = JSON.parse(text);
      const char = parseTavernCard(json);
      if (char) return char;
    }

    throw new Error("Unsupported format or invalid character card");
  } catch (err) {
    throw err;
  }
}
