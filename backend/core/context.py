from typing import List, Dict, Any, Optional
from .token_manager import TokenManager

class ContextEngine:
    def __init__(self, token_manager: TokenManager):
        self.tm = token_manager

    def build_context(self, 
                      messages: List[Dict[str, Any]], 
                      max_context_tokens: int = 4000, 
                      system_prompt: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Smart Context Builder:
        1. Always keep System Prompt.
        2. Keep the most recent messages that fit in the budget.
        3. Drop old messages if necessary.
        """
        final_context = []
        current_tokens = 0

        # 1. Handle System Prompt
        if system_prompt:
            sys_msg = {"role": "system", "content": system_prompt}
            sys_tokens = self.tm.count_message(sys_msg)
            final_context.append(sys_msg)
            current_tokens += sys_tokens
        
        # Calculate remaining budget
        remaining_budget = max_context_tokens - current_tokens
        if remaining_budget <= 0:
            # Emergency: System prompt alone is too big? 
            # In reality, we might truncate system prompt, but let's assume it fits.
            return final_context

        # 2. Process History (Reverse Order)
        # We add messages from newest to oldest until budget is full
        history_to_keep = []
        # Filter out system messages from input messages to avoid duplication if frontend sent them
        user_history = [m for m in messages if m.get("role") != "system"]
        
        for msg in reversed(user_history):
            msg_tokens = self.tm.count_message(msg)
            if current_tokens + msg_tokens > max_context_tokens:
                break
            
            history_to_keep.append(msg)
            current_tokens += msg_tokens
        
        # 3. Reconstruct Order
        # history_to_keep is [newest, ..., oldest_that_fits]
        # We need [oldest_that_fits, ..., newest]
        final_context.extend(reversed(history_to_keep))

        return final_context

    def optimize(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        High-level entry point to optimize a chat completion request.
        """
        messages = request_data.get("messages", [])
        model = request_data.get("model", "gpt-3.5-turbo")
        
        # Heuristic: Reserve 1000 tokens for generation if not specified
        # OpenAI limit is usually 4096 or 16k or 128k. 
        # For safety, let's assume a "context window" target.
        # If user didn't specify, we default to a safe 4096 for 3.5.
        
        # But here we want to limit the *input* tokens.
        # Let's say we target 3000 input tokens max to leave room for reply.
        target_context_size = 3000 
        
        # Extract system prompt if it exists in messages (often the first one)
        system_prompt = None
        if messages and messages[0].get("role") == "system":
            system_prompt = messages[0].get("content")
            messages = messages[1:] # Remove it from list to avoid duplication logic

        return self.build_context(messages, target_context_size, system_prompt)
