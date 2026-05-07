"""Gemini AI service – feedback generation & field extraction."""

import json
import google.generativeai as genai
from app.config import get_settings

_configured = False


def _ensure_configured():
    global _configured
    if not _configured:
        genai.configure(api_key=get_settings().google_generative_ai_api_key)
        _configured = True


def generate_feedback(
    transcript_text: str,
    trade: str,
    language: str,
    questions: list[str],
    role: str | None = None,
) -> dict:
    """Generate structured feedback using Gemini, returns dict with scores + model answers."""
    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.0-flash")

    # ── Model answers ─────────────────────────────────────────────────────
    model_answers: list[str] = []
    if questions:
        ma_prompt = f"""For each of the following trade skill assessment questions for a {role or trade} position, provide a DETAILED, PRACTICAL model answer.

IMPORTANT REQUIREMENTS FOR EACH ANSWER:
1. Length: 100-200 words per answer
2. Include: Real-world practical examples from the trade
3. Structure: Experience → Approach → Safety/Quality → Outcome
4. Be specific and practical for blue-collar/trade workers
5. Use simple, clear language

Return ONLY a valid JSON array with answers matching question order:
["Full answer 1 with practical examples...", "Full answer 2 with practical examples...", ...]

Questions to answer:
{json.dumps(questions)}

Generate practical, trade-relevant answers with hands-on examples."""

        try:
            ma_resp = model.generate_content(ma_prompt)
            cleaned = ma_resp.text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            import re
            arr_match = re.search(r"\[[\s\S]*\]", cleaned)
            if arr_match:
                cleaned = arr_match.group(0)
            model_answers = json.loads(cleaned)
        except Exception as e:
            print(f"Error parsing model answers: {e}")
            model_answers = []

    # ── Feedback scoring ──────────────────────────────────────────────────
    fb_prompt = f"""You are an AI assessor evaluating a blue-collar or polytechnic job candidate
in Karnataka, India. The candidate has answered interview questions in Kannada,
Hindi, or English. Evaluate their response fairly, accounting for language
barriers and informal speech patterns.

Candidate trade: {trade}
Interview language: {language}
Transcript: {transcript_text}

Score the candidate on these three dimensions (0-100 each):
1. Relevance — did they actually answer what was asked?
2. Clarity — was the response understandable despite language or accent?
3. Skill confidence — do they demonstrate hands-on experience in their trade?

Then classify into exactly one of these fitment labels:
- "Job-ready" (all scores above 65)
- "Needs training" (scores 40-65)
- "Requires manual verification" (unclear or inconsistent answers)
- "Low confidence / poor quality" (scores below 40 or very short responses)

Return ONLY valid JSON. No explanation, no markdown, no preamble.
Schema:
{{
  "relevance": number,
  "clarity": number,
  "skillConfidence": number,
  "fitmentLabel": string,
  "summary": string (2 sentences max, in simple English)
}}"""

    resp = model.generate_content(fb_prompt)
    raw = resp.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    feedback_obj = json.loads(raw)
    feedback_obj["modelAnswers"] = model_answers
    return feedback_obj


def extract_interview_fields(transcript: str) -> dict:
    """Extract structured interview fields from a voice transcript."""
    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""You are an expert at extracting structured data from conversations. Given the transcript of a conversation where a user is creating a mock interview, extract the following fields and return them as a JSON object:
- role (job role, e.g. Frontend Developer)
- level (junior, mid, or senior)
- techstack (comma separated, e.g. React, TypeScript)
- type (technical, behavioral, or mixed)
- amount (number of questions)

If a field is missing, make your best guess based on the context or use these defaults:
- level: junior
- type: technical
- amount: 5

Now extract the fields from this transcript:
\"\"\"
{transcript}
\"\"\"
Return only the JSON object."""

    resp = model.generate_content(prompt)
    raw = resp.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    return json.loads(raw)
