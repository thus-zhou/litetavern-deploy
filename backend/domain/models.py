from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class Message(BaseModel):
    role: str
    content: str
    name: Optional[str] = None
    # Extra fields for internal use
    token_count: Optional[int] = None
    source: Optional[str] = None  # e.g., 'system', 'lore', 'history'

class LoreEntry(BaseModel):
    key: List[str]
    content: str
    enabled: bool = True
    priority: int = 10

class ContextFrame(BaseModel):
    """
    The heart of the Context Engine.
    Represents what the AI 'sees' in a structured way before compilation.
    """
    system_prompts: List[Message] = Field(default_factory=list)
    character_definition: List[Message] = Field(default_factory=list)
    active_lore: List[Message] = Field(default_factory=list)
    scenario: List[Message] = Field(default_factory=list)
    history: List[Message] = Field(default_factory=list)
    user_input: Optional[Message] = None
    
    # Metadata
    max_tokens: int = 2000
    model_name: str = "gpt-3.5-turbo"

class ChatRequest(BaseModel):
    """
    Incoming request from the frontend (OpenAI-compatible + extras).
    """
    messages: List[Message]
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.8
    max_tokens: int = 2000
    presence_penalty: float = 0.0
    frequency_penalty: float = 0.0
    stream: bool = False
    
    # LiteTavern Extras (Optional, if frontend sends them separately)
    # Ideally, frontend sends everything in 'messages' or we parse from it.
    # But if we want to separate 'lore' logic to backend, we might receive raw inputs.
    # For Phase 1 Proxy Mode, we assume 'messages' contains history + system.
    # But to use ContextEngine properly, we might need to extract them.
    
class ChatResponseChoice(BaseModel):
    index: int
    message: Message
    finish_reason: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatResponseChoice]
    usage: Optional[Dict[str, int]] = None
