import json

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation, ConsultationStatus
from app.modules.payments.services import increment_question_count
from app.modules.chat.models import Message, MessageRole
from app.modules.chat.schemas import (
    ChatRequest,
    ChatResponse,
    MessageListResponse,
    StrategyReportRequest,
    HealthScoreResponse,
    ScenarioRequest,
    ScenarioResponse,
    PlannerResponse,
    NewsResponse,
    NewsArticle,
)
from app.modules.chat import services
from app.modules.notifications.email_service import send_consultation_summary

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send", response_model=ChatResponse)
@limiter.limit("20/minute")
def send_message(
    request: Request,
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
        agent=data.agent,
    )

    # Increment question count
    increment_question_count(db, consultation)

    return ChatResponse(
        message=assistant_message,
        questions_used=consultation.questions_used,
        questions_limit=consultation.questions_limit,
    )


@router.post("/send/stream")
@limiter.limit("20/minute")
def send_message_stream(
    request: Request,
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
            agent=data.agent,
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


@router.get("/briefing")
def get_accountant_briefing(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Generate a briefing document for a real accountant to review."""
    briefing = services.generate_accountant_briefing(db, consultation.id)
    return {"briefing": briefing}


@router.post("/scenario", response_model=ScenarioResponse)
@limiter.limit("10/minute")
def calculate_scenario(
    request: Request,
    data: ScenarioRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Run a 'What If' tax scenario calculation. Does NOT count as a question."""
    result = services.generate_scenario(
        db=db,
        consultation_id=consultation.id,
        scenario_data=data.model_dump(),
    )
    return ScenarioResponse(**result)


@router.get("/health-score", response_model=HealthScoreResponse)
@limiter.limit("5/minute")
def get_health_score(
    request: Request,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Analyze the knowledge base and return a business health score."""
    return services.generate_health_score(db, consultation.id)


@router.get("/planner", response_model=PlannerResponse)
def get_planner(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Generate a 12-month tax action plan based on the user's knowledge base."""
    return services.generate_planner(db, consultation.id)


@router.get("/news", response_model=NewsResponse)
def get_news():
    """Return curated UK tax news with key 2025/26 updates."""
    articles = [
        NewsArticle(
            title="Employer NIC increase to 15% from April 2025",
            date="2025-04-06",
            summary="Employer National Insurance contributions rise from 13.8% to 15%, with the threshold dropping from £9,100 to £5,000. This significantly increases employment costs for businesses with staff.",
            impact="high",
            category="National Insurance",
        ),
        NewsArticle(
            title="Making Tax Digital for Income Tax delayed to April 2026",
            date="2025-03-01",
            summary="HMRC has delayed mandatory Making Tax Digital for Income Tax Self Assessment (MTD ITSA) to April 2026 for taxpayers with income over £50,000. Those with income over £30,000 will join from April 2027.",
            impact="high",
            category="Compliance",
        ),
        NewsArticle(
            title="Dividend allowance reduced to £500",
            date="2025-04-06",
            summary="The tax-free dividend allowance has been cut from £1,000 to £500 for 2025/26. Director-shareholders should review their salary/dividend split strategy to minimise the impact.",
            impact="high",
            category="Dividends",
        ),
        NewsArticle(
            title="Corporation tax small profits rate remains 19%",
            date="2025-04-06",
            summary="Companies with profits under £50,000 continue to pay corporation tax at 19%. The main rate of 25% applies to profits over £250,000, with marginal relief available between £50,000 and £250,000.",
            impact="medium",
            category="Corporation Tax",
        ),
        NewsArticle(
            title="National Living Wage increases to £12.21",
            date="2025-04-01",
            summary="The National Living Wage for workers aged 21 and over rises to £12.21 per hour from April 2025. Employers must update payroll systems and budget for increased staff costs.",
            impact="medium",
            category="Employment",
        ),
        NewsArticle(
            title="R&D tax relief merged scheme from April 2024",
            date="2024-04-01",
            summary="The merged R&D tax relief scheme replaces the previous SME and RDEC schemes. The new scheme offers a single above-the-line credit of 20% for qualifying R&D expenditure.",
            impact="medium",
            category="R&D Tax Relief",
        ),
        NewsArticle(
            title="Capital gains tax rates increased for residential property",
            date="2024-10-30",
            summary="The lower rate of CGT on residential property disposals increased from 18% to 24%, and the higher rate from 28% to 32%. Basic rate CGT on other assets rose from 10% to 18%, and higher rate from 20% to 24%.",
            impact="high",
            category="Capital Gains Tax",
        ),
        NewsArticle(
            title="Self-Assessment deadline: 31 January 2027 for 2025/26",
            date="2025-04-06",
            summary="The online Self Assessment filing deadline for the 2025/26 tax year is 31 January 2027. Payment of any tax due, plus the first payment on account for 2026/27, is also due by this date.",
            impact="medium",
            category="Self Assessment",
        ),
    ]
    return NewsResponse(articles=articles)


@router.post("/finish")
def finish_consultation(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Mark consultation as completed and send email summary."""
    # Get assistant messages to extract strategies
    assistant_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation.id,
            Message.role == MessageRole.ASSISTANT,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Extract top strategy lines from AI messages
    strategies = []
    for msg in assistant_messages:
        for line in msg.content.split("\n"):
            stripped = line.strip()
            # Look for strategy-like lines (numbered items, bold recommendations, etc.)
            if stripped and any(
                stripped.startswith(p)
                for p in [
                    "Strategy",
                    "1.",
                    "2.",
                    "3.",
                    "4.",
                    "5.",
                    "- **",
                    "**Recommendation",
                    "I recommend",
                    "Based on your situation",
                ]
            ):
                # Clean markdown formatting
                clean = stripped.replace("**", "").replace("- ", "").strip()
                if len(clean) > 20 and clean not in strategies:
                    strategies.append(clean)
            if len(strategies) >= 5:
                break
        if len(strategies) >= 5:
            break

    # If no strategies found, use generic summary
    if not strategies:
        strategies = [
            "Review your salary and dividend split for optimal tax efficiency",
            "Ensure all allowable business expenses are claimed",
            "Consider pension contributions for additional tax relief",
            "Check your VAT registration threshold status",
            "Plan ahead for key tax deadlines",
        ]

    # Mark consultation as completed
    consultation.status = ConsultationStatus.COMPLETED
    db.commit()

    # Send email summary
    user_name = current_user.full_name or current_user.email.split("@")[0]
    send_consultation_summary(
        to_email=current_user.email,
        user_name=user_name,
        strategies=strategies,
    )

    return {"message": "Consultation finished. Summary sent to your email."}


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
