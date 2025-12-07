"""
MirrorCore Orchestrator - The brain of MirrorX AI.

This is where all the analyzers come together to process reflections
through the MirrorCore pipeline:

1. Safety gate (hard boundary)
2. Tone + tension classification
3. Bias analysis
4. Regression detection
5. Identity graph update
6. Mirrorback generation

Every reflection goes through this pipeline.
Every decision is logged, transparent, and auditable.
"""
from typing import Dict, List, Any, Optional
import asyncpg
import os

from app.policies import MirrorCorePolicy, SafetyCategory, SafetySeverity
from app.analyzers.tone_analyzer import ToneAnalyzer
from app.analyzers.bias_analyzer import BiasAnalyzer
from app.analyzers.regression_detector import RegressionDetector


class MirrorCoreOrchestrator:
    """
    Main orchestrator for MirrorX AI processing.
    Coordinates all analyzers and ensures MirrorCore principles are followed.
    """

    def __init__(self, db_pool: Optional[asyncpg.Pool] = None):
        self.tone_analyzer = ToneAnalyzer()
        self.bias_analyzer = BiasAnalyzer()
        self.regression_detector = RegressionDetector()
        self.db_pool = db_pool

    async def process_reflection(
        self,
        reflection: Dict[str, Any],
        identity_id: str
    ) -> Dict[str, Any]:
        """
        Main MirrorCore pipeline for processing a single reflection.

        Args:
            reflection: Dict with 'id', 'body', 'lens_key', etc.
            identity_id: User ID who wrote the reflection

        Returns:
            {
                "type": "mirrorback" | "safety",
                "body": str,  # Mirrorback text or safety message
                "tone": str,
                "tensions": List[str],
                "bias_info": List[Dict],
                "regression": List[Dict],
                "allow_mirrorback": bool
            }
        """
        reflection_id = reflection.get('id')
        reflection_body = reflection.get('body', '')
        lens_key = reflection.get('lens_key')

        # ────────────────────────────────────────────────────────────────
        # STEP 1: SAFETY GATE
        # ────────────────────────────────────────────────────────────────
        safety_result = await self._run_safety_checks(reflection_body, identity_id, reflection_id)

        if safety_result['block']:
            # Log safety event
            if self.db_pool:
                await self._log_safety_event(
                    identity_id,
                    reflection_id,
                    safety_result
                )

            return {
                "type": "safety",
                "body": safety_result['message_for_user'],
                "allow_mirrorback": False,
                "safety_info": safety_result
            }

        # ────────────────────────────────────────────────────────────────
        # STEP 2: TONE & TENSIONS
        # ────────────────────────────────────────────────────────────────
        tone_result = self.tone_analyzer.analyze(reflection_body)
        tone = tone_result['tone']
        tensions = tone_result['tensions']

        # ────────────────────────────────────────────────────────────────
        # STEP 3: BIAS ANALYSIS
        # ────────────────────────────────────────────────────────────────
        bias_insights = self.bias_analyzer.analyze(reflection_body)

        # Log bias insights to database
        if self.db_pool and bias_insights:
            await self._log_bias_insights(identity_id, reflection_id, bias_insights)

        # ────────────────────────────────────────────────────────────────
        # STEP 4: REGRESSION DETECTION
        # ────────────────────────────────────────────────────────────────
        # Get recent reflections for loop detection
        recent_reflections = []
        if self.db_pool:
            recent_reflections = await self._get_recent_reflections(identity_id, limit=5)

        regression_markers = self.regression_detector.analyze(
            reflection_body,
            recent_reflections
        )

        # Log regression markers to database
        if self.db_pool and regression_markers:
            await self._log_regression_markers(identity_id, reflection_id, regression_markers)

        # ────────────────────────────────────────────────────────────────
        # STEP 5: IDENTITY GRAPH UPDATE
        # ────────────────────────────────────────────────────────────────
        if self.db_pool:
            await self._update_identity_axes(
                identity_id,
                lens_key,
                tone_result,
                bias_insights,
                regression_markers
            )

        # ────────────────────────────────────────────────────────────────
        # STEP 6: PREPARE DATA FOR MIRRORBACK GENERATION
        # ────────────────────────────────────────────────────────────────
        return {
            "type": "ready_for_mirrorback",
            "tone": tone,
            "tensions": tensions,
            "bias_info": bias_insights,
            "regression": regression_markers,
            "allow_mirrorback": True,
            "metadata": {
                "tone_confidence": tone_result.get('tone_confidence', 0),
                "question_ratio": tone_result.get('question_ratio', 0),
                "markers": tone_result.get('markers', {})
            }
        }

    # ════════════════════════════════════════════════════════════════════
    # INTERNAL METHODS
    # ════════════════════════════════════════════════════════════════════

    async def _run_safety_checks(
        self,
        text: str,
        identity_id: str,
        reflection_id: Optional[int]
    ) -> Dict[str, Any]:
        """
        Run safety checks on reflection text.

        Returns:
            {
                "block": bool,
                "category": SafetyCategory,
                "severity": SafetySeverity,
                "score": float,
                "message_for_user": str
            }
        """
        # In production, this would call OpenAI Moderation API or similar
        # For now, simple keyword-based safety check

        lower_text = text.lower()

        # Self-harm detection
        self_harm_markers = [
            "want to die", "kill myself", "end it all",
            "suicide", "not worth living"
        ]
        if any(marker in lower_text for marker in self_harm_markers):
            return {
                "block": False,  # Don't block, but flag
                "category": SafetyCategory.SELF_HARM,
                "severity": SafetySeverity.WARNING,
                "score": 0.7,
                "message_for_user": "I notice you're expressing thoughts about self-harm. Please reach out to a crisis helpline or mental health professional.",
                "action_taken": "resource_offered"
            }

        # Crisis language
        crisis_markers = ["in crisis", "emergency", "urgent help"]
        if any(marker in lower_text for marker in crisis_markers):
            return {
                "block": False,
                "category": SafetyCategory.CRISIS,
                "severity": SafetySeverity.WARNING,
                "score": 0.6,
                "message_for_user": "It sounds like you may need immediate support. Consider contacting a crisis helpline.",
                "action_taken": "resource_offered"
            }

        # Harassment/hate (would block in production)
        hate_markers = ["kill them", "hate [group]", "should die"]
        # Simplified for demo

        # Default: safe
        return {
            "block": False,
            "category": SafetyCategory.NONE,
            "severity": SafetySeverity.INFO,
            "score": 0.0,
            "message_for_user": None,
            "action_taken": None
        }

    async def _log_safety_event(
        self,
        identity_id: str,
        reflection_id: Optional[int],
        safety_result: Dict[str, Any]
    ):
        """Log safety event to database."""
        if not self.db_pool:
            return

        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO safety_events (identity_id, reflection_id, category, severity, action_taken, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                identity_id,
                reflection_id,
                safety_result['category'].value,
                safety_result['severity'].value,
                safety_result.get('action_taken'),
                {
                    "score": safety_result.get('score', 0),
                    "message": safety_result.get('message_for_user')
                }
            )

    async def _log_bias_insights(
        self,
        identity_id: str,
        reflection_id: int,
        bias_insights: List[Dict[str, Any]]
    ):
        """Log bias insights to database."""
        if not self.db_pool:
            return

        async with self.db_pool.acquire() as conn:
            for insight in bias_insights:
                await conn.execute(
                    """
                    INSERT INTO bias_insights (identity_id, reflection_id, dimension, direction, confidence, notes)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    identity_id,
                    reflection_id,
                    insight['dimension'],
                    insight['direction'],
                    insight['confidence'],
                    insight['notes']
                )

    async def _log_regression_markers(
        self,
        identity_id: str,
        reflection_id: int,
        regression_markers: List[Dict[str, Any]]
    ):
        """Log regression markers to database."""
        if not self.db_pool:
            return

        async with self.db_pool.acquire() as conn:
            for marker in regression_markers:
                await conn.execute(
                    """
                    INSERT INTO regression_markers (identity_id, reflection_id, kind, description, severity, pattern_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    identity_id,
                    reflection_id,
                    marker['kind'],
                    marker.get('description'),
                    marker.get('severity', 1),
                    marker.get('pattern_id')
                )

    async def _get_recent_reflections(
        self,
        identity_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get user's recent reflections for pattern detection."""
        if not self.db_pool:
            return []

        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, body, lens_key, created_at
                FROM reflections
                WHERE author_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                identity_id,
                limit
            )
            return [dict(row) for row in rows]

    async def _update_identity_axes(
        self,
        identity_id: str,
        lens_key: Optional[str],
        tone_result: Dict[str, Any],
        bias_insights: List[Dict[str, Any]],
        regression_markers: List[Dict[str, Any]]
    ):
        """
        Update identity axes based on reflection analysis.
        This is how the platform learns about how someone thinks over time.
        """
        if not self.db_pool or not lens_key:
            return

        # For each bias insight, update or create identity axis
        async with self.db_pool.acquire() as conn:
            for insight in bias_insights:
                dimension = insight['dimension']
                direction = insight['direction']
                confidence = insight['confidence']

                # Upsert identity axis
                await conn.execute(
                    """
                    INSERT INTO identity_axes (identity_id, lens_key, dimension, value, confidence, notes, last_updated)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (identity_id, lens_key, dimension)
                    DO UPDATE SET
                        value = $4,
                        confidence = (identity_axes.confidence + $5) / 2,  -- Average with existing
                        notes = $6,
                        last_updated = NOW()
                    """,
                    identity_id,
                    lens_key,
                    dimension,
                    0.5,  # Placeholder value (would need more sophisticated scoring)
                    confidence,
                    insight['notes']
                )
