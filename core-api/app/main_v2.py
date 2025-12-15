"""
Mirror Core API - Complete Backend
FastAPI endpoints for reflections, identity graph, user management
"""
from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import asyncio
import sys
import os

# Add mirrorx-engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'mirrorx-engine', 'app'))

from reflection_engine import SimplifiedReflectionEngine, ReflectionModality, ReflectionResult
from event_log import EventLog
from identity_replay import ReplayEngine, IdentityTimeTravel
from canonical_signing import Ed25519Signer, Ed25519Verifier
from event_schema import create_event


app = FastAPI(
    title="Mirror Core API",
    description="Sovereign reflection platform",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mirror.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Configuration & Dependencies
# ============================================================================

class Config:
    """Global configuration"""
    EVENT_LOG_PATH = os.getenv("EVENT_LOG_PATH", "mirror_events.db")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    GUARDIAN_PUBLIC_KEY = os.getenv("GUARDIAN_PUBLIC_KEY", "")
    
config = Config()

# Global event log
event_log = EventLog(config.EVENT_LOG_PATH)


def get_event_log() -> EventLog:
    """Dependency: Event log"""
    return event_log


async def verify_auth_token(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    """
    Verify authentication token (signed JWT from instance)
    For now, simplified - just extract instance_id and user_id
    TODO: Implement full JWT verification with Ed25519
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    # TODO: Verify JWT signature
    # For now, just decode (INSECURE - fix this)
    import base64
    import json
    try:
        payload = json.loads(base64.b64decode(token + "=="))
        return {
            "instance_id": payload.get("instance_id"),
            "user_id": payload.get("user_id"),
            "private_key_hex": payload.get("private_key_hex")  # TEMPORARY for demo
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============================================================================
# Request/Response Models
# ============================================================================

class ReflectionRequest(BaseModel):
    content: str = Field(..., description="Reflection text")
    modality: str = Field(default="text", description="text|voice|video|document")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional metadata")


class ReflectionResponse(BaseModel):
    mirrorback: str
    event_id: str
    violations: List[str]
    escalated: bool
    metadata: Dict[str, Any]


class MetadataDeclarationRequest(BaseModel):
    metadata_type: str = Field(..., description="goal|value|preference|boundary")
    content: str = Field(..., description="The declared metadata")
    confidence: float = Field(default=1.0, description="User's confidence (0-1)")


class AnnotationConsentRequest(BaseModel):
    annotation_content: str = Field(..., description="The annotation being consented to")
    consent_status: str = Field(..., description="accepted|rejected|modified")
    modified_content: Optional[str] = Field(default=None, description="If modified, the new content")


class PostureDeclarationRequest(BaseModel):
    posture: str = Field(..., description="The declared posture")
    reason: Optional[str] = Field(default=None, description="Why this posture")
    duration_intent: Optional[str] = Field(default=None, description="How long in this posture")


class IdentityGraphResponse(BaseModel):
    instance_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    current_posture: Optional[str]
    dominant_tensions: List[str]
    last_replayed_seq: int
    state_hash: str


class TimeTravelRequest(BaseModel):
    cutoff_timestamp: str = Field(..., description="ISO timestamp to query 'as of'")


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    event_log_path: str
    event_count: int


# ============================================================================
# Health & Info
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check(log: EventLog = Depends(get_event_log)):
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        event_log_path=config.EVENT_LOG_PATH,
        event_count=log.count_events()
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Mirror Core API",
        "version": "2.0.0",
        "constitution": "no-prescription, no-engagement-bait, no-normative, no-hidden-inference"
    }


# ============================================================================
# Reflection Endpoints
# ============================================================================

@app.post("/v1/reflect", response_model=ReflectionResponse)
async def create_reflection(
    request: ReflectionRequest,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """
    Process a user reflection
    Returns mirrorback with constitutional validation
    """
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    private_key_hex = auth["private_key_hex"]
    
    # Create reflection engine
    engine = SimplifiedReflectionEngine(
        anthropic_api_key=config.ANTHROPIC_API_KEY,
        event_log=log,
        instance_id=instance_id,
        user_id=user_id,
        signer_private_key_hex=private_key_hex
    )
    
    # Process reflection
    result = await engine.process_reflection(
        content=request.content,
        modality=ReflectionModality(request.modality),
        metadata=request.metadata
    )
    
    return ReflectionResponse(
        mirrorback=result.mirrorback,
        event_id=result.event_id,
        violations=[v.value for v in result.violations],
        escalated=result.escalated,
        metadata=result.metadata
    )


@app.get("/v1/reflections")
async def list_reflections(
    limit: int = 50,
    since_seq: Optional[int] = None,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """List user's reflections"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    
    events = log.get_events(
        instance_id=instance_id,
        user_id=user_id,
        event_type="reflection_created",
        since_seq=since_seq,
        limit=limit
    )
    
    import json
    reflections = []
    for event in events:
        event_data = json.loads(event.event_data)
        reflections.append({
            "seq": event.seq,
            "event_id": event.event_id,
            "timestamp": event.timestamp,
            "content": event_data.get("content"),
            "modality": event_data.get("modality"),
            "metadata": event_data.get("metadata", {})
        })
    
    return {"reflections": reflections, "count": len(reflections)}


# ============================================================================
# Metadata & Declaration Endpoints
# ============================================================================

@app.post("/v1/metadata/declare")
async def declare_metadata(
    request: MetadataDeclarationRequest,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """User explicitly declares metadata (goal/value/preference/boundary)"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    private_key_hex = auth["private_key_hex"]
    
    # Create event
    event = create_event(
        event_type="metadata_declared",
        instance_id=instance_id,
        user_id=user_id,
        metadata_type=request.metadata_type,
        content=request.content,
        confidence=request.confidence
    )
    
    # Sign and append
    signer = Ed25519Signer.from_private_hex(private_key_hex)
    event.signature = signer.sign_dict(event.to_dict())
    log.append(event)
    
    return {
        "event_id": event.event_id,
        "metadata_type": request.metadata_type,
        "content": request.content,
        "timestamp": event.timestamp
    }


@app.post("/v1/annotation/consent")
async def consent_annotation(
    request: AnnotationConsentRequest,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """User consents (accepts/rejects/modifies) to MirrorX annotation"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    private_key_hex = auth["private_key_hex"]
    
    event = create_event(
        event_type="annotation_consented",
        instance_id=instance_id,
        user_id=user_id,
        annotation_content=request.annotation_content,
        consent_status=request.consent_status,
        modified_content=request.modified_content
    )
    
    signer = Ed25519Signer.from_private_hex(private_key_hex)
    event.signature = signer.sign_dict(event.to_dict())
    log.append(event)
    
    return {
        "event_id": event.event_id,
        "consent_status": request.consent_status,
        "timestamp": event.timestamp
    }


@app.post("/v1/posture/declare")
async def declare_posture(
    request: PostureDeclarationRequest,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """User declares current posture (interface control)"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    private_key_hex = auth["private_key_hex"]
    
    event = create_event(
        event_type="posture_declared",
        instance_id=instance_id,
        user_id=user_id,
        posture=request.posture,
        reason=request.reason,
        duration_intent=request.duration_intent
    )
    
    signer = Ed25519Signer.from_private_hex(private_key_hex)
    event.signature = signer.sign_dict(event.to_dict())
    log.append(event)
    
    return {
        "event_id": event.event_id,
        "posture": request.posture,
        "timestamp": event.timestamp
    }


# ============================================================================
# Identity Graph Endpoints
# ============================================================================

@app.get("/v1/identity/graph", response_model=IdentityGraphResponse)
async def get_identity_graph(
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """Get current identity graph (derived from event replay)"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    
    # Get all events for this instance
    events = log.get_events(
        instance_id=instance_id,
        user_id=user_id
    )
    
    if not events:
        return IdentityGraphResponse(
            instance_id=instance_id,
            nodes=[],
            edges=[],
            current_posture=None,
            dominant_tensions=[],
            last_replayed_seq=0,
            state_hash=""
        )
    
    # Replay to build identity graph
    replay_engine = ReplayEngine()
    identity_graph = replay_engine.replay(events, instance_id)
    
    # Convert to response format
    nodes = [
        {
            "node_id": node.node_id,
            "node_type": node.node_type,
            "content": node.content,
            "strength": node.strength,
            "occurrence_count": node.occurrence_count,
            "first_seen": node.first_seen.isoformat(),
            "last_seen": node.last_seen.isoformat(),
            "evidence": node.evidence
        }
        for node in identity_graph.nodes.values()
    ]
    
    edges = [
        {
            "edge_id": edge.edge_id,
            "source_node_id": edge.source_node_id,
            "target_node_id": edge.target_node_id,
            "edge_type": edge.edge_type,
            "weight": edge.weight,
            "first_seen": edge.first_seen.isoformat(),
            "last_seen": edge.last_seen.isoformat()
        }
        for edge in identity_graph.edges.values()
    ]
    
    return IdentityGraphResponse(
        instance_id=identity_graph.instance_id,
        nodes=nodes,
        edges=edges,
        current_posture=identity_graph.current_posture,
        dominant_tensions=identity_graph.dominant_tensions,
        last_replayed_seq=identity_graph.last_replayed_seq,
        state_hash=identity_graph.state_hash()
    )


@app.post("/v1/identity/timetravel")
async def identity_time_travel(
    request: TimeTravelRequest,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """Query identity graph 'as of' a specific timestamp"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    
    # Get all events for this instance
    events = log.get_events(
        instance_id=instance_id,
        user_id=user_id
    )
    
    # Time travel
    time_traveler = IdentityTimeTravel()
    past_graph = time_traveler.as_of(
        events=events,
        instance_id=instance_id,
        cutoff_timestamp=request.cutoff_timestamp
    )
    
    # Convert to response (same format as get_identity_graph)
    nodes = [
        {
            "node_id": node.node_id,
            "node_type": node.node_type,
            "content": node.content,
            "strength": node.strength,
            "occurrence_count": node.occurrence_count,
            "first_seen": node.first_seen.isoformat(),
            "last_seen": node.last_seen.isoformat()
        }
        for node in past_graph.nodes.values()
    ]
    
    return {
        "instance_id": past_graph.instance_id,
        "cutoff_timestamp": request.cutoff_timestamp,
        "nodes": nodes,
        "edges": [
            {
                "edge_id": edge.edge_id,
                "source": edge.source_node_id,
                "target": edge.target_node_id,
                "type": edge.edge_type,
                "weight": edge.weight
            }
            for edge in past_graph.edges.values()
        ],
        "dominant_tensions": past_graph.dominant_tensions
    }


@app.get("/v1/identity/diff")
async def identity_diff(
    start_date: str,
    end_date: str,
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """Compare identity graph between two time periods"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    
    events = log.get_events(
        instance_id=instance_id,
        user_id=user_id
    )
    
    time_traveler = IdentityTimeTravel()
    diff = time_traveler.compare_periods(
        events=events,
        instance_id=instance_id,
        start_timestamp=start_date,
        end_timestamp=end_date
    )
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "nodes_added": [
            {"node_id": n.node_id, "content": n.content, "type": n.node_type}
            for n in diff.nodes_added
        ],
        "nodes_removed": [
            {"node_id": n.node_id, "content": n.content}
            for n in diff.nodes_removed
        ],
        "nodes_modified": [
            {
                "node_id": node_id,
                "old_strength": old_strength,
                "new_strength": new_strength,
                "content": [n for n in diff.nodes_added + diff.nodes_removed if n.node_id == node_id][0].content if any(n.node_id == node_id for n in diff.nodes_added + diff.nodes_removed) else "unknown"
            }
            for node_id, old_strength, new_strength in diff.nodes_modified
        ],
        "edges_added": len(diff.edges_added),
        "edges_removed": len(diff.edges_removed)
    }


# ============================================================================
# Export & Portability
# ============================================================================

@app.get("/v1/export")
async def export_data(
    auth: Dict[str, str] = Depends(verify_auth_token),
    log: EventLog = Depends(get_event_log)
):
    """Export all user data (sovereignty guarantee)"""
    instance_id = auth["instance_id"]
    user_id = auth["user_id"]
    
    # Export event log
    import tempfile
    import json
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
    log.export_log(instance_id, temp_file.name)
    
    with open(temp_file.name, 'r') as f:
        data = json.load(f)
    
    os.unlink(temp_file.name)
    
    return {
        "instance_id": instance_id,
        "user_id": user_id,
        "export_timestamp": datetime.utcnow().isoformat(),
        "event_count": len(data.get("events", [])),
        "data": data
    }


# ============================================================================
# Admin/Debug Endpoints (should be auth-protected in production)
# ============================================================================

@app.get("/admin/stats")
async def admin_stats(log: EventLog = Depends(get_event_log)):
    """System statistics"""
    total_events = log.count_events()
    
    # Count by event type
    import sqlite3
    conn = sqlite3.connect(config.EVENT_LOG_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT event_type, COUNT(*) FROM events GROUP BY event_type")
    type_counts = dict(cursor.fetchall())
    conn.close()
    
    return {
        "total_events": total_events,
        "events_by_type": type_counts,
        "database_path": config.EVENT_LOG_PATH
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
