import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation
from app.modules.payments.services import increment_question_count
from app.modules.chat.models import MessageRole
from app.modules.chat.schemas import (
    ChatRequest,
    ChatResponse,
    MessageListResponse,
    StrategyReportRequest,
)
from app.modules.chat import services

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send", response_model=ChatResponse)
def send_message(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Check question limit
    if consultation.questions_used >= consultation.questions_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Question limit reached. Please purchase additional questions.",
        )

    assistant_message = services.chat_completion(
        db=db,
        consultation_id=consultation.id,
        user_id=current_user.id,
        user_message=data.message,
    )

    # Increment question count
    increment_question_count(db, consultation)

    return ChatResponse(
        message=assistant_message,
        questions_used=consultation.questions_used,
        questions_limit=consultation.questions_limit,
    )


@router.post("/send/stream")
def send_message_stream(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Check question limit
    if consultation.questions_used >= consultation.questions_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Question limit reached. Please purchase additional questions.",
        )

    def event_generator():
        for chunk in services.chat_completion_stream(
            db=db,
            consultation_id=consultation.id,
            user_id=current_user.id,
            user_message=data.message,
        ):
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        # Increment question count after streaming completes
        increment_question_count(db, consultation)

        yield f"data: {json.dumps({'done': True, 'questions_used': consultation.questions_used, 'questions_limit': consultation.questions_limit})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/history", response_model=MessageListResponse)
def get_chat_history(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    messages, total = services.get_consultation_messages(
        db, consultation.id, skip, limit
    )
    return MessageListResponse(messages=messages, total=total)


@router.get("/suggestions")
def get_suggestions(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Return contextual quick question suggestions based on conversation state."""
    messages, total = services.get_consultation_messages(db, consultation.id, 0, 100)

    # If no messages yet, return starter questions
    if total == 0:
        return {
            "suggestions": [
                "What's the most tax-efficient salary and dividend split for my company?",
                "What expenses can I claim to reduce my tax bill?",
                "Should I register for VAT? Show me the numbers",
                "Compare sole trader vs limited company for my income level",
                "What are my key tax deadlines and how much should I set aside?",
                "How can I use pension contributions to reduce my tax?",
            ]
        }

    # After conversation started, return follow-up questions
    last_messages = [
        m.content for m in messages[-3:] if m.role == MessageRole.ASSISTANT
    ]
    context = " ".join(last_messages)[:500]

    # Context-aware suggestions based on keywords
    suggestions = []

    if any(w in context.lower() for w in ["salary", "dividend", "director"]):
        suggestions.extend(
            [
                "Show me the exact monthly take-home for each strategy",
                "What if my company profit is £80,000 instead?",
                "How do employer pension contributions affect the numbers?",
            ]
        )
    if any(w in context.lower() for w in ["vat", "threshold", "registration"]):
        suggestions.extend(
            [
                "Compare flat rate VAT scheme vs standard VAT for my business",
                "When exactly should I register based on my revenue?",
            ]
        )
    if any(w in context.lower() for w in ["expense", "deduction", "claim"]):
        suggestions.extend(
            [
                "What home office expenses can I claim with exact amounts?",
                "Show me the capital allowance calculation for equipment",
            ]
        )
    if any(w in context.lower() for w in ["corporation tax", "company", "limited"]):
        suggestions.extend(
            [
                "How does marginal relief work between £50k-£250k profit?",
                "What's the R&D tax credit calculation for my company?",
            ]
        )

    # Always add some universal follow-ups
    suggestions.extend(
        [
            "Summarise all strategies with a comparison table",
            "What should I do before the end of the tax year?",
            "How much tax would I save with a £40k pension contribution?",
        ]
    )

    # Deduplicate and limit
    seen = set()
    unique = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return {"suggestions": unique[:6]}


@router.post("/report")
def generate_report(
    data: StrategyReportRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Disable PDF report for trial users
    if getattr(consultation, "is_trial", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PDF strategy reports are not available on the free trial. Upgrade to full consultation for £10.",
        )

    pdf_bytes = services.generate_strategy_report_pdf(db, consultation.id, data.title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="strategy_report.pdf"'},
    )
