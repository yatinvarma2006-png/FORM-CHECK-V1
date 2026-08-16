"""AI Chat endpoint powered by Google Gemini 2.0 Flash.

Provides a conversational biomechanics coach that has full context of the
user's analysis results (metrics, faults, cues, drills) and can answer
any follow-up question about deadlift or bowling form, injury prevention,
training programming, mobility work, etc.
"""

from __future__ import annotations

import os
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai", tags=["ai"])

# ── Gemini client (lazy init) ──────────────────────────────────────────────

_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not set. "
                   "Get a free key at https://aistudio.google.com/apikey",
        )

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        _model = client
        return _model
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Gemini: {e}")


# ── Request / Response schemas ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "ai"
    text: str


class AIChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    sport: Optional[str] = None
    metrics_context: Optional[List[dict]] = None
    ai_report_context: Optional[dict] = None


class AIChatResponse(BaseModel):
    reply: str


# ── System prompt builder ──────────────────────────────────────────────────

def _build_system_prompt(
    sport: str | None,
    metrics: list[dict] | None,
    ai_report: dict | None,
) -> str:
    base = (
        "You are FormCheck AI Coach, an expert sports biomechanics coach specializing in "
        "injury prevention and movement optimization. You have deep knowledge of:\n"
        "- Conventional deadlift mechanics, powerlifting technique, and posterior chain training\n"
        "- Cricket fast bowling biomechanics, action legality, and pace bowling injury prevention\n"
        "- General strength & conditioning, mobility, and corrective exercise programming\n\n"
        "IMPORTANT RULES:\n"
        "- Give specific, actionable advice — not vague generalities\n"
        "- Reference the user's actual analysis data when available\n"
        "- If the user asks about something outside deadlift/bowling biomechanics, "
        "  answer helpfully but steer back to their training context\n"
        "- Keep responses concise (2-4 paragraphs max) unless the user asks for detail\n"
        "- Use plain language, but include anatomical terms where helpful\n"
        "- Never diagnose injuries — recommend seeing a physiotherapist for pain\n"
    )

    if sport:
        base += f"\nThe user is currently analyzing their {sport} form.\n"

    if metrics:
        base += "\n--- USER'S CURRENT ANALYSIS RESULTS ---\n"
        for m in metrics:
            status = "⚠️ FLAGGED" if m.get("flagged") else "✅ OK"
            base += (
                f"• {m.get('display_name', m.get('metric_name'))}: "
                f"{m.get('value')} {m.get('unit', '')} "
                f"(range: {m.get('min')}-{m.get('max')}) [{status}]"
            )
            if m.get("fault_name"):
                base += f" — Fault: {m['fault_name']}"
            if m.get("fix_tip"):
                base += f" — Tip: {m['fix_tip']}"
            base += "\n"

    if ai_report:
        base += f"\n--- AI COACHING SUMMARY ---\n"
        base += f"AI Form Efficiency Score: {ai_report.get('ai_score', '?')}/100\n"
        base += f"Risk Level: {ai_report.get('risk_level', '?')}\n"
        base += f"Summary: {ai_report.get('summary', '')}\n"
        if ai_report.get("cues"):
            base += "Movement Cues: " + "; ".join(ai_report["cues"]) + "\n"
        if ai_report.get("recommended_drills"):
            drills = [d["name"] for d in ai_report["recommended_drills"]]
            base += "Recommended Drills: " + ", ".join(drills) + "\n"

    return base


# ── Chat endpoint ──────────────────────────────────────────────────────────

def _generate_fallback_response(
    req: AIChatRequest,
) -> str:
    """Generate intelligent biomechanical responses if GEMINI_API_KEY is not set."""
    msg = req.message.lower()
    sport = (req.sport or "deadlift").lower()

    if "deadlift" in msg or sport == "deadlift":
        if "spine" in msg or "back" in msg or "pain" in msg or "round" in msg:
            return (
                "To maintain a neutral spine during conventional deadlifts, focus on packing your lats "
                "before the bar leaves the floor. Think about pulling your shoulder blades down into your back pockets "
                "and wedging your hips into the bar. Maintain a 45-degree angle in your gaze to keep your cervical spine aligned."
            )
        elif "score" in msg or "result" in msg or "form" in msg:
            if req.ai_report_context:
                score = req.ai_report_context.get("ai_score", 100)
                risk = req.ai_report_context.get("risk_level", "Low Risk")
                return (
                    f"Your current AI Form Score is {score}/100 with a risk rating of '{risk}'. "
                    f"{req.ai_report_context.get('summary', '')}"
                )
            return "Your deadlift form has been scanned. Check the metric bars above for hip and knee lockout angles!"
        elif "drill" in msg or "exercise" in msg or "fix" in msg:
            return (
                "Top recommended deadlift drills:\n"
                "1. **Paused Deadlifts (1 inch off floor)** — Teaches leg drive without hips shooting up.\n"
                "2. **Romanian Deadlifts (RDLs)** — Reinforces the hip hinge pattern and hamstring loading.\n"
                "3. **Kettlebell Swings** — Builds explosive terminal hip lockout."
            )
        elif "cue" in msg or "tip" in msg:
            return (
                "Key Deadlift Cues:\n"
                "• 'Push the floor away with your feet' rather than pulling with your upper body.\n"
                "• 'Pull the slack out of the bar' before lifting heavy weight.\n"
                "• 'Lock out by squeezing your glutes forward' at the top."
            )
        else:
            return (
                f"In conventional deadlifting, success comes down to a tight setup, driving through the mid-foot, "
                f"and extending hips and knees simultaneously. Feel free to ask about lat engagement, hip position, or corrective drills!"
            )
    else:  # Bowling
        return (
            "In fast bowling, maintaining front leg brace at landing maximizes energy transfer into ball release while "
            "protecting the lower back from excessive rotational strain. Keep your bowling arm extension consistent throughout the delivery stride!"
        )


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(req: AIChatRequest):
    """Send a message to the Gemini-powered biomechanics coach (with smart offline fallback)."""
    api_key = os.environ.get("GEMINI_API_KEY", "")

    if not api_key:
        # Use intelligent biomechanics fallback when key is not configured
        reply_text = _generate_fallback_response(req)
        return AIChatResponse(reply=reply_text)

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        system_prompt = _build_system_prompt(
            sport=req.sport,
            metrics=req.metrics_context,
            ai_report=req.ai_report_context,
        )

        contents = []
        for msg in req.history:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.text}]})

        contents.append({"role": "user", "parts": [{"text": req.message}]})

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

        reply_text = response.text or _generate_fallback_response(req)
        return AIChatResponse(reply=reply_text)

    except Exception as e:
        # Fallback gracefully if API rate limit or error occurs
        reply_text = _generate_fallback_response(req)
        return AIChatResponse(reply=reply_text)
