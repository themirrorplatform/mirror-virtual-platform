"""
Pydantic models for The Mirror Virtual Platform API.
These models define the shape of data flowing through the platform.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


# ────────────────────────────────────────────────────────────────────────────
# ENUMS
# ────────────────────────────────────────────────────────────────────────────

class ReflectionVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    UNLISTED = "unlisted"


class SignalType(str, Enum):
    RESONATED = "resonated"
    CHALLENGED = "challenged"
    SKIPPED = "skipped"
    SAVED = "saved"
    JUDGMENT_SPIKE = "judgment_spike"


class SafetySeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class RegressionType(str, Enum):
    LOOP = "loop"
    SELF_ATTACK = "self_attack"
    JUDGMENT_SPIKE = "judgment_spike"
    AVOIDANCE = "avoidance"


# ────────────────────────────────────────────────────────────────────────────
# CORE MODELS
# ────────────────────────────────────────────────────────────────────────────

class Profile(BaseModel):
    id: str
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProfileCreate(BaseModel):
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class Reflection(BaseModel):
    id: int
    author_id: str
    body: str
    lens_key: Optional[str] = None
    visibility: ReflectionVisibility = ReflectionVisibility.PUBLIC
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ReflectionCreate(BaseModel):
    body: str
    lens_key: Optional[str] = None
    visibility: ReflectionVisibility = ReflectionVisibility.PUBLIC
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Mirrorback(BaseModel):
    id: int
    reflection_id: int
    author_id: str
    body: str
    tone: Optional[str] = None
    tensions: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class MirrorbackCreate(BaseModel):
    reflection_id: int


class ReflectionSignal(BaseModel):
    id: int
    reflection_id: int
    user_id: str
    signal: SignalType
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ReflectionSignalCreate(BaseModel):
    reflection_id: int
    signal: SignalType
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ────────────────────────────────────────────────────────────────────────────
# INTELLIGENCE MODELS
# ────────────────────────────────────────────────────────────────────────────

class BiasInsight(BaseModel):
    id: int
    identity_id: str
    reflection_id: Optional[int] = None
    dimension: str
    direction: str
    confidence: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


class SafetyEvent(BaseModel):
    id: int
    identity_id: Optional[str] = None
    reflection_id: Optional[int] = None
    category: str
    severity: SafetySeverity
    action_taken: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class RegressionMarker(BaseModel):
    id: int
    identity_id: str
    reflection_id: Optional[int] = None
    kind: RegressionType
    description: Optional[str] = None
    severity: int = 1
    pattern_id: Optional[str] = None
    created_at: datetime


# ────────────────────────────────────────────────────────────────────────────
# FEED MODELS
# ────────────────────────────────────────────────────────────────────────────

class FeedItem(BaseModel):
    """A reflection in the feed with enriched metadata."""
    reflection: Reflection
    author: Profile
    mirrorback_count: int = 0
    signal_counts: Dict[str, int] = Field(default_factory=dict)
    user_signal: Optional[SignalType] = None
    score: float = 0.0  # Algorithm score for ranking


class FeedResponse(BaseModel):
    items: List[FeedItem]
    next_cursor: Optional[int] = None


# ────────────────────────────────────────────────────────────────────────────
# RESPONSE MODELS
# ────────────────────────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None
