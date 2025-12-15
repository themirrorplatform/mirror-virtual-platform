# mirror_os/services/fork_learning.py
"""
Fork Learning: Aggregate Insights from Constitutional Forks

Learns from successful forks to improve the constitution and system.

Constitutional principles:
- No fork is "wrong" (diversity is valuable)
- Track what works (success patterns)
- Aggregated learning (k-anonymity for fork creators)
- Transparent insights (published to Commons)

Features:
- Fork pattern detection (what amendments succeed)
- Success metrics (fork adoption, longevity, community size)
- Amendment recommendations (data-driven improvements)
- Evolution insights (how the constitution adapts)
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import Counter, defaultdict
import logging

logger = logging.getLogger(__name__)


@dataclass
class ForkPattern:
    """Pattern detected across multiple forks"""
    pattern_id: str
    description: str
    amendments: List[str]  # Common amendments
    success_rate: float  # Forks with this pattern that succeeded
    adoption_count: int  # How many forks have this pattern
    first_seen: datetime
    examples: List[str] = field(default_factory=list)  # Fork IDs


@dataclass
class ForkSuccessMetrics:
    """Metrics for evaluating fork success"""
    fork_id: str
    creation_date: datetime
    longevity_days: int  # How long fork has survived
    active_users: int  # Number of active identities
    reflection_count: int  # Total reflections generated
    constitutional_score: float  # Average L0+L1 compliance
    community_growth_rate: float  # User growth per month
    fork_children: int  # How many forks of this fork
    success_score: float  # Composite success metric


@dataclass
class AmendmentRecommendation:
    """Data-driven amendment recommendation"""
    recommendation_id: str
    title: str
    rationale: str
    supporting_forks: List[str]  # Forks that implemented this
    success_rate: float
    estimated_impact: str
    proposed_text: str
    confidence: float  # 0.0 to 1.0


class ForkLearningEngine:
    """
    Learn from constitutional forks to evolve the system.
    
    Design:
    - Track all forks (legitimate branches)
    - Measure success (longevity, adoption, compliance)
    - Detect patterns (common amendments)
    - Generate recommendations (data-driven improvements)
    - Publish insights (transparent learning)
    """
    
    def __init__(self, storage_path: Path, recognition_registry):
        """
        Initialize fork learning engine.
        
        Args:
            storage_path: Storage for learning data
            recognition_registry: Registry of forks
        """
        self.storage_path = storage_path
        self.registry = recognition_registry
        
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Load learning data
        self.patterns: Dict[str, ForkPattern] = self._load_patterns()
        self.metrics: Dict[str, ForkSuccessMetrics] = self._load_metrics()
        self.recommendations: List[AmendmentRecommendation] = []
        
        # Stats
        self.stats = {
            'forks_analyzed': 0,
            'patterns_detected': 0,
            'recommendations_generated': 0,
            'successful_forks': 0,
            'failed_forks': 0,
        }
    
    def analyze_all_forks(self) -> Dict[str, Any]:
        """
        Analyze all forks in registry and generate insights.
        
        Returns:
            Analysis summary
        """
        logger.info("Starting fork analysis...")
        
        # Get all forks from registry
        forks = self.registry.fork_records
        
        # Analyze each fork
        for fork_id, fork_record in forks.items():
            self._analyze_fork(fork_id, fork_record)
        
        # Detect patterns
        self._detect_patterns()
        
        # Generate recommendations
        self._generate_recommendations()
        
        # Save results
        self._save_patterns()
        self._save_metrics()
        
        logger.info(f"Fork analysis complete. {len(self.patterns)} patterns detected.")
        
        return {
            'forks_analyzed': len(forks),
            'patterns_detected': len(self.patterns),
            'recommendations': len(self.recommendations),
            'successful_forks': self.stats['successful_forks'],
            'insights': self._generate_insights_summary(),
        }
    
    def _analyze_fork(self, fork_id: str, fork_record) -> ForkSuccessMetrics:
        """
        Analyze individual fork and compute success metrics.
        
        Args:
            fork_id: Fork identifier
            fork_record: Fork data from registry
        
        Returns:
            Success metrics
        """
        # Calculate longevity
        creation_date = fork_record.forked_at
        longevity = (datetime.utcnow() - creation_date).days
        
        # Calculate success score
        # (Placeholder - would query actual fork instance for real data)
        success_score = self._compute_success_score(
            longevity=longevity,
            active_users=0,  # TODO: Query fork instance
            reflection_count=0,
            constitutional_score=0.95,
            growth_rate=0.0,
            fork_children=0,
        )
        
        metrics = ForkSuccessMetrics(
            fork_id=fork_id,
            creation_date=creation_date,
            longevity_days=longevity,
            active_users=0,
            reflection_count=0,
            constitutional_score=0.95,
            community_growth_rate=0.0,
            fork_children=0,
            success_score=success_score,
        )
        
        self.metrics[fork_id] = metrics
        self.stats['forks_analyzed'] += 1
        
        if success_score >= 0.7:
            self.stats['successful_forks'] += 1
        else:
            self.stats['failed_forks'] += 1
        
        return metrics
    
    def _compute_success_score(
        self,
        longevity: int,
        active_users: int,
        reflection_count: int,
        constitutional_score: float,
        growth_rate: float,
        fork_children: int,
    ) -> float:
        """
        Compute composite success score for fork.
        
        Args:
            Various fork metrics
        
        Returns:
            Success score (0.0 to 1.0)
        """
        # Weights for different factors
        weights = {
            'longevity': 0.25,
            'adoption': 0.30,
            'constitutional': 0.25,
            'growth': 0.10,
            'fecundity': 0.10,  # Fork children
        }
        
        # Normalize metrics
        longevity_score = min(longevity / 365, 1.0)  # 1 year = 1.0
        adoption_score = min(active_users / 100, 1.0)  # 100 users = 1.0
        growth_score = min(growth_rate / 0.5, 1.0)  # 50% monthly = 1.0
        fecundity_score = min(fork_children / 10, 1.0)  # 10 children = 1.0
        
        # Weighted average
        score = (
            weights['longevity'] * longevity_score +
            weights['adoption'] * adoption_score +
            weights['constitutional'] * constitutional_score +
            weights['growth'] * growth_score +
            weights['fecundity'] * fecundity_score
        )
        
        return score
    
    def _detect_patterns(self):
        """Detect common patterns across forks"""
        # Group forks by amendments
        amendment_groups = defaultdict(list)
        
        for fork_id, fork in self.registry.fork_records.items():
            for amendment in fork.amendments:
                amendment_groups[amendment].append(fork_id)
        
        # Find patterns (amendments that appear in multiple successful forks)
        for amendment, fork_ids in amendment_groups.items():
            if len(fork_ids) >= 2:  # At least 2 forks
                # Calculate success rate
                successful = sum(
                    1 for fid in fork_ids
                    if fid in self.metrics and self.metrics[fid].success_score >= 0.7
                )
                success_rate = successful / len(fork_ids) if fork_ids else 0.0
                
                if success_rate >= 0.5:  # At least 50% success
                    pattern = ForkPattern(
                        pattern_id=self._generate_pattern_id(),
                        description=f"Amendment pattern: {amendment}",
                        amendments=[amendment],
                        success_rate=success_rate,
                        adoption_count=len(fork_ids),
                        first_seen=min(
                            self.registry.fork_records[fid].forked_at
                            for fid in fork_ids
                        ),
                        examples=fork_ids[:5],  # First 5 examples
                    )
                    
                    self.patterns[pattern.pattern_id] = pattern
                    self.stats['patterns_detected'] += 1
        
        logger.info(f"Detected {len(self.patterns)} successful patterns")
    
    def _generate_recommendations(self):
        """Generate amendment recommendations from patterns"""
        self.recommendations = []
        
        for pattern in self.patterns.values():
            if pattern.success_rate >= 0.7 and pattern.adoption_count >= 3:
                recommendation = AmendmentRecommendation(
                    recommendation_id=self._generate_recommendation_id(),
                    title=f"Consider amendment: {pattern.amendments[0]}",
                    rationale=f"This amendment has been successfully adopted by {pattern.adoption_count} forks with {pattern.success_rate:.0%} success rate.",
                    supporting_forks=pattern.examples,
                    success_rate=pattern.success_rate,
                    estimated_impact="Positive based on fork data",
                    proposed_text=pattern.amendments[0],
                    confidence=min(pattern.success_rate * (pattern.adoption_count / 10), 1.0),
                )
                
                self.recommendations.append(recommendation)
                self.stats['recommendations_generated'] += 1
        
        logger.info(f"Generated {len(self.recommendations)} recommendations")
    
    def _generate_insights_summary(self) -> Dict[str, Any]:
        """Generate summary of learning insights"""
        if not self.patterns:
            return {'message': 'Not enough fork data for insights'}
        
        # Find most successful pattern
        best_pattern = max(
            self.patterns.values(),
            key=lambda p: p.success_rate * p.adoption_count
        )
        
        # Calculate average success rate
        avg_success = sum(
            m.success_score for m in self.metrics.values()
        ) / len(self.metrics) if self.metrics else 0.0
        
        return {
            'total_forks': len(self.registry.fork_records),
            'successful_forks': self.stats['successful_forks'],
            'average_success_rate': f"{avg_success:.1%}",
            'most_successful_pattern': {
                'description': best_pattern.description,
                'success_rate': f"{best_pattern.success_rate:.1%}",
                'adoption_count': best_pattern.adoption_count,
            },
            'top_recommendations': [
                {
                    'title': rec.title,
                    'confidence': f"{rec.confidence:.1%}",
                    'supporting_forks': len(rec.supporting_forks),
                }
                for rec in sorted(
                    self.recommendations,
                    key=lambda r: r.confidence,
                    reverse=True
                )[:3]
            ],
        }
    
    def get_recommendations(self, min_confidence: float = 0.7) -> List[AmendmentRecommendation]:
        """
        Get amendment recommendations above confidence threshold.
        
        Args:
            min_confidence: Minimum confidence level
        
        Returns:
            List of recommendations
        """
        return [
            rec for rec in self.recommendations
            if rec.confidence >= min_confidence
        ]
    
    # Persistence
    
    def _load_patterns(self) -> Dict[str, ForkPattern]:
        """Load patterns from disk"""
        patterns_file = self.storage_path / "fork_patterns.json"
        if not patterns_file.exists():
            return {}
        
        try:
            with open(patterns_file, 'r') as f:
                data = json.load(f)
                return {
                    pid: ForkPattern(
                        pattern_id=pid,
                        description=p['description'],
                        amendments=p['amendments'],
                        success_rate=p['success_rate'],
                        adoption_count=p['adoption_count'],
                        first_seen=datetime.fromisoformat(p['first_seen']),
                        examples=p.get('examples', []),
                    )
                    for pid, p in data.items()
                }
        except Exception as e:
            logger.error(f"Error loading patterns: {e}")
            return {}
    
    def _save_patterns(self):
        """Save patterns to disk"""
        patterns_file = self.storage_path / "fork_patterns.json"
        data = {
            pid: {
                'description': p.description,
                'amendments': p.amendments,
                'success_rate': p.success_rate,
                'adoption_count': p.adoption_count,
                'first_seen': p.first_seen.isoformat(),
                'examples': p.examples,
            }
            for pid, p in self.patterns.items()
        }
        
        with open(patterns_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _load_metrics(self) -> Dict[str, ForkSuccessMetrics]:
        """Load metrics from disk"""
        # TODO: Implement persistence
        return {}
    
    def _save_metrics(self):
        """Save metrics to disk"""
        # TODO: Implement persistence
        pass
    
    def _generate_pattern_id(self) -> str:
        """Generate unique pattern ID"""
        import hashlib
        return hashlib.sha256(
            f"pattern_{len(self.patterns)}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
    
    def _generate_recommendation_id(self) -> str:
        """Generate unique recommendation ID"""
        import hashlib
        return hashlib.sha256(
            f"rec_{len(self.recommendations)}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
