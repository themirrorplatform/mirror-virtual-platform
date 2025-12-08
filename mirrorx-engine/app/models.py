from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class ReflectRequest(BaseModel):
    """
    Request payload for /api/reflect.

    user_id:
        UUID of the user as a string.

    reflection_text:
        Raw text input from the user (their reflection).
    """

    user_id: str = Field(..., description="User UUID as string")
    reflection_text: str = Field(..., description="User reflection text")


class UserCreateRequest(BaseModel):
    """
    Request payload for /api/user/create.

    name:
        Optional display name for the user.
    """

    name: Optional[str] = Field(None, description="Optional user name")


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------


class ReflectResponse(BaseModel):
    """
    Response payload for /api/reflect.

    reflection_id:
        UUID of the created reflection, or None if the request was diverted
        by the safety layer.

    mirrorback:
        The generated reflective response (NOT advice).

    tone:
        Detected tone label.

    lint_passed:
        Whether MirrorCore linting passed.

    lint_violations:
        List of regex patterns that were violated, if any.

    evolution_events:
        List of detected evolution events (growth, loop, tension shift, etc.)

    tensions:
        Current active tensions for this user.

    loops:
        Current recurring loops for this user.

    identity_delta_summary:
        Human-readable summary of what changed in identity (optional).
    """

    reflection_id: Optional[str]
    mirrorback: str
    tone: str
    lint_passed: bool
    lint_violations: List[str] = Field(default_factory=list)
    evolution_events: List[str] = Field(default_factory=list)
    tensions: List[str] = Field(default_factory=list)
    loops: List[str] = Field(default_factory=list)
    identity_delta_summary: Optional[str] = None


class UserCreateResponse(BaseModel):
    """
    Response payload for /api/user/create.
    """

    user_id: str


class UserHistoryItem(BaseModel):
    """
    Combined view of a reflection and its mirrorback.

    reflection_id:
        UUID of the reflection.

    reflection_text:
        Original user reflection content.

    reflection_tone:
        Detected tone at time of reflection.

    reflection_timestamp:
        Timestamp string of the reflection.

    mirrorback_text:
        Mirrorback content if available.

    mirrorback_themes:
        List of themes surfaced by the mirrorback (if stored).

    mirrorback_timestamp:
        Timestamp string of the mirrorback.
    """

    reflection_id: str
    reflection_text: str
    reflection_tone: Optional[str]
    reflection_timestamp: Optional[str]
    mirrorback_text: Optional[str]
    mirrorback_themes: List[str] = Field(default_factory=list)
    mirrorback_timestamp: Optional[str]
    reflection_tone_snapshot: Optional[Dict[str, Any]] = None


class UserHistoryResponse(BaseModel):
    """
    Response payload for /api/user/{user_id}/history.
    """

    user_id: str
    items: List[UserHistoryItem]
    overall_themes: List[str] = Field(default_factory=list)
