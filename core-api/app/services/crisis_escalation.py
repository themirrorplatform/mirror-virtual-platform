"""
Crisis Escalation Service
Handles guardian alerts, escalation workflows, and integration with governance
"""
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

from app.db import execute_query, execute_one
from app.services.crisis_detector import CrisisAnalysis, CrisisSeverity, CrisisCategory


class EscalationLevel(str, Enum):
    LEVEL_1_INFO = "level_1_info"  # Log only, no alerts
    LEVEL_2_WARNING = "level_2_warning"  # User notification, suggest resources
    LEVEL_3_CRITICAL = "level_3_critical"  # Guardian alert + governance notification


class CrisisEscalationService:
    """
    Manages crisis escalation workflows
    Integrates with governance system for guardian management
    """

    async def escalate_crisis(
        self,
        identity_id: str,
        analysis: CrisisAnalysis,
        user_requested: bool = False
    ) -> Dict:
        """
        Execute escalation workflow based on crisis analysis
        Returns escalation result with actions taken
        """
        escalation_level = self._determine_escalation_level(analysis, user_requested)

        actions_taken = []
        notifications_sent = []

        # Level 1: Info - Just log
        if escalation_level == EscalationLevel.LEVEL_1_INFO:
            actions_taken.append("Logged safety event for monitoring")

        # Level 2: Warning - Notify user, suggest resources
        elif escalation_level == EscalationLevel.LEVEL_2_WARNING:
            actions_taken.append("User notified of warning level")
            
            # Create notification for user
            notification_id = await self._create_user_notification(
                identity_id,
                "Crisis Support Available",
                "We noticed you might benefit from some support. Your safety plan and crisis resources are available.",
                analysis.to_dict()
            )
            notifications_sent.append({
                "type": "user_warning",
                "notification_id": notification_id
            })

        # Level 3: Critical - Alert guardians + governance
        elif escalation_level == EscalationLevel.LEVEL_3_CRITICAL:
            actions_taken.append("Critical escalation initiated")

            # Alert user first
            user_notif_id = await self._create_user_notification(
                identity_id,
                "Crisis Support - Urgent",
                "Your designated guardians have been notified. Please access your safety plan or call 988 if you need immediate help.",
                analysis.to_dict()
            )
            notifications_sent.append({
                "type": "user_critical",
                "notification_id": user_notif_id
            })

            # Get and alert guardians
            guardians = await self._get_user_guardians(identity_id)
            for guardian in guardians:
                guardian_notif_id = await self._alert_guardian(
                    guardian_id=guardian['guardian_id'],
                    identity_id=identity_id,
                    analysis=analysis
                )
                notifications_sent.append({
                    "type": "guardian_alert",
                    "guardian_id": guardian['guardian_id'],
                    "notification_id": guardian_notif_id
                })
                actions_taken.append(f"Guardian {guardian['guardian_name']} alerted")

            # Create governance event for guardian review
            governance_event_id = await self._create_governance_event(
                identity_id,
                analysis,
                guardians
            )
            actions_taken.append(f"Governance event created (ID: {governance_event_id})")

        # Record escalation event
        escalation_event = await self._record_escalation(
            identity_id=identity_id,
            escalation_level=escalation_level,
            analysis=analysis,
            actions_taken=actions_taken,
            notifications_sent=notifications_sent,
            user_requested=user_requested
        )

        return {
            "escalation_id": escalation_event['id'],
            "escalation_level": escalation_level.value,
            "actions_taken": actions_taken,
            "notifications_sent": notifications_sent,
            "timestamp": escalation_event['created_at']
        }

    def _determine_escalation_level(
        self,
        analysis: CrisisAnalysis,
        user_requested: bool
    ) -> EscalationLevel:
        """
        Determine appropriate escalation level
        User-requested escalations go straight to critical
        """
        if user_requested:
            return EscalationLevel.LEVEL_3_CRITICAL

        if analysis.severity == CrisisSeverity.CRITICAL:
            return EscalationLevel.LEVEL_3_CRITICAL
        elif analysis.severity == CrisisSeverity.WARNING:
            return EscalationLevel.LEVEL_2_WARNING
        else:
            return EscalationLevel.LEVEL_1_INFO

    async def _get_user_guardians(self, identity_id: str) -> List[Dict]:
        """
        Get user's designated guardians from governance system
        For now, returns empty list (will integrate with governance)
        """
        # TODO: Integrate with governance system
        # guardians = await execute_query("""
        #     SELECT g.guardian_id, p.username as guardian_name, p.display_name
        #     FROM governance_guardians g
        #     JOIN profiles p ON p.id = g.guardian_id
        #     WHERE g.user_id = $1 AND g.is_active = true
        # """, identity_id)

        # For now, return empty list
        # In production, this would query governance_guardians table
        return []

    async def _alert_guardian(
        self,
        guardian_id: str,
        identity_id: str,
        analysis: CrisisAnalysis
    ) -> int:
        """
        Send notification to guardian about crisis situation
        """
        # Get user's display name for the notification
        user = await fetch_one("""
            SELECT username, display_name
            FROM profiles
            WHERE id = $1
        """, identity_id)

        user_name = user.get('display_name') or user.get('username') or 'A user'

        message = f"{user_name} may need support. Risk level: {analysis.severity.value}. Please reach out when you can."

        # Create notification
        notification_id = await self._create_user_notification(
            guardian_id,
            "Guardian Alert - Crisis Support Needed",
            message,
            {
                "type": "guardian_alert",
                "identity_id": identity_id,
                "risk_score": analysis.risk_score,
                "severity": analysis.severity.value,
                "categories": [c.value for c in analysis.categories],
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        return notification_id

    async def _create_user_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        metadata: Dict
    ) -> int:
        """
        Create notification in notifications table
        """
        result = await fetch_one("""
            INSERT INTO notifications (
                recipient_id, type, metadata, is_read, created_at
            )
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id
        """, user_id, "crisis_alert", {
            "title": title,
            "message": message,
            **metadata
        }, False)

        return result['id']

    async def _create_governance_event(
        self,
        identity_id: str,
        analysis: CrisisAnalysis,
        guardians: List[Dict]
    ) -> int:
        """
        Create governance event for guardian review
        Logs crisis situation in governance system for oversight
        """
        # Create a safety event that can be reviewed by governance
        result = await fetch_one("""
            INSERT INTO safety_events (
                identity_id, category, severity,
                action_taken, metadata
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """, identity_id, "governance_review_required", "critical",
             "Crisis escalation requires guardian review",
             {
                 "analysis": analysis.to_dict(),
                 "guardians_notified": [g['guardian_id'] for g in guardians],
                 "escalation_time": datetime.utcnow().isoformat(),
                 "requires_followup": True
             })

        return result['id']

    async def _record_escalation(
        self,
        identity_id: str,
        escalation_level: EscalationLevel,
        analysis: CrisisAnalysis,
        actions_taken: List[str],
        notifications_sent: List[Dict],
        user_requested: bool
    ) -> Dict:
        """
        Record escalation in safety_events table
        """
        result = await fetch_one("""
            INSERT INTO safety_events (
                identity_id, category, severity,
                action_taken, metadata
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        """, identity_id, "crisis_escalation", analysis.severity.value,
             f"Escalation level: {escalation_level.value}",
             {
                 "escalation_level": escalation_level.value,
                 "analysis": analysis.to_dict(),
                 "actions_taken": actions_taken,
                 "notifications_sent": notifications_sent,
                 "user_requested": user_requested,
                 "escalation_time": datetime.utcnow().isoformat()
             })

        return {
            "id": result['id'],
            "created_at": result['created_at'].isoformat()
        }

    # ==================== Guardian Management ====================

    async def get_user_guardians(self, identity_id: str) -> List[Dict]:
        """
        Get list of user's designated guardians
        Includes guardian info and contact preferences
        """
        # TODO: Implement when governance system is complete
        # For now, return empty list
        return []

    async def designate_guardian(
        self,
        identity_id: str,
        guardian_id: str,
        contact_preferences: Dict
    ) -> Dict:
        """
        Designate a guardian for crisis escalation
        """
        # TODO: Integrate with governance system
        # This would create a record in governance_guardians table
        pass

    async def remove_guardian(
        self,
        identity_id: str,
        guardian_id: str
    ) -> bool:
        """
        Remove guardian designation
        """
        # TODO: Integrate with governance system
        pass

    # ==================== Crisis Resources ====================

    async def get_crisis_resources(self, country_code: str = "US") -> List[Dict]:
        """
        Get crisis hotlines and resources by country
        """
        # Comprehensive crisis resource database
        resources = {
            "US": [
                {
                    "name": "988 Suicide & Crisis Lifeline",
                    "phone": "988",
                    "text": "988",
                    "chat": "https://988lifeline.org/chat/",
                    "available": "24/7",
                    "description": "Free, confidential support for people in distress"
                },
                {
                    "name": "Crisis Text Line",
                    "phone": None,
                    "text": "741741",
                    "chat": None,
                    "available": "24/7",
                    "description": "Text HOME to 741741 for crisis support"
                },
                {
                    "name": "Veterans Crisis Line",
                    "phone": "988",
                    "text": "838255",
                    "chat": "https://www.veteranscrisisline.net/",
                    "available": "24/7",
                    "description": "Press 1 after calling 988, or text 838255"
                },
                {
                    "name": "Trevor Project (LGBTQ Youth)",
                    "phone": "1-866-488-7386",
                    "text": "678678",
                    "chat": "https://www.thetrevorproject.org/get-help/",
                    "available": "24/7",
                    "description": "Crisis support for LGBTQ young people"
                },
                {
                    "name": "SAMHSA National Helpline",
                    "phone": "1-800-662-4357",
                    "text": None,
                    "chat": None,
                    "available": "24/7",
                    "description": "Treatment referral and information service"
                }
            ]
        }

        return resources.get(country_code, resources["US"])

    async def get_grounding_exercises(self) -> List[Dict]:
        """
        Get list of grounding exercises for immediate crisis support
        """
        exercises = [
            {
                "id": "54321",
                "name": "5-4-3-2-1 Grounding",
                "duration": "3-5 minutes",
                "description": "Name 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, 1 thing you taste",
                "steps": [
                    "Look around and name 5 things you can see",
                    "Notice 4 things you can physically feel (feet on ground, clothes on skin)",
                    "Listen for 3 things you can hear",
                    "Identify 2 things you can smell (or like to smell)",
                    "Name 1 thing you can taste (or like to taste)"
                ],
                "effectiveness": "Very effective for anxiety and dissociation"
            },
            {
                "id": "box_breathing",
                "name": "Box Breathing",
                "duration": "2-4 minutes",
                "description": "Breathe in square pattern: 4 counts in, 4 hold, 4 out, 4 hold",
                "steps": [
                    "Breathe in slowly for 4 counts",
                    "Hold your breath for 4 counts",
                    "Exhale slowly for 4 counts",
                    "Hold for 4 counts",
                    "Repeat 4-5 times"
                ],
                "effectiveness": "Excellent for calming nervous system"
            },
            {
                "id": "cold_water",
                "name": "Cold Water Technique",
                "duration": "1-2 minutes",
                "description": "Splash cold water on face or hold ice cube to reset nervous system",
                "steps": [
                    "Fill a bowl with cold water or get an ice cube",
                    "Splash cold water on your face, or",
                    "Hold an ice cube in your hand",
                    "Focus on the cold sensation",
                    "Breathe slowly"
                ],
                "effectiveness": "Fast-acting for intense emotions"
            },
            {
                "id": "body_scan",
                "name": "Quick Body Scan",
                "duration": "5 minutes",
                "description": "Systematically notice sensations in each part of your body",
                "steps": [
                    "Sit or lie comfortably",
                    "Start at your feet - notice any sensations",
                    "Move attention slowly up: legs, hips, belly, chest, arms, neck, head",
                    "Don't judge sensations, just notice",
                    "Breathe naturally throughout"
                ],
                "effectiveness": "Good for reconnecting with body"
            },
            {
                "id": "safe_place",
                "name": "Safe Place Visualization",
                "duration": "5-10 minutes",
                "description": "Imagine a safe, peaceful place in detail",
                "steps": [
                    "Close your eyes if comfortable",
                    "Picture a place where you feel completely safe",
                    "Notice details: what you see, hear, smell, feel",
                    "Imagine yourself there, safe and calm",
                    "Stay as long as you need"
                ],
                "effectiveness": "Calming for trauma and overwhelm"
            }
        ]

        return exercises

    # ==================== Escalation Statistics ====================

    async def get_escalation_stats(self, identity_id: str) -> Dict:
        """
        Get statistics about user's crisis escalations
        """
        # Get all escalation events
        escalations = await execute_query("""
            SELECT severity, metadata, created_at
            FROM safety_events
            WHERE identity_id = $1
            AND category = 'crisis_escalation'
            ORDER BY created_at DESC
        """, identity_id)

        if not escalations:
            return {
                "total_escalations": 0,
                "by_severity": {},
                "last_escalation": None,
                "average_response_time": None
            }

        # Calculate statistics
        by_severity = {}
        for escalation in escalations:
            severity = escalation['severity']
            by_severity[severity] = by_severity.get(severity, 0) + 1

        return {
            "total_escalations": len(escalations),
            "by_severity": by_severity,
            "last_escalation": escalations[0]['created_at'].isoformat() if escalations else None,
            "average_response_time": None,  # TODO: Calculate when guardian response tracking implemented
            "escalation_trend": "stable"  # TODO: Calculate trend
        }


# Singleton instance
crisis_escalation_service = CrisisEscalationService()
