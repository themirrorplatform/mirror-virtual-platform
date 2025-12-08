"""
MirrorX Mirrorback Engine - Data Models

Defines the structures for MirrorbackPlan, MirrorbackSynthesis, and the 6-step ceremony.
"""

from typing import List, Optional, Dict, Any, Literal
from dataclasses import dataclass, field
from pydantic import BaseModel, Field


# ============================================================================
# MIRRORBACK PLAN (Internal Structure - What Claude Uses)
# ============================================================================

class ObservationPlan(BaseModel):
    """Plan for Observation step: name what's here."""
    focus: List[str] = Field(default_factory=list, description="e.g. ['felt_state', 'core_question', 'implicit_belief']")
    notes: List[str] = Field(default_factory=list, description="Key observations to ground in")


class OpeningPlan(BaseModel):
    """Plan for Opening step: how to sit with this."""
    mode: Literal["soft", "direct", "playful", "austere", "silent"] = "soft"
    goal: str = Field(default="", description="e.g. 'make them feel seen without resolving'")


class ThreadingPlan(BaseModel):
    """Plan for Threading step: connect to wider patterns."""
    use_identity: bool = True
    prior_tensions_to_reference: List[str] = Field(default_factory=list)
    prior_loops_to_reference: List[str] = Field(default_factory=list)
    themes_to_weave: List[str] = Field(default_factory=list)


class ContradictionPlan(BaseModel):
    """Plan for Contradiction step: surface tensions."""
    surface: bool = True
    hard_contradictions: List[str] = Field(default_factory=list)
    soft_paradoxes: List[str] = Field(default_factory=list)


class ExpansionPlan(BaseModel):
    """Plan for Expansion step: offer more space."""
    directions: List[str] = Field(default_factory=list, description="Inner and outer reframings")
    grounding_to_include: bool = False


class ReturnPlan(BaseModel):
    """Plan for Return step: land in open state."""
    question_type: Literal["locating", "choice", "paradox", "body", "time"] = "locating"
    constraints: List[str] = Field(default_factory=lambda: ["no advice", "no outcome promises"])


class MirrorbackPlan(BaseModel):
    """
    Internal blueprint Claude uses to build the mirrorback.
    Invisible to user, guides Claude's structure.
    """
    observation: ObservationPlan = Field(default_factory=ObservationPlan)
    opening: OpeningPlan = Field(default_factory=OpeningPlan)
    threading: ThreadingPlan = Field(default_factory=ThreadingPlan)
    contradiction: ContradictionPlan = Field(default_factory=ContradictionPlan)
    expansion: ExpansionPlan = Field(default_factory=ExpansionPlan)
    return_step: ReturnPlan = Field(default_factory=ReturnPlan)


# ============================================================================
# MIRRORBACK SYNTHESIS (GPT Output)
# ============================================================================

class SynthesisSummary(BaseModel):
    """High-level distillation of the user's state."""
    emotional_state: str = Field(description="e.g. 'frustrated but still hopeful'")
    surface_question: Optional[str] = None
    hidden_question: Optional[str] = None
    key_beliefs: List[str] = Field(default_factory=list)


class TensionReference(BaseModel):
    """A tension from identity graph."""
    label: str
    pole_a: Optional[str] = None
    pole_b: Optional[str] = None


class SynthesisThreading(BaseModel):
    """Threading plan from synthesis."""
    relevant_tensions: List[TensionReference] = Field(default_factory=list)
    relevant_loops: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    growth_signals: List[str] = Field(default_factory=list)
    regression_signals: List[str] = Field(default_factory=list)


class SynthesisContradictions(BaseModel):
    """Contradictions and paradoxes from synthesis."""
    hard_contradictions: List[str] = Field(default_factory=list)
    soft_paradoxes: List[str] = Field(default_factory=list)


class ExpansionDirections(BaseModel):
    """Ways to expand perspective."""
    inner_directions: List[str] = Field(default_factory=list, description="Inner reframings")
    outer_directions: List[str] = Field(default_factory=list, description="Contextual framings")
    grounding_points: List[str] = Field(default_factory=list, description="Facts to situate in")


class SynthesisReturn(BaseModel):
    """Return step from synthesis."""
    question_type: Literal["locating", "choice", "paradox", "body", "time"] = "locating"
    suggested_questions: List[str] = Field(default_factory=list)


class SynthesisTone(BaseModel):
    """Tone and voice guidance for Claude."""
    mirror_tone: Literal["soft", "direct", "playful", "austere", "silent", "provocative"] = "soft"
    intensity: Literal["low", "medium", "high"] = "medium"
    focus: Literal["emotion", "logic", "story", "paradox"] = "story"
    notes_for_voice: str = Field(default="")


class MirrorbackSynthesis(BaseModel):
    """
    GPT produces this JSON blueprint for Claude.
    Tells Claude what to emphasize in each step and how to sound.
    """
    summary: SynthesisSummary
    threading: SynthesisThreading
    contradictions_and_paradoxes: SynthesisContradictions
    expansion_directions: ExpansionDirections
    return_step: SynthesisReturn
    tone: SynthesisTone


# ============================================================================
# ORCHESTRATOR BUNDLE (Input to Synthesis)
# ============================================================================

class EmotionSnapshot(BaseModel):
    """Emotional state from Hume/OpenAI tone detection."""
    primary_emotion: str
    secondary_emotion: Optional[str] = None
    valence: float = Field(ge=-1.0, le=1.0)
    arousal: float = Field(ge=0.0, le=1.0)
    intensity: float = Field(ge=0.0, le=1.0)


class IdentitySnapshot(BaseModel):
    """User's identity graph snapshot."""
    tensions_summary: List[Dict[str, Any]] = Field(default_factory=list)
    contradictions_summary: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    emotional_signature: str = Field(default="")
    preferred_tone: str = Field(default="soft")
    openness_level: float = Field(ge=0.0, le=1.0, default=0.5)
    regression_markers: List[str] = Field(default_factory=list)
    progression_markers: List[str] = Field(default_factory=list)


class SemanticSnapshot(BaseModel):
    """Semantic analysis of user's text."""
    core_question: Optional[str] = None
    hidden_question: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    explicit_beliefs: List[str] = Field(default_factory=list)
    implicit_beliefs: List[str] = Field(default_factory=list)
    self_stories: List[str] = Field(default_factory=list)


class LogicSnapshot(BaseModel):
    """Logic map from semantic analysis."""
    claims: List[str] = Field(default_factory=list)
    implied_claims: List[str] = Field(default_factory=list)
    contradictions: List[tuple] = Field(default_factory=list)
    paradoxes: List[str] = Field(default_factory=list)


class GroundingSnapshot(BaseModel):
    """External facts/context."""
    needed: bool = False
    retrieved_facts: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)


class ToneDecision(BaseModel):
    """Tone choice for this reflection."""
    mirror_tone: Literal["soft", "direct", "playful", "austere", "silent"] = "soft"
    intensity: Literal["low", "medium", "high"] = "medium"
    focus: Literal["emotion", "logic", "story", "paradox"] = "story"


class EvolutionSnapshot(BaseModel):
    """User's growth/stagnation/loop state."""
    recent_events: List[Dict[str, Any]] = Field(default_factory=list)
    growth_score: float = Field(ge=0.0, le=1.0, default=0.5)
    stagnation_score: float = Field(ge=0.0, le=1.0, default=0.3)
    loop_score: float = Field(ge=0.0, le=1.0, default=0.2)
    regression_score: float = Field(ge=0.0, le=1.0, default=0.1)
    breakthrough_score: float = Field(ge=0.0, le=1.0, default=0.0)
    blindspot_score: float = Field(ge=0.0, le=1.0, default=0.3)


class OrchestratorBundle(BaseModel):
    """
    Complete input to synthesis.
    Built by orchestrator from all provider outputs.
    """
    user_text: str
    emotion: EmotionSnapshot
    identity: IdentitySnapshot
    semantic: SemanticSnapshot
    logic: LogicSnapshot
    grounding: GroundingSnapshot
    tone_decision: ToneDecision
    evolution: EvolutionSnapshot


# ============================================================================
# MIRRORBACK RESPONSE
# ============================================================================

class MirrorbackResponse(BaseModel):
    """Final mirrorback response to user."""
    text: str = Field(description="The polished mirrorback reflection")
    ceremony_used: List[str] = Field(
        default_factory=lambda: ["observation", "opening", "threading", "contradiction", "expansion", "return"],
        description="Which ceremony steps were used"
    )
    synthesis_json: Optional[Dict[str, Any]] = None
    lint_passed: bool = True
    lint_violations: List[str] = Field(default_factory=list)
