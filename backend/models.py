from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class SessionCreate(BaseModel):
    title: str = "Percakapan Baru"

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    content: str
    message_type: str  # 'text' or 'image'

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    type: str  # 'user' or 'assistant'
    content: str
    content_type: Optional[str] = 'text'  # 'text' or 'image'
    prompt: Optional[str] = None  # for image generation
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SessionWithMessages(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []