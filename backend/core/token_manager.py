import tiktoken
from typing import List, Dict, Any

class TokenManager:
    def __init__(self, model: str = "gpt-3.5-turbo"):
        self.model = model
        try:
            self.encoder = tiktoken.encoding_for_model(model)
        except KeyError:
            self.encoder = tiktoken.get_encoding("cl100k_base")

    def count_string(self, text: str) -> int:
        if not text:
            return 0
        return len(self.encoder.encode(text))

    def count_message(self, message: Dict[str, Any]) -> int:
        """
        Count tokens for a single message object.
        Approximation for OpenAI chat format.
        """
        num_tokens = 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
        for key, value in message.items():
            if key == "content":
                num_tokens += self.count_string(str(value))
            elif key == "role":
                num_tokens += self.count_string(str(value))
            elif key == "name":
                num_tokens += self.count_string(str(value))
                num_tokens += -1  # role is always required and does not count
        return num_tokens

    def count_messages(self, messages: List[Dict[str, Any]]) -> int:
        num_tokens = 0
        for msg in messages:
            num_tokens += self.count_message(msg)
        num_tokens += 3  # every reply is primed with <im_start>assistant
        return num_tokens
