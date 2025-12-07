"""
Core data structures for the MirrorX Conductor.

The Conductor orchestrates multiple AI providers to create
a layered, reflective intelligence system.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Emotional Analysis
# ---------------------------------------------------------------------------


class UserEmotion(BaseModel):
    """Emotional signature from Hume or tone analysis."""

    primary: str = Field(..., description="Primary emotion (e.g., 'frustrated', 'conflicted')")
    secondary: Optional[str] = Field(None, description="Secondary emotion if present")
    valence: float = Field(..., ge=-1.0, le=1.0, description="Emotional valence from -1 (negative) to +1 (positive)")
    arousal: float = Field(..., ge=0.0, le=1.0, description="Emotional arousal/intensity from 0 to 1")
    intensity: float = Field(..., ge=0.0, le=1.0, description="Overall emotional intensity")


# ---------------------------------------------------------------------------
# Identity & Memory
# ---------------------------------------------------------------------------


class IdentitySnapshot(BaseModel):
    """User's evolving identity state across reflections."""

    tensions: List[str] = Field(
        default_factory=list,
        description="Named tensions (e.g., 'control vs surrender')"
    )
    paradoxes: List[str] = Field(
        default_factory=list,
        description="Coexisting contradictions (e.g., 'wants certainty / believes in unknowing')"
    )
    goals: List[str] = Field(default_factory=list, description="Stated or implied goals")
    recurring_loops: List[str] = Field(
        default_factory=list,
        description="Patterns that keep recurring (e.g., 'keeps asking if they are behind')"
    )
    regressions: List[str] = Field(
        default_factory=list,
        description="Moments where user slides back into old patterns"
    )
    last_reflections: List[str] = Field(
        default_factory=list,
        description="Last N mirrorback summaries for continuity"
    )
    dominant_tension: Optional[str] = Field(None, description="Current most active tension")
    big_question: Optional[str] = Field(None, description="Current overarching question")
    emotional_baseline: Optional[str] = Field(None, description="Typical emotional state")
    oscillation_pattern: Optional[str] = Field(None, description="Primary oscillation poles")


class TensionDelta(BaseModel):
    """A tension to be created."""
    label: str
    type: Literal["paradox", "conflict", "identity", "goal"] = "paradox"
    pole_a: Optional[str] = None
    pole_b: Optional[str] = None


class IdentityDelta(BaseModel):
    """Changes to apply to an IdentitySnapshot after a reflection.

    This matches the SQL schema for apply_identity_delta procedure.
    """

    # Tensions
    new_tensions: List[TensionDelta] = Field(default_factory=list)
    intensified_tensions: List[str] = Field(default_factory=list)
    softened_tensions: List[str] = Field(default_factory=list)
    resolved_tensions: List[str] = Field(default_factory=list)

    # Loops
    new_loops: List[str] = Field(default_factory=list)
    reinforced_loops: List[str] = Field(default_factory=list)
    weakened_loops: List[str] = Field(default_factory=list)
    broken_loops: List[str] = Field(default_factory=list)

    # Beliefs
    new_beliefs: List[str] = Field(default_factory=list)
    softened_beliefs: List[str] = Field(default_factory=list)
    reframed_beliefs: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of dicts with 'from' and 'to' keys"
    )
    rejected_beliefs: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Semantic Analysis
# ---------------------------------------------------------------------------


class SemanticAnalysis(BaseModel):
    """Structured extraction of what the user is talking about."""

    topics: List[str] = Field(default_factory=list, description="Main topics mentioned")
    core_question: Optional[str] = Field(None, description="The explicit question being asked")
    hidden_questions: List[str] = Field(
        default_factory=list,
        description="What they're really asking beneath the surface"
    )
    beliefs_stated: List[str] = Field(
        default_factory=list,
        description="Explicit beliefs ('I think...', 'I believe...')"
    )
    beliefs_implied: List[str] = Field(
        default_factory=list,
        description="Implicit beliefs ('I'll never...', 'I always...')"
    )
    self_stories: List[str] = Field(
        default_factory=list,
        description="Narratives about self ('I am the type of person who...')"
    )


# ---------------------------------------------------------------------------
# Logic & Paradox Mapping
# ---------------------------------------------------------------------------


class Contradiction(BaseModel):
    """A detected contradiction between two claims."""

    claim_a: str
    claim_b: str
    contradiction_type: Literal["hard", "soft"] = Field(
        ...,
        description="'hard' = cannot both be true; 'soft' = tension but can coexist"
    )


class LogicMap(BaseModel):
    """Logical structure and contradictions in the reflection."""

    claims: List[str] = Field(default_factory=list, description="Explicit claims made")
    implied_claims: List[str] = Field(default_factory=list, description="Implied or assumed claims")
    contradictions: List[Contradiction] = Field(
        default_factory=list,
        description="Hard or soft contradictions detected"
    )
    paradoxes: List[str] = Field(
        default_factory=list,
        description="Productive paradoxes (not-yet-resolved tensions)"
    )
    possible_paths: List[str] = Field(
        default_factory=list,
        description="Ways this thinking could evolve or be explored"
    )


# ---------------------------------------------------------------------------
# Grounding Context
# ---------------------------------------------------------------------------


class GroundingContext(BaseModel):
    """External facts and context when needed."""

    needed: bool = Field(False, description="Whether grounding was requested or needed")
    retrieved_facts: List[str] = Field(default_factory=list, description="Key facts retrieved")
    citations: List[str] = Field(default_factory=list, description="Source citations")


# ---------------------------------------------------------------------------
# Tone Decision
# ---------------------------------------------------------------------------


class ToneDecision(BaseModel):
    """How MirrorX should respond tonally."""

    mirror_tone: Literal["soft", "direct", "playful", "austere", "silent", "provocative"] = Field(
        ...,
        description="The tone MirrorX should adopt"
    )
    intensity: Literal["low", "medium", "high"] = Field(
        ...,
        description="How intense or forceful the reflection should be"
    )
    focus: Literal["emotion", "logic", "story", "paradox"] = Field(
        ...,
        description="What aspect to center the reflection around"
    )


# ---------------------------------------------------------------------------
# Orchestrator Bundle
# ---------------------------------------------------------------------------


class OrchestratorBundle(BaseModel):
    """Complete analysis bundle from all providers."""

    emotion: UserEmotion
    identity: IdentitySnapshot
    semantic: SemanticAnalysis
    logic: LogicMap
    grounding: GroundingContext
    tone: ToneDecision


# ---------------------------------------------------------------------------
# Final Output
# ---------------------------------------------------------------------------


class ConductorResult(BaseModel):
    """The final output from the conductor orchestration."""

    mirrorback: str = Field(..., description="The final reflective response to the user")
    reflection_id: str = Field(..., description="UUID of the stored reflection")
    bundle: OrchestratorBundle = Field(..., description="Complete analysis bundle")
    identity_updated: IdentitySnapshot = Field(..., description="Updated identity snapshot")
    identity_delta: IdentityDelta = Field(..., description="Changes applied to identity")
    lint_passed: bool = Field(..., description="Whether MirrorCore linting passed")
    lint_violations: List[str] = Field(default_factory=list, description="Any lint violations")
