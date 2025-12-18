"""
Crisis Detection Engine
Analyzes reflections and user patterns to detect crisis situations
Integrates with identity graph and MirrorX for comprehensive analysis
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import re

from app.db import execute_query, execute_one


class CrisisSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class RegressionType(str, Enum):
    LOOP = "loop"
    SELF_ATTACK = "self_attack"
    JUDGMENT_SPIKE = "judgment_spike"
    AVOIDANCE = "avoidance"


class CrisisCategory(str, Enum):
    SELF_HARM_LANGUAGE = "self_harm_language"
    SUSTAINED_NEGATIVITY = "sustained_negativity"
    REGRESSION_LOOP = "regression_loop"
    JUDGMENT_SPIKE = "judgment_spike"
    AVOIDANCE_PATTERN = "avoidance_pattern"
    SUBSTANCE_MENTION = "substance_mention"
    ISOLATION_BEHAVIOR = "isolation_behavior"
    HOPELESSNESS_EXPRESSED = "hopelessness_expressed"
    USER_REQUESTED_HELP = "user_requested_help"


# Crisis indicator keywords (comprehensive but not exhaustive)
CRITICAL_KEYWORDS = {
    "self_harm": [
        r"\bkill myself\b", r"\bkill me\b", r"\bend it all\b", r"\bend my life\b",
        r"\bsuicide\b", r"\bsuicidal\b", r"\bhurt myself\b", r"\bcut myself\b",
        r"\boverdose\b", r"\bdon't want to be alive\b", r"\bcan't go on\b",
        r"\bno reason to live\b", r"\bdie\b.*\bwant\b", r"\better off dead\b"
    ],
    "hopelessness": [
        r"\bno point\b", r"\bno hope\b", r"\bnothing matters\b", r"\bgive up\b",
        r"\bcan't do this anymore\b", r"\bworthless\b", r"\buseless\b",
        r"\bfailure\b.*\balways\b", r"\bnever.*\better\b", r"\bcan't escape\b"
    ],
    "isolation": [
        r"\bno one cares\b", r"\ball alone\b", r"\bcompletely alone\b",
        r"\bnobody understands\b", r"\bpush everyone away\b", r"\bisolate\b"
    ]
}


WARNING_KEYWORDS = {
    "distress": [
        r"\bcan't cope\b", r"\boverwhelmed\b", r"\bcan't handle\b",
        r"\bfalling apart\b", r"\blosing control\b", r"\bspiralspiraling\b"
    ],
    "substance": [
        r"\bdrinking\b.*\bmuch\b", r"\busing\b.*\bmore\b", r"\bnumb the pain\b",
        r"\bescape\b.*\bdrugs\b", r"\baddicted\b"
    ]
}


class CrisisAnalysis:
    """Result of crisis detection analysis"""
    def __init__(
        self,
        risk_score: float,  # 0.0 to 1.0
        severity: CrisisSeverity,
        categories: List[CrisisCategory],
        indicators: List[str],
        should_alert_guardians: bool,
        recommended_actions: List[str],
        metadata: Dict
    ):
        self.risk_score = risk_score
        self.severity = severity
        self.categories = categories
        self.indicators = indicators
        self.should_alert_guardians = should_alert_guardians
        self.recommended_actions = recommended_actions
        self.metadata = metadata

    def to_dict(self):
        return {
            "risk_score": self.risk_score,
            "severity": self.severity.value,
            "categories": [c.value for c in self.categories],
            "indicators": self.indicators,
            "should_alert_guardians": self.should_alert_guardians,
            "recommended_actions": self.recommended_actions,
            "metadata": self.metadata
        }


class CrisisDetector:
    """
    Main crisis detection engine
    Analyzes content, patterns, and history to detect crisis situations
    """

    def __init__(self):
        self.critical_threshold = 0.7  # Risk score >= 0.7 is critical
        self.warning_threshold = 0.4   # Risk score >= 0.4 is warning

    async def analyze_reflection(
        self,
        reflection_id: int,
        content: str,
        identity_id: str
    ) -> CrisisAnalysis:
        """
        Comprehensive analysis of a single reflection
        Returns crisis analysis with risk score and recommended actions
        """
        categories = []
        indicators = []
        risk_components = {}

        # 1. Keyword analysis
        keyword_risk, keyword_categories, keyword_indicators = await self._analyze_keywords(content)
        risk_components["keywords"] = keyword_risk
        categories.extend(keyword_categories)
        indicators.extend(keyword_indicators)

        # 2. Historical pattern analysis
        pattern_risk, pattern_categories, pattern_indicators = await self._analyze_patterns(identity_id)
        risk_components["patterns"] = pattern_risk
        categories.extend(pattern_categories)
        indicators.extend(pattern_indicators)

        # 3. Regression marker analysis
        regression_risk, regression_categories, regression_indicators = await self._analyze_regressions(identity_id)
        risk_components["regressions"] = regression_risk
        categories.extend(regression_categories)
        indicators.extend(regression_indicators)

        # 4. Recent safety events
        safety_risk, safety_indicators = await self._analyze_recent_safety_events(identity_id)
        risk_components["safety_history"] = safety_risk
        indicators.extend(safety_indicators)

        # Calculate overall risk score (weighted average)
        risk_score = self._calculate_risk_score(risk_components)

        # Determine severity
        if risk_score >= self.critical_threshold:
            severity = CrisisSeverity.CRITICAL
        elif risk_score >= self.warning_threshold:
            severity = CrisisSeverity.WARNING
        else:
            severity = CrisisSeverity.INFO

        # Should we alert guardians?
        should_alert = severity == CrisisSeverity.CRITICAL

        # Generate recommended actions
        recommended_actions = self._generate_recommendations(severity, categories)

        metadata = {
            "reflection_id": reflection_id,
            "analyzed_at": datetime.utcnow().isoformat(),
            "risk_components": risk_components,
            "detection_version": "1.0"
        }

        return CrisisAnalysis(
            risk_score=risk_score,
            severity=severity,
            categories=list(set(categories)),  # Remove duplicates
            indicators=indicators,
            should_alert_guardians=should_alert,
            recommended_actions=recommended_actions,
            metadata=metadata
        )

    async def _analyze_keywords(self, content: str) -> Tuple[float, List[CrisisCategory], List[str]]:
        """Analyze content for crisis-related keywords"""
        categories = []
        indicators = []
        risk_score = 0.0

        content_lower = content.lower()

        # Check critical keywords
        for category, patterns in CRITICAL_KEYWORDS.items():
            for pattern in patterns:
                if re.search(pattern, content_lower):
                    risk_score = max(risk_score, 0.8)
                    if category == "self_harm":
                        categories.append(CrisisCategory.SELF_HARM_LANGUAGE)
                        indicators.append(f"Self-harm language detected")
                    elif category == "hopelessness":
                        categories.append(CrisisCategory.HOPELESSNESS_EXPRESSED)
                        indicators.append(f"Hopelessness expressed")
                    elif category == "isolation":
                        categories.append(CrisisCategory.ISOLATION_BEHAVIOR)
                        indicators.append(f"Isolation language detected")

        # Check warning keywords
        for category, patterns in WARNING_KEYWORDS.items():
            for pattern in patterns:
                if re.search(pattern, content_lower):
                    risk_score = max(risk_score, 0.5)
                    if category == "distress":
                        categories.append(CrisisCategory.SUSTAINED_NEGATIVITY)
                        indicators.append(f"Distress language detected")
                    elif category == "substance":
                        categories.append(CrisisCategory.SUBSTANCE_MENTION)
                        indicators.append(f"Substance use mentioned")

        return risk_score, categories, indicators

    async def _analyze_patterns(self, identity_id: str) -> Tuple[float, List[CrisisCategory], List[str]]:
        """Analyze user's recent reflection patterns"""
        categories = []
        indicators = []
        risk_score = 0.0

        # Get recent reflections (last 7 days)
        recent_reflections = await execute_query("""
            SELECT id, content, created_at
            FROM reflections
            WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '7 days'
            ORDER BY created_at DESC
        """, identity_id)

        if not recent_reflections:
            # No recent activity could indicate avoidance
            last_reflection = await fetch_one("""
                SELECT created_at
                FROM reflections
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 1
            """, identity_id)

            if last_reflection:
                days_since = (datetime.utcnow() - last_reflection['created_at']).days
                if days_since > 14:
                    risk_score = 0.3
                    categories.append(CrisisCategory.AVOIDANCE_PATTERN)
                    indicators.append(f"No reflections in {days_since} days")

        # Check for sustained negativity pattern
        if len(recent_reflections) >= 3:
            negative_count = 0
            for reflection in recent_reflections:
                # Simple sentiment check (would integrate with MirrorX in production)
                content_lower = reflection['content'].lower()
                negative_words = ['hate', 'terrible', 'awful', 'worst', 'horrible', 'pain', 'hurt']
                if any(word in content_lower for word in negative_words):
                    negative_count += 1

            negativity_ratio = negative_count / len(recent_reflections)
            if negativity_ratio >= 0.7:
                risk_score = max(risk_score, 0.5)
                categories.append(CrisisCategory.SUSTAINED_NEGATIVITY)
                indicators.append(f"Sustained negative sentiment in {negative_count}/{len(recent_reflections)} recent reflections")

        return risk_score, categories, indicators

    async def _analyze_regressions(self, identity_id: str) -> Tuple[float, List[CrisisCategory], List[str]]:
        """Analyze regression markers"""
        categories = []
        indicators = []
        risk_score = 0.0

        # Get recent regression markers (last 14 days)
        regressions = await execute_query("""
            SELECT kind, severity, description, created_at
            FROM regression_markers
            WHERE identity_id = $1
            AND created_at >= NOW() - INTERVAL '14 days'
            ORDER BY created_at DESC
        """, identity_id)

        if not regressions:
            return 0.0, [], []

        # Analyze regression patterns
        loop_count = sum(1 for r in regressions if r['kind'] == 'loop')
        self_attack_count = sum(1 for r in regressions if r['kind'] == 'self_attack')
        judgment_count = sum(1 for r in regressions if r['kind'] == 'judgment_spike')

        if loop_count >= 2:
            risk_score = max(risk_score, 0.4)
            categories.append(CrisisCategory.REGRESSION_LOOP)
            indicators.append(f"{loop_count} regression loops in past 14 days")

        if self_attack_count >= 3:
            risk_score = max(risk_score, 0.6)
            indicators.append(f"{self_attack_count} self-attack patterns detected")

        if judgment_count >= 2:
            risk_score = max(risk_score, 0.5)
            categories.append(CrisisCategory.JUDGMENT_SPIKE)
            indicators.append(f"{judgment_count} judgment spikes detected")

        # Check for high-severity regressions
        critical_regressions = [r for r in regressions if r['severity'] >= 4]
        if critical_regressions:
            risk_score = max(risk_score, 0.7)
            indicators.append(f"{len(critical_regressions)} high-severity regression markers")

        return risk_score, categories, indicators

    async def _analyze_recent_safety_events(self, identity_id: str) -> Tuple[float, List[str]]:
        """Check recent safety event history"""
        indicators = []
        risk_score = 0.0

        recent_events = await execute_query("""
            SELECT severity, category, created_at
            FROM safety_events
            WHERE identity_id = $1
            AND created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
        """, identity_id)

        if not recent_events:
            return 0.0, []

        # Check for critical events in last 7 days
        recent_critical = [e for e in recent_events 
                          if e['severity'] == 'critical' 
                          and (datetime.utcnow() - e['created_at']).days <= 7]

        if recent_critical:
            risk_score = 0.6
            indicators.append(f"{len(recent_critical)} critical events in past week")

        # Check for pattern of escalation
        if len(recent_events) >= 3:
            severity_trend = [e['severity'] for e in recent_events[:3]]
            if severity_trend == ['critical', 'warning', 'info']:
                # Escalating pattern
                risk_score = max(risk_score, 0.7)
                indicators.append("Escalating safety event pattern detected")

        return risk_score, indicators

    def _calculate_risk_score(self, components: Dict[str, float]) -> float:
        """
        Calculate weighted risk score from components
        Keywords weighted highest, then regressions, then patterns
        """
        weights = {
            "keywords": 0.4,
            "regressions": 0.3,
            "patterns": 0.2,
            "safety_history": 0.1
        }

        weighted_sum = sum(components.get(key, 0.0) * weight 
                          for key, weight in weights.items())

        # Clamp to 0.0-1.0
        return max(0.0, min(1.0, weighted_sum))

    def _generate_recommendations(
        self, 
        severity: CrisisSeverity, 
        categories: List[CrisisCategory]
    ) -> List[str]:
        """Generate context-specific recommendations"""
        recommendations = []

        if severity == CrisisSeverity.CRITICAL:
            recommendations.append("Access your safety plan immediately")
            recommendations.append("Contact a crisis line (988 or text 741741)")
            recommendations.append("Reach out to your designated guardian")
            recommendations.append("Consider emergency services if in immediate danger")

        elif severity == CrisisSeverity.WARNING:
            recommendations.append("Review your safety plan")
            recommendations.append("Try grounding exercises")
            recommendations.append("Reach out to a trusted contact")
            recommendations.append("Monitor your patterns over the next few days")

        # Category-specific recommendations
        if CrisisCategory.ISOLATION_BEHAVIOR in categories:
            recommendations.append("Consider reaching out to someone you trust")

        if CrisisCategory.REGRESSION_LOOP in categories:
            recommendations.append("Review identity graph to identify loop triggers")

        if CrisisCategory.AVOIDANCE_PATTERN in categories:
            recommendations.append("Try gentle reflection, even just one sentence")

        return recommendations

    async def get_user_risk_score(self, identity_id: str) -> Dict:
        """
        Get current risk assessment for a user
        Based on all available data
        """
        # Analyze recent reflections
        recent_reflection = await fetch_one("""
            SELECT id, content
            FROM reflections
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        """, identity_id)

        if recent_reflection:
            analysis = await self.analyze_reflection(
                recent_reflection['id'],
                recent_reflection['content'],
                identity_id
            )
            return analysis.to_dict()
        else:
            # No recent activity - check patterns
            _, _, indicators = await self._analyze_patterns(identity_id)
            return {
                "risk_score": 0.2 if indicators else 0.0,
                "severity": "info",
                "categories": ["avoidance_pattern"] if indicators else [],
                "indicators": indicators,
                "should_alert_guardians": False,
                "recommended_actions": ["Consider checking in with a reflection"],
                "metadata": {"note": "No recent reflections"}
            }

    async def should_alert_guardians(
        self, 
        identity_id: str, 
        analysis: CrisisAnalysis
    ) -> bool:
        """
        Determine if guardians should be alerted
        Based on analysis and user preferences
        """
        # Always alert for critical severity
        if analysis.severity == CrisisSeverity.CRITICAL:
            return True

        # Check user's crisis settings (would be in governance/settings)
        # For now, default to critical-only alerts
        return False

    async def create_safety_event(
        self,
        identity_id: str,
        category: CrisisCategory,
        severity: CrisisSeverity,
        metadata: Dict,
        reflection_id: Optional[int] = None,
        action_taken: Optional[str] = None
    ) -> Dict:
        """Create a safety event record"""
        result = await fetch_one("""
            INSERT INTO safety_events (
                identity_id, reflection_id, category, 
                severity, action_taken, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, created_at
        """, identity_id, reflection_id, category.value, 
             severity.value, action_taken, metadata)

        return {
            "id": result['id'],
            "identity_id": identity_id,
            "reflection_id": reflection_id,
            "category": category.value,
            "severity": severity.value,
            "action_taken": action_taken,
            "metadata": metadata,
            "created_at": result['created_at'].isoformat()
        }


# Singleton instance
crisis_detector = CrisisDetector()
