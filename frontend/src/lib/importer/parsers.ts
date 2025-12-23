import type { CanonicalCharacter, TavernCardV1, TavernCardV2 } from '../../types/character';

export function parseTavernCard(json: any): CanonicalCharacter | null {
  if (json.spec === 'chara_card_v2') {
    return parseV2(json as TavernCardV2);
  } else if (json.name && json.description) {
    return parseV1(json as TavernCardV1);
  }
  return null;
}

function parseV2(card: TavernCardV2): CanonicalCharacter {
  const data = card.data;
  return {
    meta: {
      id: Date.now().toString(),
      name: data.name,
      creator: data.creator,
      tags: data.tags,
    },
    persona: {
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      first_message: data.first_mes,
      alternate_greetings: data.alternate_greetings,
      example_dialogue: data.mes_example,
    },
    system: {
      system_prompt: data.system_prompt,
    },
    raw: {
      original_format: 'v2',
      original_data: card,
    },
  };
}

function parseV1(card: TavernCardV1): CanonicalCharacter {
  return {
    meta: {
      id: Date.now().toString(),
      name: card.name,
    },
    persona: {
      description: card.description,
      personality: card.personality,
      scenario: card.scenario,
      first_message: card.first_mes,
      example_dialogue: card.mes_example,
    },
    system: {},
    raw: {
      original_format: 'v1',
      original_data: card,
    },
  };
}
