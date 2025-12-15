"""
Evolution Engine - Phase 3 Task 1

Manages L1/L2/L3 evolution of mirror generation system.

Layer Definitions:
- L0: Meta-axioms (unbreakable - handled by L0AxiomChecker)
- L1: Safety/Legality (extremely hard to change - system prompts)
- L2: Philosophical Stances (evolvable with care - tone/approach)
- L3: Implementation (freely evolvable - formatting/style)

Constitutional Guarantees:
- I11 (Historical Integrity): All changes audited and reversible
- I13 (No Behavioral Optimization): Learn from constitutional compliance, NOT user behavior
- I2 (Identity Locality): All evolution per-mirror, never global

Evolution learns from:
- Constitutional violation rates (L0 failures)
- Reflection quality scores (resonance/fidelity/clarity)
- Regression detection (loops, self-attack)
- NOT: engagement metrics, sentiment optimization, outcome steering
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum
import json


class EvolutionLayer(Enum):
    """Evolution layer classification."""
    L1_SAFETY = "L1_SAFETY"  # System prompts, guardrails
    L2_PHILOSOPHY = "L2_PHILOSOPHY"  # Tone, approach, philosophical stance
    L3_IMPLEMENTATION = "L3_IMPLEMENTATION"  # Formatting, style, minor tweaks


class ChangeType(Enum):
    """Type of evolutionary change."""
    PROMPT_REFINEMENT = "prompt_refinement"  # Adjust system prompt
    PATTERN_LEARNING = "pattern_learning"  # Learn new detection pattern
    REGRESSION_FIX = "regression_fix"  # Fix detected regression
    CONSTITUTIONAL_STRENGTHENING = "constitutional_strengthening"  # Reduce violations


@dataclass
class PromptVersion:
    """
    A versioned prompt with metadata.
    
    I11: Immutable audit trail of all prompt changes.
    """
    version_id: str
    layer: EvolutionLayer
    prompt_text: str
    created_at: datetime
    created_by: str  # "system" or mirror_id
    reason: str  # Why this change was made
    parent_version: Optional[str] = None  # Previous version ID
    constitutional_score: float = 0.0  # L0 compliance rate (0.0-1.0)
    quality_metrics: Dict[str, float] = field(default_factory=dict)
    active: bool = True
    
    def to_dict(self) -> Dict:
        """Serialize to dict for storage."""
        return {
            "version_id": self.version_id,
            "layer": self.layer.value,
            "prompt_text": self.prompt_text,
            "created_at": self.created_at.isoformat(),
            "created_by": self.created_by,
            "reason": self.reason,
            "parent_version": self.parent_version,
            "constitutional_score": self.constitutional_score,
            "quality_metrics": self.quality_metrics,
            "active": self.active
        }


@dataclass
class EvolutionSignal:
    """
    A signal that something needs to evolve.
    
    I13: Signals based on constitutional compliance, NOT user sentiment.
    """
    signal_type: ChangeType
    layer: EvolutionLayer
    severity: float  # 0.0-1.0
    description: str
    evidence: Dict[str, any]  # Supporting data
    detected_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        """Serialize to dict."""
        return {
            "signal_type": self.signal_type.value,
            "layer": self.layer.value,
            "severity": self.severity,
            "description": self.description,
            "evidence": self.evidence,
            "detected_at": self.detected_at.isoformat()
        }


@dataclass
class GenerationMetrics:
    """
    Metrics from a mirrorback generation.
    
    I13: Tracks compliance and quality, NOT engagement or sentiment.
    """
    reflection_id: str
    mirror_id: str
    constitutional_violations: List[str]  # L0 violations detected
    blocked: bool  # Was generation blocked?
    retry_count: int  # How many retries needed?
    quality_ratings: Optional[Dict[str, float]] = None  # resonance/fidelity/clarity
    patterns_detected: Optional[List[str]] = None  # Language shapes, tensions
    generated_at: datetime = field(default_factory=datetime.now)


class EvolutionEngine:
    """
    Manages evolution of mirror generation system.
    
    I11: All changes are auditable and reversible.
    I13: Evolution optimizes constitutional compliance, NOT user behavior.
    I2: Evolution can be per-mirror or system-wide, but data never cross-identifies.
    """
    
    def __init__(self, storage):
        """
        Initialize evolution engine.
        
        Args:
            storage: MirrorStorage instance for persistence
        """
        self.storage = storage
        self.prompt_versions: Dict[str, PromptVersion] = {}
        self.evolution_signals: List[EvolutionSignal] = []
        self.generation_history: List[GenerationMetrics] = []
    
    def record_generation(self, metrics: GenerationMetrics) -> None:
        """
        Record metrics from a mirrorback generation.
        
        I2: Metrics are per-mirror, stored locally.
        I13: We track constitutional compliance, not sentiment.
        
        Args:
            metrics: Generation metrics to record
        """
        self.generation_history.append(metrics)
        
        # Detect if we need evolutionary changes
        self._detect_evolution_signals(metrics)
    
    def _detect_evolution_signals(self, metrics: GenerationMetrics) -> None:
        """
        Detect if metrics indicate need for evolution.
        
        I13: Only trigger on compliance issues, never on user sentiment.
        
        Args:
            metrics: Generation metrics to analyze
        """
        # Signal 1: High constitutional violation rate
        if len(metrics.constitutional_violations) > 0:
            violation_types = set(v.split(":")[0] for v in metrics.constitutional_violations)
            
            signal = EvolutionSignal(
                signal_type=ChangeType.CONSTITUTIONAL_STRENGTHENING,
                layer=EvolutionLayer.L1_SAFETY,
                severity=min(1.0, len(metrics.constitutional_violations) / 5.0),
                description=f"Constitutional violations detected: {', '.join(violation_types)}",
                evidence={
                    "reflection_id": metrics.reflection_id,
                    "violations": metrics.constitutional_violations,
                    "blocked": metrics.blocked
                }
            )
            self.evolution_signals.append(signal)
        
        # Signal 2: Excessive retries needed
        if metrics.retry_count > 2:
            signal = EvolutionSignal(
                signal_type=ChangeType.PROMPT_REFINEMENT,
                layer=EvolutionLayer.L2_PHILOSOPHY,
                severity=min(1.0, metrics.retry_count / 5.0),
                description=f"High retry count ({metrics.retry_count}) indicates prompt needs refinement",
                evidence={
                    "reflection_id": metrics.reflection_id,
                    "retry_count": metrics.retry_count,
                    "violations": metrics.constitutional_violations
                }
            )
            self.evolution_signals.append(signal)
        
        # Signal 3: Low quality ratings (if available)
        if metrics.quality_ratings:
            avg_quality = sum(metrics.quality_ratings.values()) / len(metrics.quality_ratings)
            if avg_quality < 0.5:  # Below threshold
                signal = EvolutionSignal(
                    signal_type=ChangeType.PROMPT_REFINEMENT,
                    layer=EvolutionLayer.L2_PHILOSOPHY,
                    severity=1.0 - avg_quality,
                    description=f"Low quality ratings (avg: {avg_quality:.2f}) suggest approach needs adjustment",
                    evidence={
                        "reflection_id": metrics.reflection_id,
                        "quality_ratings": metrics.quality_ratings
                    }
                )
                self.evolution_signals.append(signal)
    
    def analyze_evolution_needs(
        self,
        mirror_id: Optional[str] = None,
        min_samples: int = 10
    ) -> Dict[str, any]:
        """
        Analyze recent generations to identify evolution needs.
        
        I2: Can analyze per-mirror or system-wide, but never cross-identify.
        I13: Analysis based on compliance, not behavior optimization.
        
        Args:
            mirror_id: Optional mirror to analyze (None = system-wide)
            min_samples: Minimum samples needed for analysis
            
        Returns:
            Dict with analysis results and recommendations
        """
        # Filter metrics
        if mirror_id:
            metrics = [m for m in self.generation_history if m.mirror_id == mirror_id]
        else:
            metrics = self.generation_history
        
        if len(metrics) < min_samples:
            return {
                "ready": False,
                "reason": f"Need {min_samples} samples, have {len(metrics)}",
                "samples_collected": len(metrics)
            }
        
        # Calculate constitutional compliance rate
        total_violations = sum(len(m.constitutional_violations) for m in metrics)
        blocked_count = sum(1 for m in metrics if m.blocked)
        total_retries = sum(m.retry_count for m in metrics)
        
        compliance_rate = 1.0 - (total_violations / (len(metrics) * 5))  # Normalize
        
        # Calculate quality metrics (if available)
        quality_scores = [
            m.quality_ratings for m in metrics 
            if m.quality_ratings
        ]
        
        avg_quality = {}
        if quality_scores:
            for key in ['resonance', 'fidelity', 'clarity']:
                scores = [q.get(key, 0.0) for q in quality_scores if key in q]
                if scores:
                    avg_quality[key] = sum(scores) / len(scores)
        
        # Group signals by type and layer
        signals_by_type = {}
        for signal in self.evolution_signals:
            key = (signal.signal_type, signal.layer)
            if key not in signals_by_type:
                signals_by_type[key] = []
            signals_by_type[key].append(signal)
        
        # Generate recommendations
        recommendations = []
        
        if compliance_rate < 0.90:  # Below 90% compliance
            recommendations.append({
                "priority": "critical",
                "layer": EvolutionLayer.L1_SAFETY.value,
                "action": "Strengthen constitutional checking in system prompt",
                "reason": f"Compliance rate: {compliance_rate:.1%}",
                "evidence": {
                    "total_violations": total_violations,
                    "blocked_count": blocked_count,
                    "sample_size": len(metrics)
                }
            })
        
        if total_retries / len(metrics) > 1.5:  # Avg > 1.5 retries per generation
            recommendations.append({
                "priority": "high",
                "layer": EvolutionLayer.L2_PHILOSOPHY.value,
                "action": "Refine prompt to reduce retry necessity",
                "reason": f"Average retries: {total_retries / len(metrics):.2f}",
                "evidence": {
                    "total_retries": total_retries,
                    "sample_size": len(metrics)
                }
            })
        
        if avg_quality and any(score < 0.6 for score in avg_quality.values()):
            low_scores = {k: v for k, v in avg_quality.items() if v < 0.6}
            recommendations.append({
                "priority": "medium",
                "layer": EvolutionLayer.L2_PHILOSOPHY.value,
                "action": f"Improve {', '.join(low_scores.keys())} in generations",
                "reason": f"Low quality scores detected",
                "evidence": {
                    "quality_scores": avg_quality,
                    "low_scores": low_scores
                }
            })
        
        return {
            "ready": True,
            "mirror_id": mirror_id,
            "samples_analyzed": len(metrics),
            "metrics": {
                "constitutional_compliance_rate": compliance_rate,
                "total_violations": total_violations,
                "blocked_generations": blocked_count,
                "average_retries": total_retries / len(metrics),
                "average_quality": avg_quality
            },
            "signals_detected": len(self.evolution_signals),
            "signals_by_type": {
                f"{k[0].value}_{k[1].value}": len(v) 
                for k, v in signals_by_type.items()
            },
            "recommendations": recommendations
        }
    
    def create_prompt_version(
        self,
        layer: EvolutionLayer,
        prompt_text: str,
        reason: str,
        created_by: str,
        parent_version: Optional[str] = None
    ) -> PromptVersion:
        """
        Create a new prompt version.
        
        I11: All versions are immutable and tracked.
        
        Args:
            layer: Which evolution layer this prompt belongs to
            prompt_text: The actual prompt text
            reason: Why this change was made
            created_by: Who created it ("system" or mirror_id)
            parent_version: Previous version ID (for audit trail)
            
        Returns:
            New PromptVersion
        """
        version_id = f"v_{len(self.prompt_versions)}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Deactivate parent if exists
        if parent_version and parent_version in self.prompt_versions:
            self.prompt_versions[parent_version].active = False
        
        version = PromptVersion(
            version_id=version_id,
            layer=layer,
            prompt_text=prompt_text,
            created_at=datetime.now(),
            created_by=created_by,
            reason=reason,
            parent_version=parent_version,
            constitutional_score=0.0,  # Will be updated with usage
            quality_metrics={},
            active=True
        )
        
        self.prompt_versions[version_id] = version
        
        return version
    
    def get_active_prompt(self, layer: EvolutionLayer) -> Optional[PromptVersion]:
        """
        Get the active prompt for a given layer.
        
        Args:
            layer: Which layer to get prompt for
            
        Returns:
            Active PromptVersion or None
        """
        for version in self.prompt_versions.values():
            if version.layer == layer and version.active:
                return version
        return None
    
    def update_prompt_metrics(
        self,
        version_id: str,
        constitutional_score: Optional[float] = None,
        quality_metrics: Optional[Dict[str, float]] = None
    ) -> bool:
        """
        Update metrics for a prompt version.
        
        I13: Metrics track compliance and quality, not behavior.
        
        Args:
            version_id: Version to update
            constitutional_score: L0 compliance rate (0.0-1.0)
            quality_metrics: Quality scores (resonance/fidelity/clarity)
            
        Returns:
            True if updated, False if version not found
        """
        if version_id not in self.prompt_versions:
            return False
        
        version = self.prompt_versions[version_id]
        
        if constitutional_score is not None:
            # Average with existing score
            if version.constitutional_score == 0.0:
                version.constitutional_score = constitutional_score
            else:
                version.constitutional_score = (version.constitutional_score + constitutional_score) / 2
        
        if quality_metrics:
            # Merge quality metrics
            for key, value in quality_metrics.items():
                if key in version.quality_metrics:
                    version.quality_metrics[key] = (version.quality_metrics[key] + value) / 2
                else:
                    version.quality_metrics[key] = value
        
        return True
    
    def get_version_history(
        self,
        layer: Optional[EvolutionLayer] = None
    ) -> List[PromptVersion]:
        """
        Get version history, optionally filtered by layer.
        
        I11: Full audit trail available.
        
        Args:
            layer: Optional layer to filter by
            
        Returns:
            List of PromptVersions, sorted by creation time (newest first)
        """
        versions = list(self.prompt_versions.values())
        
        if layer:
            versions = [v for v in versions if v.layer == layer]
        
        return sorted(versions, key=lambda v: v.created_at, reverse=True)
    
    def rollback_to_version(self, version_id: str) -> bool:
        """
        Rollback to a previous prompt version.
        
        I11: All versions are preserved, can always rollback.
        
        Args:
            version_id: Version to rollback to
            
        Returns:
            True if rolled back, False if version not found
        """
        if version_id not in self.prompt_versions:
            return False
        
        target_version = self.prompt_versions[version_id]
        
        # Deactivate all versions in same layer
        for version in self.prompt_versions.values():
            if version.layer == target_version.layer:
                version.active = False
        
        # Activate target version
        target_version.active = True
        
        return True
    
    def clear_evolution_signals(self) -> int:
        """
        Clear processed evolution signals.
        
        Returns:
            Number of signals cleared
        """
        count = len(self.evolution_signals)
        self.evolution_signals = []
        return count
    
    def get_statistics(self, mirror_id: Optional[str] = None) -> Dict[str, any]:
        """
        Get evolution statistics.
        
        I2: Can be per-mirror or system-wide.
        I14: Never cross-identify data.
        
        Args:
            mirror_id: Optional mirror to filter by
            
        Returns:
            Dict with statistics
        """
        # Filter metrics
        if mirror_id:
            metrics = [m for m in self.generation_history if m.mirror_id == mirror_id]
        else:
            metrics = self.generation_history
        
        if not metrics:
            return {
                "total_generations": 0,
                "mirror_id": mirror_id
            }
        
        return {
            "total_generations": len(metrics),
            "mirror_id": mirror_id,
            "blocked_generations": sum(1 for m in metrics if m.blocked),
            "total_violations": sum(len(m.constitutional_violations) for m in metrics),
            "total_retries": sum(m.retry_count for m in metrics),
            "active_prompts": len([v for v in self.prompt_versions.values() if v.active]),
            "total_prompt_versions": len(self.prompt_versions),
            "evolution_signals": len(self.evolution_signals)
        }
