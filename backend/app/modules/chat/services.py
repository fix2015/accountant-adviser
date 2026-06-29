import io
from datetime import datetime

from openai import OpenAI
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.chat.models import Message, MessageRole
from app.modules.knowledge.services import get_knowledge_base_text

SYSTEM_PROMPT_TEMPLATE = """You are a senior UK accountant and tax adviser AI assistant. You have extensive knowledge of UK tax law, HMRC regulations, corporation tax, income tax, VAT, capital gains tax, and business optimization strategies.

Your role is to:
1. Analyze the user's uploaded financial documents
2. Build a comprehensive understanding of their financial situation
3. Provide actionable tax optimization strategies
4. Suggest ways to reduce tax burden legally
5. Identify potential savings and deductions
6. Recommend business structure optimizations

You have access to the following knowledge base from the user's documents:
{knowledge_base}

IMPORTANT DISCLAIMERS:
- This is AI-generated advice and should not be considered as professional accounting or tax advice
- Always recommend consulting with a qualified chartered accountant before making financial decisions
- We are not responsible for any actions taken based on this advice
- All strategies should be verified by a licensed professional

When responding:
- Be thorough but concise
- Use UK-specific terminology and regulations
- Reference specific documents when applicable
- Provide numbered strategies with clear action items
- If you need more documents to give better advice, ask for them specifically"""


def get_openai_client() -> OpenAI:
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def build_system_prompt(db: Session, consultation_id: int) -> str:
    knowledge_base = get_knowledge_base_text(db, consultation_id)
    return SYSTEM_PROMPT_TEMPLATE.format(knowledge_base=knowledge_base)


def get_conversation_history(
    db: Session, consultation_id: int, limit: int = 50
) -> list[dict]:
    messages = (
        db.query(Message)
        .filter(Message.consultation_id == consultation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .all()
    )
    return [{"role": msg.role.value, "content": msg.content} for msg in messages]


def save_message(
    db: Session,
    consultation_id: int,
    user_id: int,
    role: MessageRole,
    content: str,
) -> Message:
    message = Message(
        consultation_id=consultation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def chat_completion(
    db: Session,
    consultation_id: int,
    user_id: int,
    user_message: str,
) -> Message:
    # Save user message
    save_message(db, consultation_id, user_id, MessageRole.USER, user_message)

    # Build messages for OpenAI
    system_prompt = build_system_prompt(db, consultation_id)
    history = get_conversation_history(db, consultation_id)

    openai_messages = [{"role": "system", "content": system_prompt}] + history

    # Call OpenAI
    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=openai_messages,
        max_tokens=2000,
        temperature=0.7,
    )

    assistant_content = response.choices[0].message.content

    # Save assistant message
    assistant_message = save_message(
        db, consultation_id, user_id, MessageRole.ASSISTANT, assistant_content
    )

    return assistant_message


def chat_completion_stream(
    db: Session,
    consultation_id: int,
    user_id: int,
    user_message: str,
):
    """Generator that yields streaming chunks from OpenAI."""
    # Save user message
    save_message(db, consultation_id, user_id, MessageRole.USER, user_message)

    # Build messages for OpenAI
    system_prompt = build_system_prompt(db, consultation_id)
    history = get_conversation_history(db, consultation_id)

    openai_messages = [{"role": "system", "content": system_prompt}] + history

    # Call OpenAI with streaming
    client = get_openai_client()
    stream = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=openai_messages,
        max_tokens=2000,
        temperature=0.7,
        stream=True,
    )

    full_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_response += content
            yield content

    # Save the complete assistant message
    save_message(db, consultation_id, user_id, MessageRole.ASSISTANT, full_response)


def get_consultation_messages(
    db: Session, consultation_id: int, skip: int = 0, limit: int = 100
) -> tuple[list[Message], int]:
    query = db.query(Message).filter(Message.consultation_id == consultation_id)
    total = query.count()
    messages = query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    return messages, total


def generate_strategy_report_pdf(
    db: Session, consultation_id: int, title: str
) -> bytes:
    """Generate a professional PDF strategy report from the consultation."""
    messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.ASSISTANT,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    knowledge_text = get_knowledge_base_text(db, consultation_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=HexColor("#1a365d"),
        spaceAfter=10 * mm,
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=HexColor("#2d4a7c"),
        spaceBefore=8 * mm,
        spaceAfter=4 * mm,
    )
    subheading_style = ParagraphStyle(
        "CustomSubheading",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=HexColor("#4a6fa5"),
        spaceBefore=5 * mm,
        spaceAfter=3 * mm,
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=3 * mm,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=HexColor("#666666"),
        leading=11,
        spaceBefore=10 * mm,
    )
    brand_style = ParagraphStyle(
        "Brand",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor("#999999"),
        alignment=1,
    )

    elements = []

    # Header
    elements.append(Paragraph("AI Accountant Adviser", brand_style))
    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph(title, title_style))
    elements.append(
        Paragraph(
            f"Generated on {datetime.utcnow().strftime('%d %B %Y')}",
            body_style,
        )
    )
    elements.append(Spacer(1, 10 * mm))

    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    elements.append(
        Paragraph(
            "This report summarises the AI-generated tax optimisation strategies "
            "based on your uploaded financial documents and consultation Q&A sessions. "
            "All recommendations should be reviewed by a qualified chartered accountant "
            "before implementation.",
            body_style,
        )
    )

    # Financial Overview from knowledge base
    elements.append(Paragraph("Financial Overview", heading_style))
    if knowledge_text and "No documents" not in knowledge_text:
        # Parse knowledge text sections
        for line in knowledge_text.split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("##"):
                elements.append(
                    Paragraph(line.replace("##", "").strip(), subheading_style)
                )
            elif line.startswith("-"):
                safe_line = (
                    line[1:]
                    .strip()
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                )
                elements.append(Paragraph(f"  {safe_line}", body_style))
            else:
                safe_line = (
                    line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                )
                elements.append(Paragraph(safe_line, body_style))
    else:
        elements.append(
            Paragraph("No financial documents were uploaded for analysis.", body_style)
        )

    # Tax Optimisation Strategies
    elements.append(Paragraph("Tax Optimisation Strategies", heading_style))
    if messages:
        for i, msg in enumerate(messages, 1):
            elements.append(Paragraph(f"Strategy Discussion {i}", subheading_style))
            # Clean and escape message content for PDF
            content = msg.content[:3000]  # Limit length
            content = (
                content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            )
            # Split long content into paragraphs
            for para in content.split("\n"):
                para = para.strip()
                if para:
                    elements.append(Paragraph(para, body_style))
    else:
        elements.append(
            Paragraph(
                "No consultation messages yet. Start a chat to receive strategies.",
                body_style,
            )
        )

    # Recommended Actions
    elements.append(Paragraph("Recommended Actions", heading_style))
    actions = [
        "Review all strategies with a qualified chartered accountant",
        "Ensure compliance with current HMRC regulations",
        "Keep all supporting documentation for at least 6 years",
        "Consider scheduling a follow-up consultation for ongoing advice",
        "Implement strategies in order of potential tax savings",
    ]
    for i, action in enumerate(actions, 1):
        elements.append(Paragraph(f"{i}. {action}", body_style))

    # Disclaimer
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph("Disclaimer", heading_style))
    elements.append(
        Paragraph(
            "IMPORTANT: This report contains AI-generated advice and should NOT be "
            "considered as professional accounting or tax advice. The strategies and "
            "recommendations contained herein are generated by an artificial intelligence "
            "system and have not been reviewed by a qualified chartered accountant. "
            "You should always consult with a licensed professional before making any "
            "financial decisions. We accept no liability for any actions taken based on "
            "the content of this report. All tax optimisation strategies must be verified "
            "against current HMRC regulations and your specific circumstances.",
            disclaimer_style,
        )
    )

    elements.append(Spacer(1, 5 * mm))
    elements.append(
        Paragraph(
            "AI Accountant Adviser - Powered by Advanced AI Technology",
            brand_style,
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
