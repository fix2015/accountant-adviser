from datetime import datetime

from pydantic import BaseModel

from app.modules.chat.models import MessageRole


class ChatRequest(BaseModel):
    message: str
    agent: str = "tax"  # "tax", "compliance", "growth"


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


class HealthScoreResponse(BaseModel):
    overall: int
    tax_efficiency: int
    expense_optimization: int
    compliance_risk: int
    recommendations: list[str]


class ScenarioRequest(BaseModel):
    revenue: int = 50000
    expenses: int = 15000
    employees: int = 0
    salary: int = 12570
    dividends: int = 0
    pension_contribution: int = 0


class ScenarioResponse(BaseModel):
    income_tax: int
    national_insurance: int
    corporation_tax: int
    dividend_tax: int
    total_tax: int
    take_home: int
    effective_rate: float
    suggestions: list[str]


class PlannerAction(BaseModel):
    title: str
    description: str
    deadline: str
    priority: str = "medium"


class PlannerMonth(BaseModel):
    month: str
    actions: list[PlannerAction]


class PlannerResponse(BaseModel):
    months: list[PlannerMonth]


class NewsArticle(BaseModel):
    title: str
    date: str
    summary: str
    impact: str = "medium"
    category: str = "general"


class NewsResponse(BaseModel):
    articles: list[NewsArticle]
