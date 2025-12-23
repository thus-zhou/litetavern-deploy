from typing import List, Dict, Any
from backend.domain.models import ContextFrame, Message

class PromptCompiler:
    def compile(self, frame: ContextFrame) -> List[Dict[str, Any]]:
        """
        Compiles the ContextFrame into a flat list of messages for the LLM.
        Pipeline:
        1. System Prompts (Base)
        2. Character Definition
        3. Scenario / Room Rules
        4. Active Lore (Injected)
        5. History (Windowed)
        6. User Input
        """
        compiled_messages = []

        # Helper to convert Message obj to dict
        def add(msgs: List[Message]):
            for m in msgs:
                compiled_messages.append({
                    "role": m.role,
                    "content": m.content
                })

        # 1. Base System & Character
        # We merge these into the 'system' role usually, or keep separate if model supports it.
        # Standard OpenAI: Multiple system messages are allowed but usually one big one is better.
        # For now, let's keep them as separate messages to respect the structure.
        add(frame.system_prompts)
        add(frame.character_definition)
        
        # 2. Scenario
        add(frame.scenario)
        
        # 3. Active Lore
        # Lore is often injected as 'system' or 'user' depending on strategy.
        # We'll stick to 'system' for Lore to keep it authoritative.
        for lore in frame.active_lore:
            compiled_messages.append({
                "role": "system",
                "content": f"[Lore/Info]: {lore.content}"
            })
            
        # 4. History
        add(frame.history)
        
        # 5. User Input
        if frame.user_input:
            compiled_messages.append({
                "role": frame.user_input.role,
                "content": frame.user_input.content
            })
            
        return compiled_messages
