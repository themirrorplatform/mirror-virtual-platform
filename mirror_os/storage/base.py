"""
THE MIRROR: STORAGE ABSTRACTION LAYER
Constitutional Enforcement: I1 (Data Sovereignty), I2 (Identity Locality), 
                           I5 (No Lock-in), I14 (No Cross-Identity Inference)

CRITICAL CONSTRAINTS:
1. ALL methods must be identity-scoped (mirror_id required)
2. NO global aggregation across identities
3. NO cross-identity queries (I14 violation)
4. Export must be complete and semantic (I5 enforcement)
5. System must function 100% offline (I1 enforcement)

This is the abstract interface. Implementations MUST enforce these constraints.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum


# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class NodeType(str, Enum):
    """Identity graph node types"""
    THOUGHT = "thought"
    BELIEF = "belief"
    EMOTION = "emotion"
    ACTION = "action"
    EXPERIENCE = "experience"
    CONSEQUENCE = "consequence"


class EdgeType(str, Enum):
    """Identity graph edge types"""
    CAUSES = "causes"
    CONTRADICTS = "contradicts"
    SUPPORTS = "supports"
    FOLLOWS_FROM = "follows_from"
    LED_TO = "led_to"
    DEPENDS_ON = "depends_on"
    CONFLICTS_WITH = "conflicts_with"
    REINFORCES = "reinforces"


class ShapeOrigin(str, Enum):
    """Language shape origin tracking (I9: Anti-diagnosis)"""
    SYSTEM_SEED = "system_seed"
    USER_NAMED = "user_named"
    MODEL_SUGGESTED = "model_suggested"


class TensionOrigin(str, Enum):
    """Tension origin tracking"""
    SYSTEM_SEED = "system_seed"
    USER_DEFINED = "user_defined"
    DISCOVERED = "discovered"


class FeedbackType(str, Enum):
    """
    Engine feedback types (I13: Constitutional/mechanical only)
    FORBIDDEN: 'not_helpful', 'want_more_advice', 'need_goal_setting'
    """
    DRIFT_DETECTED = "drift_detected"
    OVER_ADVICE = "over_advice"
    UNDER_REFLECTION = "under_reflection"
    TONE_MISMATCH = "tone_mismatch"
    CONSTITUTIONAL_CONCERN = "constitutional_concern"
    FEATURE_REQUEST = "feature_request"
    REGRESSION_NOTICED = "regression_noticed"


class EvolutionEventType(str, Enum):
    """Evolution event classification"""
    CONSTITUTION_UPDATE = "constitution_update"  # L0/L1 - requires guardian
    PROMPT_MODIFICATION = "prompt_modification"  # L2 - requires user consent
    CONFIG_ADJUSTMENT = "config_adjustment"      # L3 - automatic, reversible
    USER_ROLLBACK = "user_rollback"
    FORK_CREATED = "fork_created"


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Mirror:
    """Core Mirror instance (I1: User owns everything)"""
    id: str
    owner_id: str
    label: Optional[str]
    created_at: str  # ISO timestamp string
    last_active_at: str  # ISO timestamp string
    
    # Constitutional tracking
    mirrorcore_version: str
    constitution_hash: str
    constitution_version: str
    
    # Semantic export (I5: No lock-in)
    prompt_templates: Optional[Dict[str, Any]]
    lens_definitions: Optional[Dict[str, Any]]
    user_renames: Optional[Dict[str, str]]
    
    # Fork tracking
    last_export_at: Optional[str]  # ISO timestamp string
    forked_from: Optional[str]
    fork_constitution_verified: bool
    
    # Layer independence
    platform_connected: bool
    works_offline: bool  # MUST always be True


@dataclass
class MirrorNode:
    """Identity graph node (I2: Identity-local)"""
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    node_type: NodeType
    summary: Optional[str]
    content: str  # JSON stored as TEXT
    confidence_score: Optional[float]
    occurred_at: Optional[str]  # ISO timestamp string
    occurred_at_confidence: str
    version: int
    previous_version_id: Optional[str]
    is_current: bool
    created_at: str  # ISO timestamp string
    updated_at: str  # ISO timestamp string


@dataclass
class MirrorEdge:
    """Identity graph edge (I2: Must be within same mirror)"""
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    source_node_id: str
    target_node_id: str
    edge_type: EdgeType
    strength: Optional[float]
    confidence: Optional[float]
    discovered_at: str  # ISO timestamp string
    discovered_by: str
    version: int
    is_current: bool
    created_at: str  # ISO timestamp string


@dataclass
class LanguageShape:
    """
    Language shape (I9: NOT diagnosis)
    Neutral language lens with user ownership
    """
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    name: str
    system_name: Optional[str]
    description: Optional[str]
    origin: ShapeOrigin
    
    # User ownership (I2, I9)
    user_renamed: bool
    user_hidden: bool
    user_merged_into: Optional[str]
    
    occurrence_count: int
    last_observed_at: Optional[str]  # ISO timestamp string
    disclaimer: str  # "This is a lens, not a diagnosis"
    created_at: str  # ISO timestamp string
    updated_at: str  # ISO timestamp string


@dataclass
class Tension:
    """Tension duality (I9: Descriptive, not evaluative)"""
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    axis_a: str
    axis_b: str
    current_position: float  # -1 to +1
    position_confidence: Optional[float]
    origin: TensionOrigin
    user_renamed: bool
    user_hidden: bool
    created_at: str  # ISO timestamp string
    updated_at: str  # ISO timestamp string


@dataclass
class Reflection:
    """User input (I1: User owns)"""
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    thread_id: Optional[str]
    content: str
    context: Optional[Dict[str, Any]]  # Additional metadata
    created_at: str  # ISO timestamp string


@dataclass
class Mirrorback:
    """
    AI reflection (I2: Reflection only, never prescription)
    Must pass constitutional checks before storage
    """
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    reflection_id: str
    content: str
    
    # Detection results
    detected_shapes: Optional[List[str]]  # Language shape IDs
    detected_tensions: Optional[Dict[str, float]]  # Tension ID -> position
    context: Optional[Dict[str, Any]]  # Additional metadata
    
    # User feedback (I13: Resonance/fidelity/clarity ONLY)
    rating_resonance: Optional[int]
    rating_fidelity: Optional[int]
    rating_clarity: Optional[int]
    
    created_at: str  # ISO timestamp string


@dataclass
class EngineRun:
    """
    Engine execution telemetry (I7, I13: Mechanical metrics ONLY)
    NO behavioral optimization allowed
    """
    id: str
    mirror_id: str  # REQUIRED for I2 enforcement
    reflection_id: Optional[str]
    
    engine_version: str
    constitution_hash: str
    
    # Execution metrics (I13: Mechanical performance only)
    started_at: str  # ISO timestamp string
    completed_at: Optional[str]  # ISO timestamp string
    duration_ms: Optional[int]
    success: bool
    error_message: Optional[str]
    
    # Constitutional compliance metrics (I7, I13: Allowed)
    constitutional_checks_run: int
    constitutional_violations_detected: int
    violation_types: Optional[List[str]]
    
    # Language shapes detected (I14: No content, only IDs)
    language_shapes_detected: Optional[List[Dict[str, Any]]]
    
    model_used: Optional[str]
    tokens_used: Optional[int]
    
    # Sync metadata (Layer 3, optional)
    sync_allowed: bool
    sync_packet_id: Optional[str]
    
    created_at: str  # ISO timestamp string


@dataclass
class ExportBundle:
    """
    Complete Mirror export (I5: No lock-in)
    Must include semantic meaning, not just data
    """
    mirror_id: str
    export_timestamp: str  # ISO timestamp string
    
    # Database snapshot
    database_path: str
    
    # Semantic components (REQUIRED for I5)
    constitution_version: str
    constitution_hash: str
    prompt_templates: Dict[str, Any]
    lens_definitions: Dict[str, Any]
    user_renames: Dict[str, str]
    
    # Configuration
    config: Dict[str, Any]
    
    # Verification
    bundle_hash: str
    mirrorcore_version: str


# ============================================================================
# STORAGE ABSTRACT BASE CLASS
# ============================================================================

class MirrorStorage(ABC):
    """
    Abstract storage interface for The Mirror
    
    CONSTITUTIONAL CONSTRAINTS:
    - ALL methods are identity-scoped (mirror_id parameter)
    - NO cross-identity aggregation (I14 violation)
    - NO global queries without mirror_id
    - Export must be complete and semantic (I5)
    - Must function 100% offline (I1)
    """
    
    # ========================================================================
    # MIRROR MANAGEMENT (I1: Data Sovereignty)
    # ========================================================================
    
    @abstractmethod
    def create_mirror(
        self,
        owner_id: str,
        label: Optional[str],
        mirrorcore_version: str,
        constitution_hash: str,
        constitution_version: str
    ) -> Mirror:
        """
        Create new Mirror instance.
        Must set works_offline=True (I1 enforcement).
        """
        pass
    
    @abstractmethod
    def get_mirror(self, mirror_id: str) -> Optional[Mirror]:
        """Get Mirror by ID. Returns None if not found."""
        pass
    
    @abstractmethod
    def list_mirrors(self, owner_id: str) -> List[Mirror]:
        """
        List all Mirrors for an owner.
        NO cross-owner queries allowed (I2, I14).
        """
        pass
    
    @abstractmethod
    def update_mirror(
        self,
        mirror_id: str,
        **updates
    ) -> Mirror:
        """Update Mirror metadata. Cannot change owner_id or works_offline."""
        pass
    
    @abstractmethod
    def delete_mirror(self, mirror_id: str) -> bool:
        """
        Delete Mirror and ALL associated data (CASCADE).
        I1 enforcement: User owns and can delete everything.
        """
        pass
    
    # ========================================================================
    # IDENTITY GRAPH (I2: Identity-local only)
    # ========================================================================
    
    @abstractmethod
    def create_node(
        self,
        mirror_id: str,
        node_type: NodeType,
        content: Dict[str, Any],
        summary: Optional[str] = None,
        confidence_score: Optional[float] = None,
        occurred_at: Optional[datetime] = None
    ) -> MirrorNode:
        """Create identity graph node. Must belong to mirror_id."""
        pass
    
    @abstractmethod
    def get_node(self, node_id: str, mirror_id: str) -> Optional[MirrorNode]:
        """
        Get node by ID.
        MUST verify node belongs to mirror_id (I2 enforcement).
        """
        pass
    
    @abstractmethod
    def list_nodes(
        self,
        mirror_id: str,
        node_type: Optional[NodeType] = None,
        is_current: bool = True,
        limit: Optional[int] = None
    ) -> List[MirrorNode]:
        """
        List nodes for a Mirror.
        NO cross-mirror queries (I2, I14 enforcement).
        """
        pass
    
    @abstractmethod
    def update_node(
        self,
        node_id: str,
        mirror_id: str,
        **updates
    ) -> MirrorNode:
        """
        Update node. Creates new version if content changes.
        MUST verify ownership (I2).
        """
        pass
    
    @abstractmethod
    def create_edge(
        self,
        mirror_id: str,
        source_node_id: str,
        target_node_id: str,
        edge_type: EdgeType,
        strength: Optional[float] = None,
        discovered_by: str = "user_stated"
    ) -> MirrorEdge:
        """
        Create edge between nodes.
        MUST verify both nodes belong to mirror_id (I2 enforcement).
        Trigger will reject if not.
        """
        pass
    
    @abstractmethod
    def list_edges(
        self,
        mirror_id: str,
        source_node_id: Optional[str] = None,
        target_node_id: Optional[str] = None,
        edge_type: Optional[EdgeType] = None
    ) -> List[MirrorEdge]:
        """List edges for a Mirror. NO cross-mirror queries (I2)."""
        pass
    
    # ========================================================================
    # LANGUAGE SHAPES (I9: Anti-diagnosis)
    # ========================================================================
    
    @abstractmethod
    def create_language_shape(
        self,
        mirror_id: str,
        name: str,
        origin: ShapeOrigin,
        description: Optional[str] = None,
        system_name: Optional[str] = None
    ) -> LanguageShape:
        """
        Create language shape.
        I9: Must include disclaimer "This is a lens, not a diagnosis".
        """
        pass
    
    @abstractmethod
    def get_language_shape(
        self,
        shape_id: str,
        mirror_id: str
    ) -> Optional[LanguageShape]:
        """Get shape. MUST verify ownership (I2)."""
        pass
    
    @abstractmethod
    def list_language_shapes(
        self,
        mirror_id: str,
        include_hidden: bool = False,
        origin: Optional[ShapeOrigin] = None
    ) -> List[LanguageShape]:
        """
        List language shapes for Mirror.
        Can filter by origin, exclude hidden (I9: User control).
        """
        pass
    
    @abstractmethod
    def update_language_shape(
        self,
        shape_id: str,
        mirror_id: str,
        **updates
    ) -> LanguageShape:
        """
        Update shape (rename, hide, merge).
        I9: User has full control over their lenses.
        """
        pass
    
    @abstractmethod
    def record_shape_occurrence(
        self,
        shape_id: str,
        node_id: str,
        confidence: float,
        context_snippet: Optional[str] = None
    ) -> str:
        """
        Record when shape appears.
        Trigger will verify shape and node belong to same mirror (I2).
        """
        pass
    
    # ========================================================================
    # TENSIONS (I9: Descriptive dualities)
    # ========================================================================
    
    @abstractmethod
    def create_tension(
        self,
        mirror_id: str,
        axis_a: str,
        axis_b: str,
        current_position: float,
        origin: TensionOrigin
    ) -> Tension:
        """
        Create tension duality.
        I9: Position is descriptive, not evaluative.
        """
        pass
    
    @abstractmethod
    def list_tensions(
        self,
        mirror_id: str,
        include_hidden: bool = False
    ) -> List[Tension]:
        """List tensions for Mirror."""
        pass
    
    @abstractmethod
    def update_tension(
        self,
        tension_id: str,
        mirror_id: str,
        **updates
    ) -> Tension:
        """Update tension (rename, hide, change position)."""
        pass
    
    @abstractmethod
    def record_tension_measurement(
        self,
        tension_id: str,
        position: float,
        confidence: Optional[float] = None,
        context_node_id: Optional[str] = None,
        measured_by: str = "user_reported"
    ) -> str:
        """Record tension position measurement over time."""
        pass
    
    # ========================================================================
    # REFLECTIONS & THREADS
    # ========================================================================
    
    @abstractmethod
    def create_thread(
        self,
        mirror_id: str,
        title: Optional[str] = None
    ) -> str:
        """Create conversation thread."""
        pass
    
    @abstractmethod
    def create_reflection(
        self,
        mirror_id: str,
        content: str,
        thread_id: Optional[str] = None,
        visibility: str = "private"
    ) -> Reflection:
        """Create user reflection (I1: User owns content)."""
        pass
    
    @abstractmethod
    def list_reflections(
        self,
        mirror_id: str,
        thread_id: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> List[Reflection]:
        """List reflections for Mirror. NO cross-mirror queries (I2)."""
        pass
    
    # ========================================================================
    # MIRRORBACKS (I2: Reflection only)
    # ========================================================================
    
    @abstractmethod
    def create_mirrorback(
        self,
        mirror_id: str,
        reflection_id: str,
        content: str,
        constitutional_check_passed: bool,
        directive_ratio: Optional[float],
        imperative_intent_detected: bool,
        outcome_steering_detected: bool,
        engine_version: str,
        model_used: str,
        constitutional_violations: Optional[List[str]] = None,
        **metadata
    ) -> Mirrorback:
        """
        Store Mirrorback ONLY if constitutional check passed.
        I2: Must enforce reflection-only constraint.
        """
        pass
    
    @abstractmethod
    def get_mirrorback(
        self,
        mirrorback_id: str,
        mirror_id: str
    ) -> Optional[Mirrorback]:
        """Get Mirrorback. MUST verify ownership (I2)."""
        pass
    
    @abstractmethod
    def list_mirrorbacks(
        self,
        mirror_id: str,
        reflection_id: Optional[str] = None,
        constitutional_check_passed: Optional[bool] = None,
        limit: Optional[int] = None
    ) -> List[Mirrorback]:
        """List Mirrorbacks. NO cross-mirror queries (I2)."""
        pass
    
    @abstractmethod
    def update_mirrorback_rating(
        self,
        mirrorback_id: str,
        mirror_id: str,
        rating_resonance: Optional[int] = None,
        rating_fidelity: Optional[int] = None,
        rating_clarity: Optional[int] = None,
        feedback: Optional[str] = None
    ) -> Mirrorback:
        """
        Update Mirrorback user feedback.
        I13: ONLY resonance/fidelity/clarity, NOT helpfulness.
        """
        pass
    
    # ========================================================================
    # TELEMETRY (I7, I13, I14: Mechanical metrics ONLY)
    # ========================================================================
    
    @abstractmethod
    def create_engine_run(
        self,
        mirror_id: str,
        engine_version: str,
        constitution_hash: str,
        started_at: datetime,
        success: bool,
        **metrics
    ) -> EngineRun:
        """
        Log engine execution.
        I13: ONLY mechanical/constitutional metrics.
        NO behavioral optimization data.
        """
        pass
    
    @abstractmethod
    def create_engine_feedback(
        self,
        mirror_id: str,
        feedback_type: FeedbackType,
        severity_self_rating: int,
        feedback_text: Optional[str] = None,
        engine_run_id: Optional[str] = None,
        mirrorback_id: Optional[str] = None
    ) -> str:
        """
        Record user feedback.
        I13: Constitutional/mechanical concerns ONLY.
        FORBIDDEN: behavioral optimization feedback.
        """
        pass
    
    # ========================================================================
    # EVOLUTION (I4, I6: Community evolution, no regression)
    # ========================================================================
    
    @abstractmethod
    def create_evolution_event(
        self,
        mirror_id: str,
        event_type: EvolutionEventType,
        component: str,
        from_version: Optional[str],
        to_version: str,
        change_description: str,
        requires_consent: bool,
        reversible: bool,
        **metadata
    ) -> str:
        """
        Log evolution event.
        I6: Must specify if reversible.
        I4: Must track consent for breaking changes.
        """
        pass
    
    @abstractmethod
    def list_evolution_events(
        self,
        mirror_id: str,
        event_type: Optional[EvolutionEventType] = None,
        rollback_available: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """List evolution history for Mirror."""
        pass
    
    # ========================================================================
    # CONSTITUTIONAL AUDIT (I11: Historical integrity)
    # ========================================================================
    
    @abstractmethod
    def log_constitutional_check(
        self,
        mirror_id: str,
        check_type: str,
        invariants_checked: List[str],
        all_passed: bool,
        violations_detected: Optional[List[str]] = None,
        severity: str = "none",
        context_id: Optional[str] = None,
        context_type: Optional[str] = None
    ) -> str:
        """
        Log constitutional check (I11: Immutable audit trail).
        NEVER delete these records.
        """
        pass
    
    @abstractmethod
    def get_constitutional_audit(
        self,
        mirror_id: str,
        check_type: Optional[str] = None,
        all_passed: Optional[bool] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Query constitutional audit log."""
        pass
    
    # ========================================================================
    # EXPORT/IMPORT (I5: No lock-in)
    # ========================================================================
    
    @abstractmethod
    def export_mirror(
        self,
        mirror_id: str,
        output_path: str
    ) -> ExportBundle:
        """
        Export complete Mirror to ZIP bundle.
        I5: MUST include semantic meaning (constitution + prompts + lenses).
        I5: Must be restorable to identical Mirror elsewhere.
        """
        pass
    
    @abstractmethod
    def import_mirror(
        self,
        bundle_path: str,
        new_owner_id: str
    ) -> Mirror:
        """
        Import Mirror from bundle.
        I5: Must restore semantic meaning, not just data.
        Verifies constitution hash.
        """
        pass
    
    # ========================================================================
    # UTILITY
    # ========================================================================
    
    @abstractmethod
    def verify_mirror_locality(
        self,
        mirror_id: str,
        *resource_ids: str
    ) -> bool:
        """
        Verify that all resources belong to mirror_id.
        I2 enforcement utility.
        """
        pass
    
    @abstractmethod
    def get_storage_stats(
        self,
        mirror_id: str
    ) -> Dict[str, Any]:
        """
        Get storage statistics for Mirror.
        I13: Mechanical metrics only (counts, sizes, not behavioral).
        """
        pass
