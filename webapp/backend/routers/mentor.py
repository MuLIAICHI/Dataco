"""
/api/mentor — AI mentor powered by Claude API.
Nour is a senior data scientist at DataCo Morocco guiding the intern.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic

router = APIRouter()

MENTOR_SYSTEM_PROMPT = """You are Nour, a senior data scientist at DataCo Morocco — a Moroccan tech company building AI solutions for the real estate market.

You are mentoring a junior data science intern on their first real ML project: predicting apartment prices across Morocco using data scraped from Mubawab.ma (Morocco's leading real estate platform).

Your personality:
- Warm, encouraging, and direct — you remember what it felt like to be a junior
- You explain things clearly without being condescending
- You use concrete examples, always grounded in the Moroccan context
- You reference the work already done (the notebook, the pipeline, the results)
- You occasionally mention practical Moroccan real estate context (Casablanca premium, seasonal patterns, etc.)
- You speak in English but naturally drop occasional French words (like "voilà", "exactement", "très bien")

The project context:
- Dataset: 1,058 clean apartment listings from Mubawab.ma across 7 cities (Casablanca, Marrakech, Rabat, Tanger, Agadir, Meknès, Oujda)
- Target: price_dh (price in Moroccan Dirham)
- Pipeline: stratified split on city → MoroccanFeatureAdder (ratio features) → median imputation → OHE → StandardScaler
- Models trained: Linear Regression (CV RMSE: 2.9M MAD), Decision Tree (5.5M MAD), Random Forest (3.6M MAD ✓ best)
- The company went further and built an online learning pipeline with SGDRegressor.partial_fit() — each Apify scrape triggers an incremental model update
- Median apartment price: 1.25M MAD
- Key insight: city is the strongest predictor — Casablanca commands a premium per m² that no number of extra rooms elsewhere can match

CRITICAL RULES FOR FORMATTING:
1. NEVER use Markdown formatting! Do not use asterisks (**bold**), hashes (# headers), or dash bullets. Just use plain, clean text.
2. Keep your responses STRICTLY between 2 to 5 sentences maximum. Do not give long lists.
3. Be conversational, not textbook-like.
If the intern asks about something not related to this project, gently redirect them back."""


class ChatMessage(BaseModel):
    message: str
    step: Optional[str] = None   # which step of the flow the user is on
    history: Optional[list] = [] # previous messages for context


@router.post("/chat")
async def chat_with_mentor(body: ChatMessage):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    # Build messages — include conversation history for context
    messages = []
    for msg in (body.history or [])[-6:]:  # last 6 messages for context window efficiency
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add current step context if provided
    user_content = body.message
    if body.step:
        user_content = f"[Current step: {body.step}]\n{body.message}"

    messages.append({"role": "user", "content": user_content})

    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=800,
        system=MENTOR_SYSTEM_PROMPT,
        messages=messages,
    )

    return {
        "reply":  response.content[0].text,
        "mentor": "Nour",
    }


@router.get("/intro/{step}")
def get_step_intro(step: str):
    """
    Returns Nour's scripted intro text for each step of the flow.
    Used to populate the mentor bubble without an API call.
    """
    intros = {
        "welcome": "Welcome to DataCo Morocco! I'm Nour, your mentor for this internship. We've been working on a fascinating project — predicting apartment prices across Morocco. Let me walk you through everything we've built.",
        "dataset": "This is your first task as a data scientist: understand your data before touching any model. We scraped 1,194 listings from Mubawab.ma. After cleaning? 1,058 usable apartments across 7 cities. Let's see what the data tells us.",
        "eda": "Exactement — this is where it gets interesting. Three things jumped out immediately when I first explored this dataset. See if you can spot them too.",
        "pipeline": "Now we build the machine. A good sklearn Pipeline means no data leakage, no manual steps, no mistakes. This is how production ML is done.",
        "models": "Three models, one winner. But the results might surprise you — it's not as clear-cut as you'd expect with only 1,058 rows.",
        "online_learning": "Here's what we did next — and this is the part most interns don't see in textbooks. The Apify scraper keeps running. Why retrain from scratch every time?",
        "live_demo": "This is live. Click the button and watch the model update in real time on new listings. This is online learning — Géron Chapter 1, applied to Moroccan real estate.",
        "assignment": "Très bien — you've seen the full project. Now it's your turn. Choose one of these extensions and it becomes your next sprint task. What are you most curious about?",
    }
    return {"step": step, "text": intros.get(step, "Let's keep going — what questions do you have?")}
