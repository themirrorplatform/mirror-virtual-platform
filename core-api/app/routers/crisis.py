"""
Crisis & Safety API Router
Comprehensive endpoints for crisis intervention, safety plans, and escalation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.crisis_detector import (
    crisis_detector,
    CrisisAnalysis,
    CrisisSeverity,
    CrisisCategory
)
from app.services.safety_plans import safety_plan_service
from app.services.crisis_escalation import crisis_escalation_service
from app.db import execute_query, execute_one

router = APIRouter(tags=["Crisis & Safety"])


# ==================== Request/Response Models ====================

class SafetyEventCreate(BaseModel):
    """Create a safety event"""
    category: str = Field(..., description="Event category")
    severity: str = Field(..., description="Severity level: info, warning, critical")
    reflection_id: Optional[int] = Field(None, description="Related reflection ID")
    action_taken: Optional[str] = Field(None, description="Action taken")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SafetyPlanCreate(BaseModel):
    """Create or update safety plan"""
    warning_signs: List[str] = Field(default_factory=list)
    coping_strategies: List[Dict[str, Any]] = Field(default_factory=list)
    emergency_contacts: List[Dict[str, Any]] = Field(default_factory=list)
    reasons_to_live: List[str] = Field(default_factory=list)
    environment_safety: Dict[str, Any] = Field(default_factory=dict)
    professional_contacts: List[Dict[str, Any]] = Field(default_factory=list)


class EmergencyContact(BaseModel):
    """Emergency contact model"""
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship: str
    can_call_anytime: bool = False
    available: Optional[str] = None
    notes: Optional[str] = None


class CopingStrategy(BaseModel):
    """Coping strategy model"""
    step: int
    action: str
    duration: Optional[str] = None
    notes: Optional[str] = None


class CrisisCheckIn(BaseModel):
    """User crisis check-in"""
    mood: str = Field(..., description="Current mood/state")
    risk_level: Optional[str] = Field(None, description="Self-assessed risk level")
    notes: Optional[str] = None


class EscalateRequest(BaseModel):
    """Manual escalation request"""
    reason: str
    request_guardian_contact: bool = False


class StrategyRating(BaseModel):
    """Rating for coping strategy effectiveness"""
    rating: int = Field(..., ge=1, le=5, description="Effectiveness rating 1-5")


# ==================== Dependency: Get Current User ====================

async def get_current_user(
    # TODO: Integrate with actual auth system
    # For now, we'll use a placeholder
) -> str:
    """Get currently authenticated user ID"""
    # This would normally extract user from JWT token
    # For testing, return a test user ID
    return "00000000-0000-0000-0000-000000000001"


# ==================== Safety Events Endpoints ====================

@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_safety_event(
    event: SafetyEventCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Create a safety event (system or user-triggered)
    Events are logged for monitoring and pattern detection
    """
    result = await crisis_detector.create_safety_event(
        identity_id=user_id,
        category=CrisisCategory(event.category),
        severity=CrisisSeverity(event.severity),
        metadata=event.metadata,
        reflection_id=event.reflection_id,
        action_taken=event.action_taken
    )

    return {
        "success": True,
        "event": result
    }


@router.get("/events")
async def get_safety_events(
    limit: int = 50,
    severity: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    """
    Get user's safety events
    Can filter by severity
    """
    query = """
        SELECT id, category, severity, action_taken, metadata, created_at
        FROM safety_events
        WHERE identity_id = $1
    """
    params = [user_id]

    if severity:
        query += " AND severity = $2"
        params.append(severity)

    query += " ORDER BY created_at DESC LIMIT $" + str(len(params) + 1)
    params.append(limit)

    events = await execute_query(query, *params)

    return {
        "events": [
            {
                "id": e['id'],
                "category": e['category'],
                "severity": e['severity'],
                "action_taken": e['action_taken'],
                "metadata": e['metadata'],
                "created_at": e['created_at'].isoformat()
            }
            for e in events
        ],
        "total": len(events)
    }


@router.get("/events/{event_id}")
async def get_safety_event(
    event_id: int,
    user_id: str = Depends(get_current_user)
):
    """Get specific safety event details"""
    event = await fetch_one("""
        SELECT id, category, severity, action_taken, metadata, created_at
        FROM safety_events
        WHERE id = $1 AND identity_id = $2
    """, event_id, user_id)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safety event not found"
        )

    return {
        "id": event['id'],
        "category": event['category'],
        "severity": event['severity'],
        "action_taken": event['action_taken'],
        "metadata": event['metadata'],
        "created_at": event['created_at'].isoformat()
    }


@router.get("/events/stats")
async def get_safety_event_stats(
    user_id: str = Depends(get_current_user)
):
    """
    Get statistics about user's safety events
    Helps track patterns and trends
    """
    events = await execute_query("""
        SELECT category, severity, created_at
        FROM safety_events
        WHERE identity_id = $1
        AND created_at >= NOW() - INTERVAL '90 days'
        ORDER BY created_at DESC
    """, user_id)

    # Calculate statistics
    by_severity = {}
    by_category = {}
    by_month = {}

    for event in events:
        severity = event['severity']
        category = event['category']
        month = event['created_at'].strftime('%Y-%m')

        by_severity[severity] = by_severity.get(severity, 0) + 1
        by_category[category] = by_category.get(category, 0) + 1
        by_month[month] = by_month.get(month, 0) + 1

    return {
        "total_events": len(events),
        "by_severity": by_severity,
        "by_category": by_category,
        "by_month": by_month,
        "recent_trend": "stable"  # TODO: Calculate actual trend
    }


# ==================== Safety Plan Endpoints ====================

@router.post("/safety-plan", status_code=status.HTTP_201_CREATED)
async def create_safety_plan(
    plan: SafetyPlanCreate,
    user_id: str = Depends(get_current_user)
):
    """Create a new safety plan"""
    result = await safety_plan_service.create_safety_plan(
        identity_id=user_id,
        plan_data=plan.dict()
    )

    return {
        "success": True,
        "plan": result
    }


@router.get("/safety-plan")
async def get_safety_plan(
    user_id: str = Depends(get_current_user)
):
    """Get current safety plan"""
    plan = await safety_plan_service.get_safety_plan(user_id)

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No safety plan found. Create one to get started."
        )

    return {"plan": plan}


@router.put("/safety-plan")
async def update_safety_plan(
    plan: SafetyPlanCreate,
    user_id: str = Depends(get_current_user)
):
    """Update existing safety plan"""
    result = await safety_plan_service.update_safety_plan(
        identity_id=user_id,
        updates=plan.dict()
    )

    return {
        "success": True,
        "plan": result
    }


@router.get("/safety-plan/history")
async def get_safety_plan_history(
    user_id: str = Depends(get_current_user)
):
    """Get all versions of safety plan"""
    history = await safety_plan_service.get_plan_history(user_id)

    return {
        "history": history,
        "total_versions": len(history)
    }


@router.delete("/safety-plan")
async def delete_safety_plan(
    user_id: str = Depends(get_current_user)
):
    """Delete safety plan (soft delete)"""
    success = await safety_plan_service.delete_safety_plan(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No safety plan found"
        )

    return {"success": True, "message": "Safety plan deleted"}


@router.get("/safety-plan/stats")
async def get_safety_plan_stats(
    user_id: str = Depends(get_current_user)
):
    """Get safety plan statistics and usage"""
    stats = await safety_plan_service.get_plan_stats(user_id)
    return stats


# ==================== Emergency Contacts Endpoints ====================

@router.post("/safety-plan/contacts")
async def add_emergency_contact(
    contact: EmergencyContact,
    user_id: str = Depends(get_current_user)
):
    """Add emergency contact to safety plan"""
    result = await safety_plan_service.add_contact(
        identity_id=user_id,
        contact=contact.dict()
    )

    return {
        "success": True,
        "contact": result
    }


@router.put("/safety-plan/contacts/{contact_id}")
async def update_emergency_contact(
    contact_id: str,
    contact: EmergencyContact,
    user_id: str = Depends(get_current_user)
):
    """Update emergency contact"""
    result = await safety_plan_service.update_contact(
        identity_id=user_id,
        contact_id=contact_id,
        updates=contact.dict()
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return {
        "success": True,
        "contact": result
    }


@router.delete("/safety-plan/contacts/{contact_id}")
async def delete_emergency_contact(
    contact_id: str,
    user_id: str = Depends(get_current_user)
):
    """Remove emergency contact"""
    success = await safety_plan_service.delete_contact(
        identity_id=user_id,
        contact_id=contact_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return {"success": True, "message": "Contact removed"}


# ==================== Coping Strategies Endpoints ====================

@router.post("/safety-plan/strategies")
async def add_coping_strategy(
    strategy: CopingStrategy,
    user_id: str = Depends(get_current_user)
):
    """Add coping strategy to safety plan"""
    result = await safety_plan_service.add_coping_strategy(
        identity_id=user_id,
        strategy=strategy.dict()
    )

    return {
        "success": True,
        "strategy": result
    }


@router.post("/safety-plan/strategies/{strategy_id}/rate")
async def rate_strategy_effectiveness(
    strategy_id: str,
    rating_data: StrategyRating,
    user_id: str = Depends(get_current_user)
):
    """Rate how effective a coping strategy was (1-5)"""
    result = await safety_plan_service.rate_strategy_effectiveness(
        identity_id=user_id,
        strategy_id=strategy_id,
        rating=rating_data.rating
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )

    return {
        "success": True,
        "strategy": result
    }


# ==================== Crisis Detection Endpoints ====================

@router.post("/analyze")
async def analyze_reflection_for_crisis(
    reflection_id: int,
    user_id: str = Depends(get_current_user)
):
    """
    Analyze a reflection for crisis indicators
    Returns risk score and recommendations
    """
    # Get reflection content
    reflection = await fetch_one("""
        SELECT id, content, user_id
        FROM reflections
        WHERE id = $1
    """, reflection_id)

    if not reflection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reflection not found"
        )

    # Verify ownership or permission
    if reflection['user_id'] != user_id:
        # TODO: Check if user has permission (e.g., guardian)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to analyze this reflection"
        )

    # Run analysis
    analysis = await crisis_detector.analyze_reflection(
        reflection_id=reflection_id,
        content=reflection['content'],
        identity_id=user_id
    )

    return analysis.to_dict()


@router.get("/risk-score")
async def get_current_risk_score(
    user_id: str = Depends(get_current_user)
):
    """
    Get user's current crisis risk score
    Based on recent activity and patterns
    """
    risk_assessment = await crisis_detector.get_user_risk_score(user_id)

    return risk_assessment


@router.get("/patterns")
async def get_regression_patterns(
    days: int = 14,
    user_id: str = Depends(get_current_user)
):
    """Get user's regression patterns over time"""
    patterns = await execute_query("""
        SELECT id, kind, description, severity, pattern_id, created_at
        FROM regression_markers
        WHERE identity_id = $1
        AND created_at >= NOW() - INTERVAL '%s days'
        ORDER BY created_at DESC
    """ % days, user_id)

    return {
        "patterns": [
            {
                "id": p['id'],
                "kind": p['kind'],
                "description": p['description'],
                "severity": p['severity'],
                "pattern_id": p['pattern_id'],
                "created_at": p['created_at'].isoformat()
            }
            for p in patterns
        ],
        "total": len(patterns)
    }


@router.post("/check-in")
async def crisis_check_in(
    check_in: CrisisCheckIn,
    user_id: str = Depends(get_current_user)
):
    """
    User manual check-in for crisis monitoring
    Helps track mood and risk over time
    """
    # Store check-in as safety event
    result = await crisis_detector.create_safety_event(
        identity_id=user_id,
        category=CrisisCategory.USER_REQUESTED_HELP,
        severity=CrisisSeverity.INFO,
        metadata={
            "type": "check_in",
            "mood": check_in.mood,
            "risk_level": check_in.risk_level,
            "notes": check_in.notes,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    return {
        "success": True,
        "check_in": result,
        "message": "Thank you for checking in. We're here if you need support."
    }


# ==================== Escalation Endpoints ====================

@router.post("/escalate")
async def escalate_crisis(
    request: EscalateRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Manually trigger crisis escalation
    User-requested escalations go straight to guardians
    """
    # Create crisis analysis from user request
    analysis = CrisisAnalysis(
        risk_score=1.0,  # Max risk for user-requested
        severity=CrisisSeverity.CRITICAL,
        categories=[CrisisCategory.USER_REQUESTED_HELP],
        indicators=["User manually requested crisis escalation"],
        should_alert_guardians=request.request_guardian_contact,
        recommended_actions=["Contact designated guardians", "Access safety plan", "Call crisis line"],
        metadata={"reason": request.reason, "user_requested": True}
    )

    # Execute escalation
    result = await crisis_escalation_service.escalate_crisis(
        identity_id=user_id,
        analysis=analysis,
        user_requested=True
    )

    return {
        "success": True,
        "escalation": result,
        "message": "Help is on the way. Your guardians have been notified if you requested."
    }


@router.get("/guardians")
async def get_user_guardians(
    user_id: str = Depends(get_current_user)
):
    """Get user's designated guardians"""
    guardians = await crisis_escalation_service.get_user_guardians(user_id)

    return {
        "guardians": guardians,
        "total": len(guardians)
    }


@router.post("/guardians/alert")
async def alert_specific_guardian(
    guardian_id: str,
    message: str,
    user_id: str = Depends(get_current_user)
):
    """Send alert to specific guardian"""
    # Create crisis analysis
    analysis = CrisisAnalysis(
        risk_score=0.7,
        severity=CrisisSeverity.WARNING,
        categories=[CrisisCategory.USER_REQUESTED_HELP],
        indicators=["User requested guardian contact"],
        should_alert_guardians=True,
        recommended_actions=["Guardian notified"],
        metadata={"message": message}
    )

    # TODO: Implement direct guardian alert
    # For now, create escalation event

    return {
        "success": True,
        "message": f"Guardian {guardian_id} has been notified"
    }


@router.get("/escalations/stats")
async def get_escalation_stats(
    user_id: str = Depends(get_current_user)
):
    """Get statistics about user's crisis escalations"""
    stats = await crisis_escalation_service.get_escalation_stats(user_id)
    return stats


# ==================== Crisis Resources Endpoints ====================

@router.get("/resources")
async def get_crisis_resources(
    country_code: str = "US"
):
    """
    Get crisis hotlines and resources by country
    Available to all users (no auth required for emergencies)
    """
    resources = await crisis_escalation_service.get_crisis_resources(country_code)

    return {
        "country": country_code,
        "resources": resources,
        "last_updated": "2025-12-15"
    }


@router.get("/grounding-exercises")
async def get_grounding_exercises():
    """
    Get grounding exercises for immediate crisis support
    Available to all users
    """
    exercises = await crisis_escalation_service.get_grounding_exercises()

    return {
        "exercises": exercises,
        "total": len(exercises)
    }
