"""
Event Schema for Mirror Identity System

This module defines the canonical event schema for the append-only event log.
Identity state is derived by replaying events, never stored authoritatively.

Architecture:
- Server stores append-only signed event log
- Local Mirror derives identity graph from events
- Sync = replay, never merge

Design Principles:
- Events are immutable facts
- Identity is a computed view
- No server-side inference
- Perfect auditability
"""

from dataclasses import dataclass, field, asdict
from typing import Literal, Optional, Any
from datetime import datetime
from uuid import uuid4
import hashlib
import json


# Event Types
EventType = Literal[
    "reflection_created",
    "metadata_declared",
    "annotation_consented",
    "voice_transcribed",
    "pattern_surfaced",
    "posture_declared"
]


@dataclass
class BaseEvent:
    """Base class for all events in the system."""
    
    event_id: str = field(default_factory=lambda: str(uuid4()))
    instance_id: str = ""
    user_id: str = ""
    event_type: EventType = "reflection_created"
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    
    # Signature (signed by instance private key)
    signature: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        d = asdict(self)
        # Remove signature for signing
        if 'signature' in d and d['signature'] is not None:
            d.pop('signature')
        return d
    
    def canonical_bytes(self) -> bytes:
        """
        Generate canonical byte representation for signing.
        Uses sorted keys, no whitespace.
        """
        d = self.to_dict()
        canonical_json = json.dumps(d, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        return canonical_json.encode('utf-8')
    
    def content_hash(self) -> str:
        """Generate SHA-256 hash of canonical representation."""
        return hashlib.sha256(self.canonical_bytes()).hexdigest()


@dataclass
class ReflectionCreatedEvent(BaseEvent):
    """User created a new reflection (text, voice, video, etc.)."""
    
    event_type: EventType = "reflection_created"
    
    # Content
    content: str = ""  # Text content or transcript
    modality: Literal["text", "voice", "video", "document"] = "text"
    
    # Metadata
    metadata: dict = field(default_factory=dict)
    # Example metadata:
    # {
    #   "word_count": 150,
    #   "language": "en",
    #   "duration_seconds": 42,  # For voice/video
    #   "voice_tone": {...}       # Optional tone analysis
    # }
    
    # Original artifact handling
    artifact_preserved: bool = False
    artifact_hash: Optional[str] = None  # SHA-256 of raw audio/video if preserved


@dataclass
class MetadataDeclaredEvent(BaseEvent):
    """User explicitly declared metadata about themselves."""
    
    event_type: EventType = "metadata_declared"
    
    # What they declared
    metadata_type: Literal["goal", "value", "preference", "boundary"] = "goal"
    content: str = ""
    
    # Context
    confidence: Optional[float] = None  # 0.0-1.0, user's confidence in this declaration


@dataclass
class AnnotationConsentedEvent(BaseEvent):
    """User consented to an annotation/insight from MirrorX."""
    
    event_type: EventType = "annotation_consented"
    
    # What annotation
    annotation_type: Literal["tension", "paradox", "pattern", "belief", "loop"] = "tension"
    annotation_content: str = ""
    
    # Source
    generated_by: str = "mirrorx"  # Which system generated this
    generation_context: dict = field(default_factory=dict)
    
    # Consent
    user_consent: Literal["accepted", "rejected", "modified"] = "accepted"
    user_modification: Optional[str] = None  # If they modified it


@dataclass
class VoiceTranscribedEvent(BaseEvent):
    """Voice input was transcribed to text."""
    
    event_type: EventType = "voice_transcribed"
    
    # Transcription
    transcript: str = ""
    transcription_provider: Literal["whisper", "deepgram"] = "deepgram"
    confidence: float = 0.0
    
    # Audio metadata
    duration_seconds: float = 0.0
    language: str = "en"
    
    # Optional: word-level timestamps
    word_timestamps: list = field(default_factory=list)
    
    # Artifact
    audio_preserved: bool = False
    audio_hash: Optional[str] = None


@dataclass
class PatternSurfacedEvent(BaseEvent):
    """MirrorX surfaced a pattern (user can accept/reject)."""
    
    event_type: EventType = "pattern_surfaced"
    
    # Pattern details
    pattern_type: Literal["recurring_theme", "contradiction", "growth", "regression"] = "recurring_theme"
    pattern_description: str = ""
    
    # Evidence
    supporting_reflection_ids: list = field(default_factory=list)
    confidence: float = 0.0
    
    # User response (can be None if not yet responded)
    user_response: Optional[Literal["resonates", "off", "skip"]] = None


@dataclass
class PostureDeclaredEvent(BaseEvent):
    """User declared their current posture."""
    
    event_type: EventType = "posture_declared"
    
    # Posture
    posture: Literal["open", "closed", "seeking", "integrating", "rest", "challenge"] = "open"
    
    # Context
    reason: Optional[str] = None
    duration_intent: Optional[str] = None  # "until I feel X", "for 3 days"


# Event Factory
def create_event(event_type: EventType, **kwargs) -> BaseEvent:
    """Factory to create the correct event type."""
    
    event_classes = {
        "reflection_created": ReflectionCreatedEvent,
        "metadata_declared": MetadataDeclaredEvent,
        "annotation_consented": AnnotationConsentedEvent,
        "voice_transcribed": VoiceTranscribedEvent,
        "pattern_surfaced": PatternSurfacedEvent,
        "posture_declared": PostureDeclaredEvent
    }
    
    event_class = event_classes.get(event_type)
    if not event_class:
        raise ValueError(f"Unknown event type: {event_type}")
    
    return event_class(**kwargs)


# Event Serialization
def serialize_event(event: BaseEvent) -> str:
    """Serialize event to canonical JSON string."""
    return json.dumps(event.to_dict(), sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def deserialize_event(json_str: str) -> BaseEvent:
    """Deserialize event from JSON string."""
    data = json.loads(json_str)
    event_type = data.get('event_type')
    return create_event(event_type, **data)


# Event Validation
class EventValidator:
    """Validates events meet schema requirements."""
    
    @staticmethod
    def validate(event: BaseEvent) -> tuple[bool, Optional[str]]:
        """
        Validate an event.
        Returns: (is_valid, error_message)
        """
        
        # Check required fields
        if not event.event_id:
            return False, "event_id is required"
        
        if not event.instance_id:
            return False, "instance_id is required"
        
        if not event.user_id:
            return False, "user_id is required"
        
        if not event.timestamp:
            return False, "timestamp is required"
        
        # Validate timestamp format (ISO8601)
        try:
            datetime.fromisoformat(event.timestamp.rstrip('Z'))
        except ValueError:
            return False, f"Invalid timestamp format: {event.timestamp}"
        
        # Type-specific validation
        if isinstance(event, ReflectionCreatedEvent):
            if not event.content:
                return False, "content is required for reflection_created"
        
        elif isinstance(event, MetadataDeclaredEvent):
            if not event.content:
                return False, "content is required for metadata_declared"
        
        elif isinstance(event, VoiceTranscribedEvent):
            if not event.transcript:
                return False, "transcript is required for voice_transcribed"
            if event.duration_seconds <= 0:
                return False, "duration_seconds must be positive"
        
        return True, None
