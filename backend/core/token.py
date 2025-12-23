import tiktoken
import logging
from typing import List
from backend.domain.models import Message, ContextFrame

logger = logging.getLogger(__name__)

class TokenManager:
    def __init__(self, model_name: str = "gpt-3.5-turbo"):
        self.model_name = model_name
        try:
            self.encoder = tiktoken.encoding_for_model(model_name)
        except KeyError:
            logger.warning(f"Model {model_name} not found in tiktoken, using cl100k_base")
            self.encoder = tiktoken.get_encoding("cl100k_base")

    def count_string(self, text: str) -> int:
        if not text:
            return 0
        return len(self.encoder.encode(text))

    def count_message(self, message: Message) -> int:
        # Approximate format: <|start|>{role}\n{content}<|end|>\n
        # This varies by model but +4 tokens is a safe standard heuristic for ChatML
        return 4 + self.count_string(message.role) + self.count_string(message.content)

    def count_messages(self, messages: List[Message]) -> int:
        return sum(self.count_message(m) for m in messages)

    def trim_context(self, frame: ContextFrame, max_tokens: int) -> ContextFrame:
        """
        Trims the ContextFrame to fit within max_tokens.
        Strategy:
        1. Reserve tokens for System, Character, User Input (High Priority).
        2. Reserve tokens for Active Lore (Medium Priority).
        3. Fill remaining space with History (reverse chronological).
        """
        
        # 1. Calculate base cost (High Priority)
        # System + Character + User Input + Scenario
        base_msgs = frame.system_prompts + frame.character_definition + frame.scenario
        if frame.user_input:
            base_msgs.append(frame.user_input)
            
        base_cost = self.count_messages(base_msgs)
        
        remaining_budget = max_tokens - base_cost
        
        if remaining_budget < 0:
            logger.warning("Base context exceeds token limit! Truncating non-essential base parts.")
            # Extreme case: Remove scenario, then shorten char def?
            # For now, just return as is and let the model error or cut off.
            return frame

        # 2. Add Lore (Medium Priority)
        # We assume active_lore is already sorted by relevance
        kept_lore = []
        for lore_msg in frame.active_lore:
            cost = self.count_message(lore_msg)
            if remaining_budget >= cost:
                kept_lore.append(lore_msg)
                remaining_budget -= cost
            else:
                break # Stop adding lore if full
        
        frame.active_lore = kept_lore

        # 3. Add History (Low Priority, Newest First)
        # History is usually chronological [Old -> New]. We want to keep New.
        reversed_history = list(reversed(frame.history))
        kept_history = []
        
        for msg in reversed_history:
            cost = self.count_message(msg)
            if remaining_budget >= cost:
                kept_history.append(msg)
                remaining_budget -= cost
            else:
                break
        
        # Restore chronological order
        frame.history = list(reversed(kept_history))
        
        return frame
