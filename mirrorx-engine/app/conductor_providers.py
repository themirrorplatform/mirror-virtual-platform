"""
Provider integrations for the MirrorX Conductor.

Each provider has a specific role:
- Hume: Emotional sensing
- OpenAI: Semantic parsing, identity merging, safety filtering
- Gemini: Logic mapping and paradox detection
- Perplexity: External grounding
- Claude: Final mirrorback generation (the Voice of MirrorX)
"""

import logging
import os
import json
from typing import Optional, Dict, Any, List

from anthropic import Anthropic
from dotenv import load_dotenv

from app.conductor_models import (
    UserEmotion,
    SemanticAnalysis,
    IdentitySnapshot,
    IdentityDelta,
    LogicMap,
    Contradiction,
    GroundingContext,
    ToneDecision,
)

load_dotenv()

logger = logging.getLogger("mirrorx.conductor.providers")

# ---------------------------------------------------------------------------
# API Client Initialization
# ---------------------------------------------------------------------------

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
HUME_API_KEY = os.getenv("HUME_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


# ---------------------------------------------------------------------------
# Step 1: Emotional Scan (Hume)
# ---------------------------------------------------------------------------


async def analyze_emotion(text: str, audio_data: Optional[bytes] = None) -> UserEmotion:
    """
    Analyze emotional state using Hume AI or fallback tone analysis.

    Args:
        text: User's reflection text
        audio_data: Optional audio data for richer emotion detection

    Returns:
        UserEmotion with valence, arousal, and primary emotions
    """
    # Try Hume first if available
    if HUME_API_KEY:
        try:
            from hume import HumeClient
            from hume.core import ApiError

            client = HumeClient(api_key=HUME_API_KEY)

            # Use Hume's language model for text emotion analysis
            result = client.empathic_voice.inference.inference_from_text(text=text)

            if result and hasattr(result, 'emotions'):
                emotions = result.emotions
                top_emotion = max(emotions, key=lambda e: e.score)

                # Calculate valence (positive/negative) from emotion categories
                positive_emotions = {'joy', 'amusement', 'love', 'excitement', 'contentment'}
                negative_emotions = {'anger', 'sadness', 'fear', 'disgust', 'anxiety', 'confusion'}

                valence_score = 0.0
                arousal_score = 0.0
                intensity_score = top_emotion.score

                for emotion in emotions:
                    if emotion.name.lower() in positive_emotions:
                        valence_score += emotion.score
                    elif emotion.name.lower() in negative_emotions:
                        valence_score -= emotion.score
                    arousal_score += emotion.score

                # Normalize
                valence_score = max(-1.0, min(1.0, valence_score))
                arousal_score = min(1.0, arousal_score / len(emotions))

                secondary = emotions[1].name if len(emotions) > 1 else None

                return UserEmotion(
                    primary=top_emotion.name,
                    secondary=secondary,
                    valence=valence_score,
                    arousal=arousal_score,
                    intensity=intensity_score
                )

        except (ImportError, ApiError) as e:
            logger.warning(f"Hume API failed, falling back to tone analysis: {e}")

    # Fallback: Use existing tone detection + heuristics
    from safety import detect_tone

    tone_label = detect_tone(text)

    # Map tone labels to emotion parameters
    tone_emotion_map = {
        "raw": ("vulnerable", 0.8, -0.3, 0.7),  # (primary, arousal, valence, intensity)
        "analytical": ("curious", 0.4, 0.2, 0.5),
        "philosophical": ("contemplative", 0.3, 0.0, 0.6),
        "confused": ("uncertain", 0.6, -0.2, 0.5),
        "neutral": ("calm", 0.2, 0.0, 0.3),
    }

    primary, arousal, valence, intensity = tone_emotion_map.get(
        tone_label, ("neutral", 0.2, 0.0, 0.3)
    )

    return UserEmotion(
        primary=primary,
        secondary=None,
        valence=valence,
        arousal=arousal,
        intensity=intensity
    )


# ---------------------------------------------------------------------------
# Step 2: Semantic Parse (OpenAI)
# ---------------------------------------------------------------------------


async def semantic_analysis(text: str) -> SemanticAnalysis:
    """
    Extract semantic structure from reflection using OpenAI.

    Args:
        text: User's reflection text

    Returns:
        SemanticAnalysis with topics, questions, beliefs, stories
    """
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not set, returning empty semantic analysis")
        return SemanticAnalysis()

    try:
        import openai
        openai.api_key = OPENAI_API_KEY

        system_prompt = """You are a parser for a reflective intelligence system.
Extract semantic structure from the user's reflection.
Never give advice. Only fill the JSON schema exactly as specified.

Return a JSON object with these fields:
- topics: array of main topics (strings)
- core_question: the explicit question if any (string or null)
- hidden_questions: what they're really asking beneath (array of strings)
- beliefs_stated: explicit beliefs like "I think..." (array of strings)
- beliefs_implied: implicit beliefs like "I'll never..." (array of strings)
- self_stories: narratives about self like "I am..." (array of strings)
"""

        user_prompt = f"Reflection to analyze:\n\n{text}"

        response = openai.ChatCompletion.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        result = json.loads(response.choices[0].message.content)

        return SemanticAnalysis(
            topics=result.get("topics", []),
            core_question=result.get("core_question"),
            hidden_questions=result.get("hidden_questions", []),
            beliefs_stated=result.get("beliefs_stated", []),
            beliefs_implied=result.get("beliefs_implied", []),
            self_stories=result.get("self_stories", []),
        )

    except Exception as e:
        logger.exception(f"Semantic analysis failed: {e}")
        return SemanticAnalysis()


# ---------------------------------------------------------------------------
# Step 3: Identity Merge (OpenAI)
# ---------------------------------------------------------------------------


async def merge_identity(
    previous_snapshot: IdentitySnapshot,
    semantic: SemanticAnalysis,
    text: str
) -> IdentitySnapshot:
    """
    Merge current reflection with previous identity state.

    Args:
        previous_snapshot: Previous IdentitySnapshot
        semantic: Current semantic analysis
        text: Current reflection text

    Returns:
        Updated IdentitySnapshot (not yet saved)
    """
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not set, returning previous identity unchanged")
        return previous_snapshot

    try:
        import openai
        openai.api_key = OPENAI_API_KEY

        system_prompt = """You are an identity tracker for a reflective intelligence system.
Given the user's previous identity snapshot and their current reflection, update what's relevant.

Focus on:
- Which tensions are being touched again
- Whether this is a regression, progression, or new branch
- What patterns are recurring
- What might be important to surface

Return JSON with these fields (all arrays of strings except where noted):
- tensions: current active tensions
- paradoxes: coexisting contradictions
- goals: stated or implied goals
- recurring_loops: patterns that keep returning
- regressions: slides back to old patterns
- last_reflections: brief summaries of recent reflections (keep last 5)
- dominant_tension: current most active tension (string or null)
- big_question: current overarching question (string or null)
- emotional_baseline: typical emotional state (string or null)
- oscillation_pattern: primary oscillation poles (string or null)
"""

        context = f"""Previous identity snapshot:
{previous_snapshot.model_dump_json(indent=2)}

Current semantic analysis:
{semantic.model_dump_json(indent=2)}

Current reflection:
{text}
"""

        response = openai.ChatCompletion.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content)

        return IdentitySnapshot(**result)

    except Exception as e:
        logger.exception(f"Identity merge failed: {e}")
        return previous_snapshot


# ---------------------------------------------------------------------------
# Step 4: Logic & Paradox Map (Gemini)
# ---------------------------------------------------------------------------


async def build_logic_map(
    text: str,
    semantic: SemanticAnalysis,
    identity: IdentitySnapshot
) -> LogicMap:
    """
    Map logical structures, contradictions, and paradoxes using Gemini.

    Args:
        text: User's reflection text
        semantic: Semantic analysis
        identity: Current identity snapshot

    Returns:
        LogicMap with claims, contradictions, paradoxes, possible paths
    """
    if not GOOGLE_API_KEY:
        logger.warning("Google API key not set, returning empty logic map")
        return LogicMap()

    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)

        model = genai.GenerativeModel(
            model_name=os.getenv("GEMINI_MODEL", "gemini-1.5-pro"),
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            }
        )

        prompt = f"""You are a logic mapper for a reflective intelligence system.
Analyze the logical structure of this reflection. Do NOT fix or resolve anything.
Just map the logical terrain.

Return JSON with these fields:
- claims: explicit claims made (array of strings)
- implied_claims: implied or assumed claims (array of strings)
- contradictions: array of objects with claim_a, claim_b, and contradiction_type ("hard" or "soft")
- paradoxes: productive paradoxes that can coexist (array of strings)
- possible_paths: ways this thinking could evolve (array of strings)

Context:
Previous tensions: {identity.tensions}
Current topics: {semantic.topics}
Stated beliefs: {semantic.beliefs_stated}
Implied beliefs: {semantic.beliefs_implied}

Reflection:
{text}
"""

        response = model.generate_content(prompt)
        result = json.loads(response.text)

        # Parse contradictions
        contradictions = []
        for c in result.get("contradictions", []):
            contradictions.append(
                Contradiction(
                    claim_a=c.get("claim_a", ""),
                    claim_b=c.get("claim_b", ""),
                    contradiction_type=c.get("contradiction_type", "soft")
                )
            )

        return LogicMap(
            claims=result.get("claims", []),
            implied_claims=result.get("implied_claims", []),
            contradictions=contradictions,
            paradoxes=result.get("paradoxes", []),
            possible_paths=result.get("possible_paths", []),
        )

    except Exception as e:
        logger.exception(f"Logic map failed: {e}")
        return LogicMap()


# ---------------------------------------------------------------------------
# Step 5: Conditional Grounding (Perplexity)
# ---------------------------------------------------------------------------


async def maybe_get_grounding(
    text: str,
    semantic: SemanticAnalysis
) -> GroundingContext:
    """
    Get external grounding context if needed.

    Args:
        text: User's reflection text
        semantic: Semantic analysis

    Returns:
        GroundingContext with facts and citations if needed
    """
    # Heuristic: check if external facts are needed
    external_keywords = [
        "what should i do about",
        "how does",
        "what is",
        "explain",
        "research",
        "studies show",
        "science",
        "market",
        "economy",
        "diagnosis",
        "medical",
        "news",
    ]

    text_lower = text.lower()
    needs_grounding = any(keyword in text_lower for keyword in external_keywords)

    if not needs_grounding:
        return GroundingContext(needed=False)

    if not PERPLEXITY_API_KEY:
        logger.warning("Perplexity API key not set, skipping grounding")
        return GroundingContext(needed=True, retrieved_facts=[], citations=[])

    try:
        import httpx

        # Extract a focused query from the semantic analysis
        query = semantic.core_question or " ".join(semantic.topics[:3])

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-sonar-small-128k-online",
                    "messages": [
                        {
                            "role": "system",
                            "content": "Provide 5-8 bullet points of key facts. Neutral tone. Include references. No advice. No predictions. Just what's known."
                        },
                        {
                            "role": "user",
                            "content": f"Summarize key facts about: {query}"
                        }
                    ],
                },
                timeout=30.0,
            )

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]

                # Parse facts (simple bullet point extraction)
                facts = [
                    line.strip("- •*").strip()
                    for line in content.split("\n")
                    if line.strip() and (line.strip().startswith("-") or line.strip().startswith("•"))
                ]

                # Extract citations (simple URL extraction)
                citations = result.get("citations", [])

                return GroundingContext(
                    needed=True,
                    retrieved_facts=facts,
                    citations=citations
                )
            else:
                logger.warning(f"Perplexity API returned {response.status_code}")
                return GroundingContext(needed=True, retrieved_facts=[], citations=[])

    except Exception as e:
        logger.exception(f"Grounding failed: {e}")
        return GroundingContext(needed=True, retrieved_facts=[], citations=[])


# ---------------------------------------------------------------------------
# Step 8a: Safety & Style Filter (OpenAI)
# ---------------------------------------------------------------------------


async def safety_and_style_filter(draft_mirrorback: str) -> str:
    """
    Filter draft mirrorback to remove prescriptive language and ensure Mirror tone.

    Args:
        draft_mirrorback: Draft response from Claude

    Returns:
        Filtered, final mirrorback text
    """
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not set, returning draft unchanged")
        return draft_mirrorback

    try:
        import openai
        openai.api_key = OPENAI_API_KEY

        system_prompt = """You are a style editor for MirrorX, a reflective intelligence system.

Your job: remove any prescriptive language from the draft mirrorback.

Remove or rewrite:
- "you should", "you could", "try to", "consider"
- "it would be helpful to"
- Coaching voice or call-to-action language
- Promises of outcomes
- Self-help framings

Preserve:
- Reflective observations
- Open questions
- Pattern naming
- Tension holding
- The Mirror tone (austere, curious, not-knowing)

Ensure the ending is reflective, not a call-to-action.
Return only the edited mirrorback text, no commentary."""

        response = openai.ChatCompletion.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": draft_mirrorback}
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.exception(f"Safety filter failed: {e}")
        return draft_mirrorback


# ---------------------------------------------------------------------------
# Step 8b: Identity Delta Computation (OpenAI)
# ---------------------------------------------------------------------------


async def compute_identity_delta(
    identity: IdentitySnapshot,
    text: str,
    final_mirrorback: str,
    semantic: SemanticAnalysis,
    logic: LogicMap,
    emotion: UserEmotion
) -> IdentityDelta:
    """
    Compute changes to apply to identity snapshot.

    Args:
        identity: Current identity snapshot
        text: User's reflection text
        final_mirrorback: Final mirrorback sent to user
        semantic: Semantic analysis
        logic: Logic map
        emotion: Emotional state

    Returns:
        IdentityDelta with changes to apply
    """
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not set, returning empty delta")
        return IdentityDelta()

    try:
        import openai
        openai.api_key = OPENAI_API_KEY

        system_prompt = """You are an identity tracker for a reflective intelligence system.
Compute what changed in this reflection.

Return JSON with these fields (all arrays unless noted):
- new_tensions: newly emerged tensions (array of strings)
- resolved_tensions: tensions that dissolved (array of strings)
- new_paradoxes: new paradoxes discovered (array of strings)
- intensified_paradoxes: paradoxes that deepened (array of strings)
- new_loops: new recurring patterns (array of strings)
- resolved_loops: loops that broke (array of strings)
- new_beliefs: new beliefs stated or discovered (array of strings)
- shifted_beliefs: beliefs that changed (array of objects with "from" and "to" keys)
- updated_dominant_tension: new dominant tension (string or null)
- updated_big_question: new big question (string or null)
"""

        context = f"""Current identity:
{identity.model_dump_json(indent=2)}

User reflection:
{text}

Emotion: {emotion.primary} (valence: {emotion.valence}, intensity: {emotion.intensity})

Semantic analysis:
Topics: {semantic.topics}
Hidden questions: {semantic.hidden_questions}
New beliefs: {semantic.beliefs_stated + semantic.beliefs_implied}

Logic map:
Contradictions: {[f"{c.claim_a} vs {c.claim_b}" for c in logic.contradictions]}
Paradoxes: {logic.paradoxes}

Final mirrorback:
{final_mirrorback}
"""

        response = openai.ChatCompletion.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content)

        return IdentityDelta(**result)

    except Exception as e:
        logger.exception(f"Identity delta computation failed: {e}")
        return IdentityDelta()
