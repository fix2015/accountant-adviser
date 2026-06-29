import io
import re
import time
from datetime import datetime

from openai import OpenAI
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.chat.models import Message, MessageRole
from app.modules.knowledge.services import get_knowledge_base_text

# Simple in-memory cache for expensive AI calls
_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 3600  # 1 hour


def get_cached(key: str) -> dict | None:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
        del _cache[key]
    return None


def set_cached(key: str, data: dict):
    _cache[key] = (time.time(), data)


def clear_cache(prefix: str = ""):
    keys_to_remove = [k for k in _cache if k.startswith(prefix)]
    for k in keys_to_remove:
        del _cache[k]


SYSTEM_PROMPT_TEMPLATE = """You are a senior UK accountant and tax adviser AI assistant with 20+ years of experience. You have extensive knowledge of UK tax law, HMRC regulations, corporation tax, income tax, VAT, capital gains tax, and business optimization strategies.

Your role is to:
1. Analyze the user's uploaded financial documents
2. Build a comprehensive understanding of their financial situation
3. Provide actionable tax optimization strategies with SPECIFIC NUMBERS
4. Suggest ways to reduce tax burden legally
5. Identify potential savings and deductions
6. Recommend business structure optimizations

You have access to the following knowledge base from the user's documents:
{knowledge_base}

CRITICAL FORMATTING RULES — the user is NOT an accountant, so you MUST:

1. **Always include specific £ amounts and dates** — never give vague advice. Show exact salary amounts, dividend amounts, tax savings, deadlines. For example: "Set your salary at £12,570/year (£1,047.50/month)" not just "set salary at the personal allowance level".

2. **Present 2-3 different strategies as options** — label them clearly (e.g., "Strategy A: Conservative", "Strategy B: Optimised", "Strategy C: Aggressive") with a comparison table or side-by-side showing:
   - Salary amount per year and per month
   - Dividend amount
   - Total income tax paid
   - Total NIC paid
   - Corporation tax impact
   - NET take-home amount
   - Total tax savings vs the other strategies

3. **Use the current tax year rates** (2025/26 or 2026/27):
   - Personal Allowance: £12,570
   - Basic rate: 20% (£12,571–£50,270)
   - Higher rate: 40% (£50,271–£125,140)
   - Employee NIC: 8% above £12,570
   - Employer NIC: 13.8% above £9,100 (15% from April 2025)
   - Dividend allowance: £500 (2025/26)
   - Dividend basic rate: 8.75%
   - Corporation tax: 25% (profits over £250k), 19% (under £50k), marginal relief between

4. **Show worked calculations** — e.g., "Salary: £12,570 → Income tax: £0 → Employee NIC: £0 → Employer NIC: £479 → Corp tax saving: £12,570 × 19% = £2,388"

5. **Include key dates and deadlines** — e.g., "Corporation tax payment due: 9 months + 1 day after year end", "Self Assessment deadline: 31 January 2027"

6. **End every response with a clear recommendation** — "Based on your situation, I recommend Strategy B because..."

7. **ALWAYS end with 3 suggested follow-up questions** — After your answer, add a section:
   ---
   **💡 You might also want to ask:**
   1. [A specific follow-up question that digs deeper into the topic you just discussed]
   2. [A related question about a different tax area that connects to their situation]
   3. [A practical "what should I do next" question to help them take action]

   Make these questions specific to the user's documents and situation, not generic. Include £ amounts or dates where relevant.

IMPORTANT DISCLAIMERS (include briefly at the end, not at the start):
- This is AI-generated advice — verify with a chartered accountant before acting
- Tax rules change — always check current HMRC guidance
- Your specific circumstances may affect these calculations"""

COMPLIANCE_AGENT_PROMPT = """You are a UK tax compliance specialist AI. Focus on:
- HMRC compliance requirements and deadlines
- Filing obligations (Self Assessment, Corporation Tax, VAT returns)
- Making Tax Digital requirements
- Penalties and interest for late filing/payment
- Record keeping requirements
- Compliance risk assessment
- IR35 status determination
Always include specific dates, deadlines, and penalty amounts.

You have access to the following knowledge base from the user's documents:
{knowledge_base}

CRITICAL FORMATTING RULES — the user is NOT an accountant, so you MUST:

1. **Always include specific £ amounts and dates** — never give vague advice. Show exact penalty amounts, deadlines, and interest rates. For example: "Late filing penalty: £100 immediately, then £10/day after 3 months" not just "there are penalties for late filing".

2. **Present compliance items as a prioritised checklist** — label them clearly (e.g., "URGENT", "UPCOMING", "ROUTINE") with:
   - Exact deadline date
   - What needs to be filed/paid
   - Penalty for missing the deadline
   - Steps to complete

3. **Use the current tax year rates** (2025/26 or 2026/27):
   - Personal Allowance: £12,570
   - Basic rate: 20% (£12,571–£50,270)
   - Higher rate: 40% (£50,271–£125,140)
   - Employee NIC: 8% above £12,570
   - Employer NIC: 13.8% above £9,100 (15% from April 2025)
   - Dividend allowance: £500 (2025/26)
   - Dividend basic rate: 8.75%
   - Corporation tax: 25% (profits over £250k), 19% (under £50k), marginal relief between

4. **Show worked calculations** — e.g., "Late payment interest: £5,000 × 7.75% × 30/365 = £31.85"

5. **Include key dates and deadlines** — e.g., "Self Assessment deadline: 31 January 2027", "Corporation Tax: 9 months + 1 day after year end"

6. **End every response with a clear compliance action plan** — "To stay compliant, you should..."

7. **ALWAYS end with 3 suggested follow-up questions** — After your answer, add a section:
   ---
   **💡 You might also want to ask:**
   1. [A specific compliance follow-up question]
   2. [A related deadline or filing question]
   3. [A practical "what should I do next" question]

IMPORTANT DISCLAIMERS (include briefly at the end, not at the start):
- This is AI-generated advice — verify with a chartered accountant before acting
- Tax rules change — always check current HMRC guidance
- Your specific circumstances may affect these calculations"""

GROWTH_AGENT_PROMPT = """You are a UK business growth strategist AI. Focus on:
- Business structure optimization (sole trader vs ltd vs LLP)
- Scaling strategies and their tax implications
- R&D tax credits and innovation funding
- Capital allowances and investment relief
- Employee incentive schemes (EMI, CSOP)
- International expansion tax considerations
- Funding and investment tax implications
Always include specific £ amounts and ROI calculations.

You have access to the following knowledge base from the user's documents:
{knowledge_base}

CRITICAL FORMATTING RULES — the user is NOT an accountant, so you MUST:

1. **Always include specific £ amounts and dates** — never give vague advice. Show exact savings, ROI calculations, and growth projections. For example: "R&D tax credit: £50,000 qualifying spend × 26% = £13,000 cash back" not just "you may qualify for R&D credits".

2. **Present 2-3 growth strategies as options** — label them clearly (e.g., "Strategy A: Organic Growth", "Strategy B: Investment-Led", "Strategy C: Acquisition") with:
   - Initial investment required
   - Expected ROI and timeline
   - Tax implications and savings
   - Risk assessment

3. **Use the current tax year rates** (2025/26 or 2026/27):
   - Personal Allowance: £12,570
   - Basic rate: 20% (£12,571–£50,270)
   - Higher rate: 40% (£50,271–£125,140)
   - Employee NIC: 8% above £12,570
   - Employer NIC: 13.8% above £9,100 (15% from April 2025)
   - Dividend allowance: £500 (2025/26)
   - Dividend basic rate: 8.75%
   - Corporation tax: 25% (profits over £250k), 19% (under £50k), marginal relief between

4. **Show worked calculations** — e.g., "EMI scheme: £50,000 option value × 0% income tax at exercise = £20,000 saved vs unapproved options"

5. **Include key dates and deadlines** — e.g., "R&D claim deadline: 2 years from end of accounting period"

6. **End every response with a clear recommendation** — "For maximum growth with tax efficiency, I recommend..."

7. **ALWAYS end with 3 suggested follow-up questions** — After your answer, add a section:
   ---
   **💡 You might also want to ask:**
   1. [A specific growth/scaling follow-up question]
   2. [A related funding or investment question]
   3. [A practical "what should I do next" question]

IMPORTANT DISCLAIMERS (include briefly at the end, not at the start):
- This is AI-generated advice — verify with a chartered accountant before acting
- Tax rules change — always check current HMRC guidance
- Your specific circumstances may affect these calculations"""

AGENT_PROMPTS = {
    "tax": SYSTEM_PROMPT_TEMPLATE,
    "compliance": COMPLIANCE_AGENT_PROMPT,
    "growth": GROWTH_AGENT_PROMPT,
}


def get_openai_client() -> OpenAI:
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def build_system_prompt(db: Session, consultation_id: int, agent: str = "tax") -> str:
    knowledge_base = get_knowledge_base_text(db, consultation_id)
    template = AGENT_PROMPTS.get(agent, SYSTEM_PROMPT_TEMPLATE)
    return template.format(knowledge_base=knowledge_base)


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
    agent: str = "tax",
) -> Message:
    # Save user message
    save_message(db, consultation_id, user_id, MessageRole.USER, user_message)

    # Build messages for OpenAI
    system_prompt = build_system_prompt(db, consultation_id, agent=agent)
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
    agent: str = "tax",
):
    """Generator that yields streaming chunks from OpenAI."""
    # Save user message
    save_message(db, consultation_id, user_id, MessageRole.USER, user_message)

    # Build messages for OpenAI
    system_prompt = build_system_prompt(db, consultation_id, agent=agent)
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


def generate_health_score(db: Session, consultation_id: int) -> dict:
    """Analyze the knowledge base and generate a business health score."""
    cache_key = f"health_score:{consultation_id}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    knowledge_base = get_knowledge_base_text(db, consultation_id)

    # If no documents uploaded, return defaults
    if "No documents" in knowledge_base:
        return {
            "overall": 50,
            "tax_efficiency": 50,
            "expense_optimization": 50,
            "compliance_risk": 50,
            "recommendations": [
                "Upload your financial documents so we can analyse your tax position",
                "Include your latest tax return for a more accurate score",
                "Add bank statements and expense receipts for a complete picture",
            ],
        }

    prompt = (
        "Analyze this business's financial health based on the knowledge base below. "
        "Return ONLY valid JSON with no markdown formatting, no code fences, no explanation.\n\n"
        '{"overall": <0-100>, "tax_efficiency": <0-100>, "expense_optimization": <0-100>, '
        '"compliance_risk": <0-100>, "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]}\n\n'
        "Scoring guide:\n"
        "- tax_efficiency: How well are they minimising tax? 100=optimal structure\n"
        "- expense_optimization: Are expenses well managed? 100=all legitimate deductions claimed\n"
        "- compliance_risk: How safe from HMRC issues? 100=fully compliant, 0=high risk\n"
        "- overall: weighted average of the three scores\n\n"
        "Knowledge base:\n" + knowledge_base
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    import json as _json

    try:
        data = _json.loads(raw)
    except _json.JSONDecodeError:
        data = {
            "overall": 50,
            "tax_efficiency": 50,
            "expense_optimization": 50,
            "compliance_risk": 50,
            "recommendations": [
                "Unable to parse the AI response — please try again",
                "Upload additional documents for a more accurate score",
                "Try refreshing after adding more financial records",
            ],
        }

    # Clamp scores to 0-100
    for key in ("overall", "tax_efficiency", "expense_optimization", "compliance_risk"):
        val = data.get(key, 50)
        data[key] = max(0, min(100, int(val)))

    # Ensure recommendations is a list of strings
    recs = data.get("recommendations", [])
    if not isinstance(recs, list):
        recs = []
    data["recommendations"] = [str(r) for r in recs[:5]]

    set_cached(cache_key, data)
    return data


def generate_scenario(db: Session, consultation_id: int, scenario_data: dict) -> dict:
    """Call OpenAI with a structured scenario prompt and return parsed tax calculations."""
    import json as _json

    prompt = (
        "Given this business scenario, calculate the exact tax position for UK 2025/26:\n"
        f"Revenue: \u00a3{scenario_data['revenue']}, "
        f"Expenses: \u00a3{scenario_data['expenses']}, "
        f"Employees: {scenario_data['employees']}, "
        f"Director salary: \u00a3{scenario_data['salary']}, "
        f"Dividends: \u00a3{scenario_data['dividends']}, "
        f"Pension: \u00a3{scenario_data['pension_contribution']}\n\n"
        'Return ONLY valid JSON: {"income_tax": X, "national_insurance": X, '
        '"corporation_tax": X, "dividend_tax": X, "total_tax": X, "take_home": X, '
        '"effective_rate": X, "suggestions": ["...", "..."]}'
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.3,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    try:
        data = _json.loads(raw)
    except _json.JSONDecodeError:
        data = {
            "income_tax": 0,
            "national_insurance": 0,
            "corporation_tax": 0,
            "dividend_tax": 0,
            "total_tax": 0,
            "take_home": 0,
            "effective_rate": 0.0,
            "suggestions": ["Unable to parse the AI response — please try again"],
        }

    # Ensure all numeric fields are ints except effective_rate
    for key in (
        "income_tax",
        "national_insurance",
        "corporation_tax",
        "dividend_tax",
        "total_tax",
        "take_home",
    ):
        data[key] = int(data.get(key, 0))
    data["effective_rate"] = float(data.get("effective_rate", 0.0))
    if not isinstance(data.get("suggestions"), list):
        data["suggestions"] = []
    data["suggestions"] = [str(s) for s in data["suggestions"][:10]]

    return data


def generate_planner(db: Session, consultation_id: int) -> dict:
    """Generate a 12-month tax action plan based on the user's knowledge base."""
    cache_key = f"planner:{consultation_id}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import json as _json

    knowledge_base = get_knowledge_base_text(db, consultation_id)

    prompt = (
        "Generate a 12-month UK tax action plan for this business. "
        "Return ONLY valid JSON array with no markdown formatting, no code fences, no explanation.\n\n"
        '[{"month": "April 2026", "actions": [{"title": "...", "description": "...", '
        '"deadline": "YYYY-MM-DD", "priority": "high|medium|low"}]}]\n\n'
        "Cover all 12 months from April 2026 to March 2027. Include key HMRC deadlines, "
        "VAT return dates, payroll obligations, Self Assessment, Corporation Tax, "
        "and strategic tax planning actions.\n\n"
        "Knowledge base:\n" + knowledge_base
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=3000,
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    try:
        data = _json.loads(raw)
    except _json.JSONDecodeError:
        # Return a sensible default plan
        data = [
            {
                "month": "April 2026",
                "actions": [
                    {
                        "title": "Start of new tax year",
                        "description": "Review tax-efficient salary and dividend strategy for 2026/27",
                        "deadline": "2026-04-06",
                        "priority": "high",
                    }
                ],
            },
            {
                "month": "July 2026",
                "actions": [
                    {
                        "title": "Second payment on account",
                        "description": "Pay second instalment of income tax for 2025/26",
                        "deadline": "2026-07-31",
                        "priority": "high",
                    }
                ],
            },
            {
                "month": "January 2027",
                "actions": [
                    {
                        "title": "Self Assessment deadline",
                        "description": "Submit 2025/26 Self Assessment tax return and pay balancing payment",
                        "deadline": "2027-01-31",
                        "priority": "high",
                    }
                ],
            },
        ]

    # Validate structure
    if not isinstance(data, list):
        data = []

    months = []
    for item in data:
        if not isinstance(item, dict):
            continue
        month_name = str(item.get("month", "Unknown"))
        actions_raw = item.get("actions", [])
        if not isinstance(actions_raw, list):
            actions_raw = []
        actions = []
        for a in actions_raw:
            if not isinstance(a, dict):
                continue
            priority = str(a.get("priority", "medium")).lower()
            if priority not in ("high", "medium", "low"):
                priority = "medium"
            actions.append(
                {
                    "title": str(a.get("title", "")),
                    "description": str(a.get("description", "")),
                    "deadline": str(a.get("deadline", "")),
                    "priority": priority,
                }
            )
        months.append({"month": month_name, "actions": actions})

    result = {"months": months}
    set_cached(cache_key, result)
    return result


def generate_accountant_briefing(db: Session, consultation_id: int) -> str:
    """Compile a briefing document that a real accountant can quickly review."""
    knowledge_base = get_knowledge_base_text(db, consultation_id)

    # Get all assistant messages (strategies)
    assistant_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.ASSISTANT,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Get user messages for context
    user_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.USER,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Build strategy summary from AI responses
    strategies_text = ""
    for i, msg in enumerate(assistant_messages[:5], 1):
        strategies_text += f"\n--- AI Response {i} ---\n{msg.content[:2000]}\n"

    # Build questions summary
    questions_text = ""
    for msg in user_messages[:10]:
        questions_text += f"- {msg.content[:200]}\n"

    briefing = f"""PROFESSIONAL ACCOUNTANT REVIEW BRIEFING
========================================
Consultation #{consultation_id}
Generated: {datetime.utcnow().strftime("%d %B %Y %H:%M UTC")}

1. CLIENT QUESTIONS
-------------------
{questions_text if questions_text else "No questions recorded yet."}

2. KNOWLEDGE BASE (FROM UPLOADED DOCUMENTS)
-------------------------------------------
{knowledge_base}

3. AI-GENERATED STRATEGIES (REQUIRES YOUR REVIEW)
--------------------------------------------------
{strategies_text if strategies_text else "No AI strategies generated yet."}

4. REVIEW CHECKLIST
-------------------
- [ ] Verify all tax calculations against current HMRC rates
- [ ] Check salary/dividend split recommendations
- [ ] Validate expense deduction eligibility
- [ ] Confirm compliance deadlines
- [ ] Assess any risk areas in the AI advice
- [ ] Provide written feedback and corrections

END OF BRIEFING
"""
    return briefing


def get_consultation_messages(
    db: Session, consultation_id: int, skip: int = 0, limit: int = 100
) -> tuple[list[Message], int]:
    query = db.query(Message).filter(Message.consultation_id == consultation_id)
    total = query.count()
    messages = query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    return messages, total


def _escape(text: str) -> str:
    """Escape text for ReportLab XML."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _md_to_elements(md_text: str, styles: dict) -> list:
    """Convert markdown-formatted AI response text to ReportLab flowable elements."""
    elements = []
    lines = md_text.split("\n")
    i = 0
    table_rows = []

    while i < len(lines):
        line = lines[i].rstrip()

        # Skip empty lines
        if not line.strip():
            if table_rows:
                # Flush table
                elements.extend(_build_table(table_rows, styles))
                table_rows = []
            i += 1
            continue

        # Markdown table row: | col1 | col2 | col3 |
        if "|" in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            # Skip separator rows like |---|---|---|
            if all(re.match(r"^[-:]+$", c) for c in cells):
                i += 1
                continue
            table_rows.append(cells)
            i += 1
            continue

        # Flush any pending table
        if table_rows:
            elements.extend(_build_table(table_rows, styles))
            table_rows = []

        stripped = line.strip()

        # Headings
        if stripped.startswith("### "):
            text = _escape(stripped[4:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(text, styles["h3"]))
        elif stripped.startswith("## "):
            text = _escape(stripped[3:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(text, styles["h2"]))
        elif stripped.startswith("# "):
            text = _escape(stripped[2:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(text, styles["h1"]))

        # Numbered list: 1. item or 1) item
        elif re.match(r"^\d+[\.\)]\s", stripped):
            text = _escape(re.sub(r"^\d+[\.\)]\s*", "", stripped))
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            num = re.match(r"^(\d+)", stripped).group(1)
            elements.append(
                Paragraph(
                    f"<b>{num}.</b>  {text}",
                    styles["list_item"],
                )
            )

        # Bullet list: - item or * item
        elif stripped.startswith("- ") or stripped.startswith("* "):
            text = _escape(stripped[2:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(f"\u2022  {text}", styles["bullet"]))

        # Bold line (entire line is **text**)
        elif stripped.startswith("**") and stripped.endswith("**"):
            text = _escape(stripped[2:-2])
            elements.append(Paragraph(f"<b>{text}</b>", styles["bold_body"]))

        # Regular paragraph
        else:
            text = _escape(stripped)
            # Convert inline **bold**
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            # Convert inline `code`
            text = re.sub(
                r"`(.+?)`",
                r'<font face="Courier" size="9" color="#2d4a7c">\1</font>',
                text,
            )
            elements.append(Paragraph(text, styles["body"]))

        i += 1

    # Flush remaining table
    if table_rows:
        elements.extend(_build_table(table_rows, styles))

    return elements


def _build_table(rows: list[list[str]], styles: dict) -> list:
    """Build a styled ReportLab Table from parsed markdown table rows."""
    if not rows:
        return []

    navy = HexColor("#1a365d")
    light_blue = HexColor("#eef2f8")
    border_color = HexColor("#c8d4e3")
    white = HexColor("#ffffff")

    # Build table data with Paragraphs for word wrapping
    max_cols = max(len(r) for r in rows)
    table_data = []
    for ri, row in enumerate(rows):
        # Pad rows to same column count
        padded = row + [""] * (max_cols - len(row))
        style = styles["table_header"] if ri == 0 else styles["table_cell"]
        table_data.append([Paragraph(_escape(cell), style) for cell in padded])

    # Calculate column widths (equal distribution)
    page_width = A4[0] - 40 * mm  # minus margins
    col_width = page_width / max_cols

    table = Table(table_data, colWidths=[col_width] * max_cols)

    # Style
    table_style_commands = [
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), navy),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        # Body rows
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]

    # Alternating row colors
    for ri in range(1, len(table_data)):
        if ri % 2 == 0:
            table_style_commands.append(("BACKGROUND", (0, ri), (-1, ri), light_blue))

    table.setStyle(TableStyle(table_style_commands))

    return [Spacer(1, 3 * mm), table, Spacer(1, 3 * mm)]


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
    user_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.USER,
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
        bottomMargin=25 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    base_styles = getSampleStyleSheet()

    # Define all custom styles
    navy = HexColor("#1a365d")
    dark_blue = HexColor("#2d4a7c")
    medium_blue = HexColor("#4a6fa5")
    accent = HexColor("#3b82f6")
    dark_text = HexColor("#1f2937")
    muted_text = HexColor("#6b7280")
    light_bg = HexColor("#f0f4f8")

    s = {
        "title": ParagraphStyle(
            "RptTitle",
            parent=base_styles["Title"],
            fontSize=26,
            textColor=navy,
            spaceAfter=3 * mm,
            leading=32,
        ),
        "subtitle": ParagraphStyle(
            "RptSubtitle",
            parent=base_styles["Normal"],
            fontSize=11,
            textColor=muted_text,
            spaceAfter=8 * mm,
        ),
        "h1": ParagraphStyle(
            "RptH1",
            parent=base_styles["Heading1"],
            fontSize=18,
            textColor=navy,
            spaceBefore=10 * mm,
            spaceAfter=4 * mm,
            borderWidth=0,
            borderPadding=0,
        ),
        "h2": ParagraphStyle(
            "RptH2",
            parent=base_styles["Heading2"],
            fontSize=14,
            textColor=dark_blue,
            spaceBefore=6 * mm,
            spaceAfter=3 * mm,
        ),
        "h3": ParagraphStyle(
            "RptH3",
            parent=base_styles["Heading3"],
            fontSize=11,
            textColor=medium_blue,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
        ),
        "body": ParagraphStyle(
            "RptBody",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            spaceAfter=2 * mm,
        ),
        "bold_body": ParagraphStyle(
            "RptBoldBody",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            spaceAfter=2 * mm,
        ),
        "bullet": ParagraphStyle(
            "RptBullet",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            leftIndent=12,
            spaceAfter=1.5 * mm,
        ),
        "list_item": ParagraphStyle(
            "RptListItem",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            leftIndent=12,
            spaceAfter=1.5 * mm,
        ),
        "question": ParagraphStyle(
            "RptQuestion",
            parent=base_styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=muted_text,
            leftIndent=6,
            borderColor=HexColor("#e5e7eb"),
            borderWidth=0,
            spaceAfter=2 * mm,
            fontName="Helvetica-Oblique",
        ),
        "table_header": ParagraphStyle(
            "RptTableHeader",
            parent=base_styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=HexColor("#ffffff"),
            fontName="Helvetica-Bold",
        ),
        "table_cell": ParagraphStyle(
            "RptTableCell",
            parent=base_styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=dark_text,
        ),
        "disclaimer": ParagraphStyle(
            "RptDisclaimer",
            parent=base_styles["Normal"],
            fontSize=7.5,
            textColor=muted_text,
            leading=10,
            spaceBefore=8 * mm,
        ),
        "brand": ParagraphStyle(
            "RptBrand",
            parent=base_styles["Normal"],
            fontSize=9,
            textColor=accent,
            alignment=TA_CENTER,
        ),
        "brand_sub": ParagraphStyle(
            "RptBrandSub",
            parent=base_styles["Normal"],
            fontSize=8,
            textColor=muted_text,
            alignment=TA_CENTER,
        ),
        "footer_line": ParagraphStyle(
            "RptFooterLine",
            parent=base_styles["Normal"],
            fontSize=8,
            textColor=muted_text,
            alignment=TA_RIGHT,
        ),
    }

    elements = []

    # ─── Cover / Header ───────────────────────────────────────
    elements.append(Spacer(1, 15 * mm))
    elements.append(Paragraph("AI Accountant Adviser", s["brand"]))
    elements.append(Paragraph("Powered by Advanced AI Technology", s["brand_sub"]))
    elements.append(Spacer(1, 10 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=2, color=accent, spaceBefore=0, spaceAfter=5 * mm
        )
    )
    elements.append(Paragraph(title, s["title"]))
    elements.append(
        Paragraph(
            f"Generated on {datetime.utcnow().strftime('%d %B %Y')}  \u2022  "
            f"Consultation #{consultation_id}  \u2022  "
            f"{len(messages)} AI responses  \u2022  "
            f"{len(user_messages)} questions asked",
            s["subtitle"],
        )
    )
    elements.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=HexColor("#e5e7eb"),
            spaceBefore=2 * mm,
            spaceAfter=5 * mm,
        )
    )

    # ─── Table of Contents ────────────────────────────────────
    toc_data = [
        ["Section", "Page"],
        ["1. Executive Summary", "2"],
        ["2. Financial Overview", "2"],
        ["3. Tax Optimisation Strategies", "3"],
        ["4. Recommended Actions", "-"],
        ["5. Disclaimer", "-"],
    ]
    toc_table = Table(toc_data, colWidths=[130 * mm, 25 * mm])
    toc_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (-1, 0), navy),
                ("TEXTCOLOR", (0, 1), (-1, -1), dark_text),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, 0), 1, navy),
                ("LINEBELOW", (0, -1), (-1, -1), 0.5, HexColor("#e5e7eb")),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ]
        )
    )
    elements.append(toc_table)

    # ─── 1. Executive Summary ─────────────────────────────────
    elements.append(Paragraph("1. Executive Summary", s["h1"]))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1,
            color=accent,
            spaceBefore=0,
            spaceAfter=4 * mm,
        )
    )

    # Generate AI summary of the entire consultation
    ai_summary = ""
    if messages:
        try:
            all_advice = "\n".join(m.content[:1500] for m in messages[:5])
            client = get_openai_client()
            summary_resp = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are writing the executive summary for a professional tax strategy report. "
                            "Write a clear, concise 4-6 sentence summary of the key findings and recommendations. "
                            "Include specific £ amounts and percentages where possible. "
                            "Write in third person professional tone. No markdown, just plain text."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Summarise these tax consultation findings:\n\n{all_advice}",
                    },
                ],
                max_tokens=400,
                temperature=0.3,
            )
            ai_summary = summary_resp.choices[0].message.content.strip()
        except Exception:
            ai_summary = ""

    if ai_summary:
        # Highlighted summary box
        summary_box_style = ParagraphStyle(
            "SummaryBox",
            parent=s["body"],
            fontSize=10,
            leading=16,
            textColor=navy,
            backColor=HexColor("#eef2f8"),
            borderColor=accent,
            borderWidth=1,
            borderPadding=12,
            spaceAfter=6 * mm,
        )
        elements.append(Paragraph(_escape(ai_summary), summary_box_style))
    else:
        elements.append(
            Paragraph(
                "This report summarises the AI-generated tax optimisation strategies "
                "based on your uploaded financial documents and consultation Q&amp;A sessions. "
                "The strategies below were tailored to your specific financial situation "
                "using current UK tax regulations and rates.",
                s["body"],
            )
        )

    # Summary stats table
    summary_data = [
        ["Metric", "Value"],
        ["Questions Asked", str(len(user_messages))],
        ["AI Responses", str(len(messages))],
        ["Consultation Type", "Full Consultation"],
        ["Tax Year", "2025/26"],
    ]
    summary_table = Table(summary_data, colWidths=[80 * mm, 75 * mm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), navy),
                ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#c8d4e3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#ffffff"), light_bg]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(Spacer(1, 3 * mm))
    elements.append(summary_table)

    # ─── 2. Financial Overview ────────────────────────────────
    elements.append(Paragraph("2. Financial Overview", s["h1"]))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1,
            color=accent,
            spaceBefore=0,
            spaceAfter=4 * mm,
        )
    )
    if knowledge_text and "No documents" not in knowledge_text:
        elements.extend(_md_to_elements(knowledge_text, s))
    else:
        elements.append(
            Paragraph("No financial documents were uploaded for analysis.", s["body"])
        )

    # ─── 3. Tax Optimisation Strategies ───────────────────────
    elements.append(Paragraph("3. Tax Optimisation Strategies", s["h1"]))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1,
            color=accent,
            spaceBefore=0,
            spaceAfter=4 * mm,
        )
    )

    if messages:
        # Pair user questions with AI responses
        all_msgs = (
            db.query(Message)
            .filter(Message.consultation_id == consultation_id)
            .order_by(Message.created_at.asc())
            .all()
        )

        strategy_num = 0
        for msg in all_msgs:
            if msg.role == MessageRole.USER:
                elements.append(
                    Paragraph(
                        f'<i>Q: "{_escape(msg.content[:200])}"</i>',
                        s["question"],
                    )
                )
            elif msg.role == MessageRole.ASSISTANT:
                strategy_num += 1
                elements.append(Paragraph(f"Response {strategy_num}", s["h2"]))
                # Parse markdown content into proper PDF elements
                content = msg.content[:5000]
                elements.extend(_md_to_elements(content, s))
                elements.append(Spacer(1, 3 * mm))
                elements.append(
                    HRFlowable(
                        width="60%",
                        thickness=0.5,
                        color=HexColor("#e5e7eb"),
                        spaceBefore=2 * mm,
                        spaceAfter=2 * mm,
                    )
                )
    else:
        elements.append(
            Paragraph(
                "No consultation messages yet. Start a chat to receive strategies.",
                s["body"],
            )
        )

    # ─── 4. Recommended Actions ───────────────────────────────
    elements.append(Paragraph("4. Recommended Next Steps", s["h1"]))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1,
            color=accent,
            spaceBefore=0,
            spaceAfter=4 * mm,
        )
    )

    actions = [
        ["Priority", "Action", "Deadline"],
        [
            "HIGH",
            "Review all strategies with a qualified chartered accountant",
            "Within 2 weeks",
        ],
        [
            "HIGH",
            "Implement salary/dividend split changes before next payroll",
            "Next payroll date",
        ],
        [
            "MEDIUM",
            "Ensure compliance with current HMRC regulations",
            "Ongoing",
        ],
        [
            "MEDIUM",
            "Keep all supporting documentation for at least 6 years",
            "Ongoing",
        ],
        [
            "LOW",
            "Schedule a follow-up consultation for ongoing advice",
            "Quarterly",
        ],
    ]
    action_table = Table(actions, colWidths=[25 * mm, 95 * mm, 35 * mm])
    action_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), navy),
                ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#c8d4e3")),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [HexColor("#ffffff"), light_bg],
                ),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(action_table)

    # ─── 5. Disclaimer ────────────────────────────────────────
    elements.append(Spacer(1, 10 * mm))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=HexColor("#e5e7eb"),
            spaceBefore=0,
            spaceAfter=3 * mm,
        )
    )
    elements.append(Paragraph("<b>5. Disclaimer</b>", s["body"]))
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
            s["disclaimer"],
        )
    )

    elements.append(Spacer(1, 8 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=1, color=accent, spaceBefore=0, spaceAfter=3 * mm
        )
    )
    elements.append(Paragraph("AI Accountant Adviser", s["brand"]))
    elements.append(
        Paragraph(
            "ai-adviser.probooking.app  \u2022  Powered by GPT-4o  \u2022  "
            f"\u00a9 {datetime.utcnow().year}",
            s["brand_sub"],
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
