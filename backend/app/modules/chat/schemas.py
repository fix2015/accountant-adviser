from datetime import datetime

from pydantic import BaseModel

from app.modules.chat.models import MessageRole


class ChatRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    id: int
    consultation_id: int
    user_id: int
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    message: MessageResponse
    questions_used: int
    questions_limit: int


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    total: int


class StrategyReportRequest(BaseModel):
    title: str = "Tax Optimization Strategy Report"
