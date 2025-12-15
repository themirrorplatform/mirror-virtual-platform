# mirrorx/evolution_engine.py
"""
Evolution Engine: Identity Delta & Timeline Analysis

Tracks how identity evolves over time by:
1. Computing identity deltas between reflections
2. Detecting concept drift (themes changing)
3. Analyzing timeline patterns
4. Measuring evolution velocity
5. Finding inflection points (major shifts)

Constitutional compliance: I2 (identity locality) - all analysis is per-identity.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import Counter
import math

logger = logging.getLogger(__name__)


@dataclass
class IdentityDelta:
    """Change between two reflection states"""
    timestamp: datetime
    new_concepts: List[str]
    dropped_concepts: List[str]
    strengthened_themes: List[str]
    weakened_themes: List[str]
    new_tensions: List[Tuple[str, str]]
    resolved_tensions: List[Tuple[str, str]]
    delta_magnitude: float  # 0.0 to 1.0


@dataclass
class InflectionPoint:
    """Major shift in identity trajectory"""
    timestamp: datetime
    description: str
    before_themes: List[str]
    after_themes: List[str]
    magnitude: float  # How dramatic the shift


@dataclass
class ConceptDrift:
    """How a concept's presence changes over time"""
    concept: str
    first_seen: datetime
    last_seen: datetime
    frequency_trend: str  # "rising", "falling", "stable"
    peak_period: Optional[Tuple[datetime, datetime]]
    current_strength: float


@dataclass
class EvolutionMetrics:
    """Summary metrics for identity evolution"""
    identity_id: str
    analysis_period: Tuple[datetime, datetime]
    total_reflections: int
    unique_concepts: int
    concept_stability: float  # 0-1, how stable themes are
    evolution_velocity: float  # rate of change
    dominant_themes: List[str]
    emerging_themes: List[str]
    fading_themes: List[str]
    inflection_points: List[InflectionPoint]


class EvolutionEngine:
    """
    Tracks and analyzes identity evolution over time.
    
    Design principles:
    - Strictly per-identity (I2 compliance)
    - No normative judgments about change
    - Descriptive, not prescriptive
    - Preserves complexity and contradiction
    """
    
    def __init__(self):
        """Initialize evolution engine"""
        self.delta_history: Dict[str, List[IdentityDelta]] = {}
        self.concept_drift_cache: Dict[str, Dict[str, ConceptDrift]] = {}
    
    def compute_delta(
        self,
        identity_id: str,
        previous_state: Dict[str, Any],
        current_state: Dict[str, Any],
        timestamp: datetime
    ) -> IdentityDelta:
        """
        Compute delta between two reflection states.
        
        Args:
            identity_id: Identity being analyzed
            previous_state: Previous reflection's extracted state
            current_state: Current reflection's extracted state
            timestamp: When this delta occurred
        
        Returns:
            IdentityDelta describing the change
        """
        # Extract concepts and themes from both states
        prev_concepts = set(previous_state.get('concepts', []))
        curr_concepts = set(current_state.get('concepts', []))
        
        prev_themes = {t['name']: t['strength'] for t in previous_state.get('themes', [])}
        curr_themes = {t['name']: t['strength'] for t in current_state.get('themes', [])}
        
        prev_tensions = set(
            (t['concept_a'], t['concept_b']) 
            for t in previous_state.get('tensions', [])
        )
        curr_tensions = set(
            (t['concept_a'], t['concept_b']) 
            for t in current_state.get('tensions', [])
        )
        
        # Compute differences
        new_concepts = list(curr_concepts - prev_concepts)
        dropped_concepts = list(prev_concepts - curr_concepts)
        
        # Theme changes
        strengthened = []
        weakened = []
        for theme in set(prev_themes.keys()) | set(curr_themes.keys()):
            prev_strength = prev_themes.get(theme, 0)
            curr_strength = curr_themes.get(theme, 0)
            
            if curr_strength > prev_strength + 0.1:
                strengthened.append(theme)
            elif curr_strength < prev_strength - 0.1:
                weakened.append(theme)
        
        # Tension changes
        new_tensions = list(curr_tensions - prev_tensions)
        resolved_tensions = list(prev_tensions - curr_tensions)
        
        # Compute magnitude (normalized)
        magnitude = self._compute_delta_magnitude(
            new_concepts, dropped_concepts,
            strengthened, weakened,
            new_tensions, resolved_tensions
        )
        
        delta = IdentityDelta(
            timestamp=timestamp,
            new_concepts=new_concepts,
            dropped_concepts=dropped_concepts,
            strengthened_themes=strengthened,
            weakened_themes=weakened,
            new_tensions=new_tensions,
            resolved_tensions=resolved_tensions,
            delta_magnitude=magnitude
        )
        
        # Store in history
        if identity_id not in self.delta_history:
            self.delta_history[identity_id] = []
        self.delta_history[identity_id].append(delta)
        
        return delta
    
    def _compute_delta_magnitude(
        self,
        new_concepts: List[str],
        dropped_concepts: List[str],
        strengthened: List[str],
        weakened: List[str],
        new_tensions: List[Tuple[str, str]],
        resolved_tensions: List[Tuple[str, str]]
    ) -> float:
        """
        Compute overall magnitude of change.
        
        Returns:
            Float 0.0-1.0 representing change magnitude
        """
        # Weight different types of changes
        concept_change = (len(new_concepts) + len(dropped_concepts)) * 0.2
        theme_change = (len(strengthened) + len(weakened)) * 0.3
        tension_change = (len(new_tensions) + len(resolved_tensions)) * 0.5
        
        total = concept_change + theme_change + tension_change
        
        # Normalize to 0-1 (assuming max ~10 total changes is very high)
        return min(1.0, total / 10.0)
    
    def detect_concept_drift(
        self,
        identity_id: str,
        reflections: List[Dict[str, Any]],
        window_days: int = 30
    ) -> Dict[str, ConceptDrift]:
        """
        Detect how concepts drift over time.
        
        Args:
            identity_id: Identity to analyze
            reflections: List of reflection states with timestamps
            window_days: Window for trend analysis
        
        Returns:
            Dict of concept_name -> ConceptDrift
        """
        if not reflections:
            return {}
        
        # Sort by timestamp
        sorted_reflections = sorted(
            reflections,
            key=lambda r: r.get('timestamp', datetime.min)
        )
        
        # Track concept appearances
        concept_timeline: Dict[str, List[Tuple[datetime, float]]] = {}
        
        for reflection in sorted_reflections:
            timestamp = reflection.get('timestamp', datetime.utcnow())
            themes = reflection.get('themes', [])
            
            for theme in themes:
                name = theme.get('name', '')
                strength = theme.get('strength', 0.0)
                
                if name not in concept_timeline:
                    concept_timeline[name] = []
                concept_timeline[name].append((timestamp, strength))
        
        # Analyze each concept
        drifts = {}
        for concept, timeline in concept_timeline.items():
            if len(timeline) < 2:
                continue
            
            first_seen = timeline[0][0]
            last_seen = timeline[-1][0]
            
            # Compute trend (simple linear regression on recent window)
            recent_window = datetime.utcnow() - timedelta(days=window_days)
            recent_points = [
                (t, s) for t, s in timeline 
                if t >= recent_window
            ]
            
            if len(recent_points) >= 2:
                trend = self._compute_trend(recent_points)
            else:
                trend = "stable"
            
            # Find peak period
            peak_period = self._find_peak_period(timeline, window_days)
            
            # Current strength
            current_strength = timeline[-1][1]
            
            drifts[concept] = ConceptDrift(
                concept=concept,
                first_seen=first_seen,
                last_seen=last_seen,
                frequency_trend=trend,
                peak_period=peak_period,
                current_strength=current_strength
            )
        
        # Cache results
        self.concept_drift_cache[identity_id] = drifts
        
        return drifts
    
    def _compute_trend(
        self,
        points: List[Tuple[datetime, float]]
    ) -> str:
        """
        Compute trend direction from time series.
        
        Returns:
            "rising", "falling", or "stable"
        """
        if len(points) < 2:
            return "stable"
        
        # Simple linear regression
        # Convert timestamps to numeric (days from first point)
        base_time = points[0][0]
        x = [(p[0] - base_time).days for p in points]
        y = [p[1] for p in points]
        
        n = len(points)
        x_mean = sum(x) / n
        y_mean = sum(y) / n
        
        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return "stable"
        
        slope = numerator / denominator
        
        # Classify based on slope
        if slope > 0.01:
            return "rising"
        elif slope < -0.01:
            return "falling"
        else:
            return "stable"
    
    def _find_peak_period(
        self,
        timeline: List[Tuple[datetime, float]],
        window_days: int
    ) -> Optional[Tuple[datetime, datetime]]:
        """
        Find period where concept was strongest.
        
        Returns:
            Tuple of (start, end) for peak period, or None
        """
        if len(timeline) < 3:
            return None
        
        # Find highest strength point
        max_strength = max(s for _, s in timeline)
        max_idx = next(i for i, (_, s) in enumerate(timeline) if s == max_strength)
        
        # Find window around peak
        max_time = timeline[max_idx][0]
        window = timedelta(days=window_days // 2)
        
        start = max_time - window
        end = max_time + window
        
        return (start, end)
    
    def detect_inflection_points(
        self,
        identity_id: str,
        deltas: Optional[List[IdentityDelta]] = None,
        magnitude_threshold: float = 0.5
    ) -> List[InflectionPoint]:
        """
        Find major shifts in identity trajectory.
        
        Args:
            identity_id: Identity to analyze
            deltas: Optional list of deltas (uses cached if not provided)
            magnitude_threshold: Minimum magnitude to be inflection point
        
        Returns:
            List of InflectionPoint objects
        """
        if deltas is None:
            deltas = self.delta_history.get(identity_id, [])
        
        if len(deltas) < 2:
            return []
        
        inflection_points = []
        
        for i, delta in enumerate(deltas):
            if delta.delta_magnitude >= magnitude_threshold:
                # Get before/after themes
                if i > 0:
                    before_themes = (
                        deltas[i-1].strengthened_themes + 
                        [c for c in deltas[i-1].new_concepts if c not in deltas[i-1].dropped_concepts]
                    )
                else:
                    before_themes = []
                
                after_themes = delta.strengthened_themes + delta.new_concepts
                
                # Describe the shift
                description = self._describe_shift(delta)
                
                inflection_points.append(InflectionPoint(
                    timestamp=delta.timestamp,
                    description=description,
                    before_themes=before_themes[:5],  # Top 5
                    after_themes=after_themes[:5],
                    magnitude=delta.delta_magnitude
                ))
        
        return inflection_points
    
    def _describe_shift(self, delta: IdentityDelta) -> str:
        """Generate human-readable shift description"""
        parts = []
        
        if delta.new_concepts:
            parts.append(f"New focus on {', '.join(delta.new_concepts[:3])}")
        
        if delta.strengthened_themes:
            parts.append(f"Strengthened: {', '.join(delta.strengthened_themes[:2])}")
        
        if delta.new_tensions:
            parts.append(f"New tensions emerged")
        
        if delta.resolved_tensions:
            parts.append(f"Tensions resolved")
        
        return "; ".join(parts) if parts else "Significant shift"
    
    def compute_evolution_metrics(
        self,
        identity_id: str,
        reflections: List[Dict[str, Any]],
        period_days: int = 90
    ) -> EvolutionMetrics:
        """
        Compute comprehensive evolution metrics.
        
        Args:
            identity_id: Identity to analyze
            reflections: All reflections in analysis period
            period_days: Analysis period in days
        
        Returns:
            EvolutionMetrics with comprehensive analysis
        """
        if not reflections:
            return self._empty_metrics(identity_id)
        
        # Sort by timestamp
        sorted_reflections = sorted(
            reflections,
            key=lambda r: r.get('timestamp', datetime.min)
        )
        
        start_time = sorted_reflections[0].get('timestamp', datetime.utcnow())
        end_time = sorted_reflections[-1].get('timestamp', datetime.utcnow())
        
        # Collect all concepts
        all_concepts = set()
        theme_frequency: Counter = Counter()
        
        for reflection in sorted_reflections:
            for theme in reflection.get('themes', []):
                name = theme.get('name', '')
                all_concepts.add(name)
                theme_frequency[name] += 1
        
        # Compute concept stability (how often themes repeat)
        if len(sorted_reflections) > 1:
            stability = sum(
                min(1.0, count / len(sorted_reflections))
                for count in theme_frequency.values()
            ) / max(1, len(theme_frequency))
        else:
            stability = 1.0
        
        # Evolution velocity (rate of concept change)
        deltas = self.delta_history.get(identity_id, [])
        if len(deltas) > 1:
            avg_magnitude = sum(d.delta_magnitude for d in deltas) / len(deltas)
            velocity = avg_magnitude
        else:
            velocity = 0.0
        
        # Dominant, emerging, fading themes
        dominant = [name for name, _ in theme_frequency.most_common(5)]
        
        concept_drifts = self.detect_concept_drift(identity_id, sorted_reflections)
        emerging = [
            name for name, drift in concept_drifts.items()
            if drift.frequency_trend == "rising"
        ][:5]
        
        fading = [
            name for name, drift in concept_drifts.items()
            if drift.frequency_trend == "falling"
        ][:5]
        
        # Inflection points
        inflection_points = self.detect_inflection_points(identity_id)
        
        return EvolutionMetrics(
            identity_id=identity_id,
            analysis_period=(start_time, end_time),
            total_reflections=len(sorted_reflections),
            unique_concepts=len(all_concepts),
            concept_stability=stability,
            evolution_velocity=velocity,
            dominant_themes=dominant,
            emerging_themes=emerging,
            fading_themes=fading,
            inflection_points=inflection_points
        )
    
    def _empty_metrics(self, identity_id: str) -> EvolutionMetrics:
        """Return empty metrics for no data case"""
        now = datetime.utcnow()
        return EvolutionMetrics(
            identity_id=identity_id,
            analysis_period=(now, now),
            total_reflections=0,
            unique_concepts=0,
            concept_stability=0.0,
            evolution_velocity=0.0,
            dominant_themes=[],
            emerging_themes=[],
            fading_themes=[],
            inflection_points=[]
        )


# Self-test
if __name__ == "__main__":
    print("Evolution Engine Test")
    print("=" * 80)
    
    engine = EvolutionEngine()
    
    # Create mock reflection states
    now = datetime.utcnow()
    
    states = [
        {
            'timestamp': now - timedelta(days=60),
            'concepts': ['career', 'relationships', 'stress'],
            'themes': [
                {'name': 'work', 'strength': 0.8},
                {'name': 'relationships', 'strength': 0.4}
            ],
            'tensions': [
                {'concept_a': 'career', 'concept_b': 'relationships'}
            ]
        },
        {
            'timestamp': now - timedelta(days=30),
            'concepts': ['career', 'growth', 'uncertainty'],
            'themes': [
                {'name': 'work', 'strength': 0.6},
                {'name': 'growth', 'strength': 0.7},
                {'name': 'relationships', 'strength': 0.3}
            ],
            'tensions': [
                {'concept_a': 'stability', 'concept_b': 'growth'}
            ]
        },
        {
            'timestamp': now,
            'concepts': ['growth', 'identity', 'purpose'],
            'themes': [
                {'name': 'growth', 'strength': 0.9},
                {'name': 'identity', 'strength': 0.7},
                {'name': 'work', 'strength': 0.4}
            ],
            'tensions': []
        }
    ]
    
    # Test 1: Compute deltas
    print("\n1. Computing identity deltas...")
    for i in range(1, len(states)):
        delta = engine.compute_delta(
            'test-identity',
            states[i-1],
            states[i],
            states[i]['timestamp']
        )
        print(f"   Delta {i}: magnitude={delta.delta_magnitude:.2f}")
        print(f"      New concepts: {delta.new_concepts}")
        print(f"      Strengthened: {delta.strengthened_themes}")
    
    # Test 2: Concept drift
    print("\n2. Detecting concept drift...")
    drifts = engine.detect_concept_drift('test-identity', states)
    for concept, drift in list(drifts.items())[:3]:
        print(f"   {concept}: {drift.frequency_trend} (strength: {drift.current_strength:.2f})")
    
    # Test 3: Inflection points
    print("\n3. Finding inflection points...")
    inflections = engine.detect_inflection_points('test-identity')
    for ip in inflections:
        print(f"   {ip.timestamp.strftime('%Y-%m-%d')}: {ip.description}")
        print(f"      Magnitude: {ip.magnitude:.2f}")
    
    # Test 4: Evolution metrics
    print("\n4. Computing evolution metrics...")
    metrics = engine.compute_evolution_metrics('test-identity', states)
    print(f"   Total reflections: {metrics.total_reflections}")
    print(f"   Unique concepts: {metrics.unique_concepts}")
    print(f"   Concept stability: {metrics.concept_stability:.2f}")
    print(f"   Evolution velocity: {metrics.evolution_velocity:.2f}")
    print(f"   Dominant themes: {', '.join(metrics.dominant_themes)}")
    print(f"   Emerging themes: {', '.join(metrics.emerging_themes)}")
    print(f"   Fading themes: {', '.join(metrics.fading_themes)}")
    
    print("\n✅ Evolution engine functional")
