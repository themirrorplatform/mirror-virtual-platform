"""
MirrorX API - Pydantic Request/Response Schemas

Defines all request and response contracts between frontend and backend.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# ============================================================================
# MIRRORBACK ENDPOINT
# ============================================================================

class MirrorbackRequest(BaseModel):
    """Request body for POST /mirrorback"""
    user_id: str = Field(..., description="User ID")
    text: str = Field(..., description="User's reflection input")
    conversation_id: Optional[str] = Field(None, description="Thread/conversation ID")
    offline_only: bool = Field(False, description="Force offline-only mode (no cloud)")


class TensionSummary(BaseModel):
    """Represents a tension/polarity the user is holding"""
    label: str
    strength: float = Field(0.0, ge=0.0, le=1.0)
    type: str  # e.g. 'polarity', 'conflict', 'ambivalence'


class LoopMarker(BaseModel):
    """Represents a recursive pattern or loop"""
    loop: str
    last_seen: Optional[datetime] = None


class EvolutionSignal(BaseModel):
    """Signal of growth, stagnation, or pattern change"""
    type: str  # 'growth' | 'loop' | 'regression' | 'breakthrough' | 'blindspot' | 'stagnation'
    label: str
    severity: float = Field(0.5, ge=0.0, le=1.0)


class EmotionalState(BaseModel):
    """Emotional signature from current reflection"""
    average_valence: Optional[float] = Field(None, ge=-1.0, le=1.0)
    average_arousal: Optional[float] = Field(None, ge=0.0, le=1.0)
    volatility: Optional[float] = Field(None, ge=0.0, le=1.0)
    recent_primary_emotions: Optional[List[str]] = Field(None)
    intensity: Optional[float] = Field(None, ge=0.0, le=1.0)


class MirrorbackResponse(BaseModel):
    """Response from POST /mirrorback"""
    reflection_id: str
    conversation_id: str
    mirrorback: str = Field(..., description="The generated reflection")
    created_at: datetime

    # Light profile/evolution info for UI display
    tensions: List[TensionSummary] = Field(default_factory=list)
    loops: List[LoopMarker] = Field(default_factory=list)
    evolution_signals: List[EvolutionSignal] = Field(default_factory=list)
    emotional_state: Optional[EmotionalState] = None

    # Metadata
    lint_passed: bool = Field(True, description="Whether response passed guardrails")
    lint_violations: List[str] = Field(default_factory=list)


# ============================================================================
# PROFILE ENDPOINTS
# ============================================================================

class ThreadHistoryEntry(BaseModel):
    """Entry in thread history"""
    thread_id: str
    title: str
    last_active: datetime
    reflection_count: int


class ProfileResponse(BaseModel):
    """Response from GET /api/profile/me"""
    user_id: str
    preferred_tone: str = "warm"
    openness_level: float = Field(0.5, ge=0.0, le=1.0)

    # Pattern summaries
    tensions_summary: List[TensionSummary] = Field(default_factory=list)
    contradictions_summary: List[Dict[str, Any]] = Field(default_factory=list)
    themes: List[Dict[str, Any]] = Field(default_factory=list)

    # Emotional signature (aggregated)
    emotional_signature: Optional[EmotionalState] = None

    # Evolution tracking
    regression_markers: List[LoopMarker] = Field(default_factory=list)
    progression_markers: List[Dict[str, Any]] = Field(default_factory=list)

    # Threading
    thread_history: List[ThreadHistoryEntry] = Field(default_factory=list)

    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================================================
# THREAD ENDPOINTS
# ============================================================================

class ThreadSummary(BaseModel):
    """Summary of a conversation thread"""
    id: str
    title: str
    last_active: Optional[datetime] = None
    reflection_count: int = 0
    created_at: Optional[datetime] = None


class ThreadsResponse(BaseModel):
    """Response from GET /api/threads"""
    threads: List[ThreadSummary]


class ReflectionSummary(BaseModel):
    """Summary of a single reflection in a thread"""
    id: str
    created_at: datetime
    input_text: str
    mirrorback_text: Optional[str] = None
    conversation_id: str


class ThreadReflectionsResponse(BaseModel):
    """Response from GET /api/threads/{threadId}/reflections"""
    thread: ThreadSummary
    reflections: List[ReflectionSummary]


# ============================================================================
# ERROR RESPONSES
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    code: Optional[str] = None
    status_code: int


class HealthResponse(BaseModel):
    """Response from GET /api/health"""
    status: str  # 'ok' | 'degraded' | 'down'
    orchestrator: str  # 'conductor' | 'legacy'
    local_models_available: bool
    providers: Dict[str, bool] = Field(default_factory=dict)
    timestamp: datetime


# ============================================================================
# UTILITY
# ============================================================================

class StatusResponse(BaseModel):
    """Simple status response"""
    status: str
    message: Optional[str] = None
