export interface CanonicalCharacter {
  meta: {
    id: string;
    name: string;
    creator?: string;
    source?: string;
    avatar?: string;
    tags?: string[];
  };

  persona: {
    description?: string;
    personality?: string;
    scenario?: string;
    first_message?: string;
    alternate_greetings?: string[];
    example_dialogue?: string;
  };

  system: {
    system_prompt?: string;
    jailbreak?: string;
  };

  raw?: {
    original_format: 'v1' | 'v2' | 'json' | 'text';
    original_data: any;
  };
}

export interface TavernCardV1 {
  name: string;
  description: string;
  personality: string;
  first_mes: string;
  mes_example: string;
  scenario: string;
}

export interface TavernCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name: string;
    description: string;
    personality: string;
    first_mes: string;
    mes_example: string;
    scenario: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    tags?: string[];
    creator?: string;
    character_version?: string;
    alternate_greetings?: string[];
  };
}
