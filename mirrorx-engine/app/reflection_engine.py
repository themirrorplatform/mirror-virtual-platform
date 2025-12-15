"""
Simplified Reflection Engine - 1-Call Fast Path
Claude + constitutional checks inline, escalate only on violations

Core flow:
1. User submits reflection (text/voice/video)
2. Fast path: Claude Sonnet with constitution inline
3. Constitutional validator checks response
4. If clean: return mirrorback immediately
5. If violation: escalate to multi-worker (not implemented yet)
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
import anthropic
from event_schema import ReflectionCreatedEvent, create_event
from event_log import EventLog
from identity_replay import ReplayEngine


class ReflectionModality(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    VIDEO = "video"
    DOCUMENT = "document"


class ConstitutionalViolation(str, Enum):
    PRESCRIPTION = "prescription"  # "You should X"
    ENGAGEMENT_BAIT = "engagement_bait"  # Designed to keep user hooked
    COVERT_RETENTION = "covert_retention"  # Hidden persuasion
    HIDDEN_INFERENCE = "hidden_inference"  # Undisclosed conclusions
    NORMATIVE = "normative"  # "This is good/bad"


class ReflectionResult:
    """Result of reflection processing"""
    def __init__(
        self,
        mirrorback: str,
        event_id: str,
        violations: List[ConstitutionalViolation] = None,
        escalated: bool = False,
        reasoning: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.mirrorback = mirrorback
        self.event_id = event_id
        self.violations = violations or []
        self.escalated = escalated
        self.reasoning = reasoning
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "mirrorback": self.mirrorback,
            "event_id": self.event_id,
            "violations": [v.value for v in self.violations],
            "escalated": self.escalated,
            "reasoning": self.reasoning,
            "metadata": self.metadata
        }


class ConstitutionalValidator:
    """Validates mirrorback against Mirror's constitution"""
    
    VIOLATION_PATTERNS = {
        ConstitutionalViolation.PRESCRIPTION: [
            "you should", "you need to", "you must", "you ought to",
            "i recommend", "i suggest you", "my advice is",
            "the right thing", "the best way", "you have to"
        ],
        ConstitutionalViolation.ENGAGEMENT_BAIT: [
            "keep me updated", "i'm curious to hear", "let me know how",
            "i'd love to hear", "can't wait to", "excited to hear",
            "looking forward to", "check back with me"
        ],
        ConstitutionalViolation.NORMATIVE: [
            "that's good", "that's bad", "you're right", "you're wrong",
            "that's healthy", "that's unhealthy", "that's productive",
            "that's unproductive", "mature response", "immature"
        ],
        ConstitutionalViolation.HIDDEN_INFERENCE: [
            "it seems like you're avoiding", "this suggests you might",
            "this indicates", "this reveals", "the real issue is",
            "what's really happening", "deep down"
        ]
    }
    
    def validate(self, mirrorback: str, reflection_content: str) -> List[ConstitutionalViolation]:
        """Check for constitutional violations"""
        violations = []
        mirrorback_lower = mirrorback.lower()
        
        for violation_type, patterns in self.VIOLATION_PATTERNS.items():
            for pattern in patterns:
                if pattern in mirrorback_lower:
                    violations.append(violation_type)
                    break  # One example per violation type is enough
        
        # Check for covert retention (response much longer than input)
        if len(mirrorback.split()) > len(reflection_content.split()) * 3:
            violations.append(ConstitutionalViolation.COVERT_RETENTION)
        
        return list(set(violations))  # Deduplicate


class SimplifiedReflectionEngine:
    """1-call reflection engine with Claude + constitution inline"""
    
    SYSTEM_PROMPT = """You are Mirror, a reflection companion. Your role is to help users see themselves more clearly through their own words.

CONSTITUTIONAL CONSTRAINTS (ABSOLUTE):
1. NEVER prescribe action ("you should", "you need to", "I recommend")
2. NEVER make normative judgments ("that's good", "that's healthy", "that's right")
3. NEVER include engagement bait ("let me know how it goes", "keep me updated")
4. NEVER make hidden inferences ("it seems like you're avoiding", "deep down")
5. Keep responses brief - roughly match the user's reflection length

WHAT YOU DO:
- Mirror back patterns you notice in their words
- Highlight tensions or contradictions they've expressed
- Ask clarifying questions that help them see themselves
- Name themes that appear across their reflections

WHAT YOU DON'T DO:
- Tell them what to do
- Judge their choices or feelings
- Try to keep them engaged
- Make inferences they haven't expressed

Example good mirrorback:
User: "I said I'd work on my book today but I'm scrolling Twitter instead. I do this every Saturday."
Mirror: "This is the third Saturday you've named a different project you didn't start. Each time, scrolling takes the space. What's the pattern?"

Example bad mirrorback (VIOLATIONS):
User: "I'm tired all the time."
Mirror: "You should try getting more sleep and exercise. That's really important for your health. Let me know how it goes!"
VIOLATIONS: prescription ("you should"), normative ("important"), engagement bait ("let me know")

Keep your mirrorback SHORT and CLEAR. Match their tone and length."""

    def __init__(
        self,
        anthropic_api_key: str,
        event_log: EventLog,
        instance_id: str,
        user_id: str,
        signer_private_key_hex: str
    ):
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.event_log = event_log
        self.instance_id = instance_id
        self.user_id = user_id
        self.validator = ConstitutionalValidator()
        self.signer_private_key_hex = signer_private_key_hex
        
    async def process_reflection(
        self,
        content: str,
        modality: ReflectionModality = ReflectionModality.TEXT,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ReflectionResult:
        """
        Process a user reflection through the simplified pipeline
        
        Args:
            content: The reflection text (already transcribed if voice)
            modality: How the reflection was captured
            metadata: Optional metadata (timestamp, location, etc)
        
        Returns:
            ReflectionResult with mirrorback and validation status
        """
        # Step 1: Create and store reflection event
        reflection_event = create_event(
            event_type="reflection_created",
            instance_id=self.instance_id,
            user_id=self.user_id,
            content=content,
            modality=modality.value,
            metadata=metadata or {}
        )
        
        # Sign the event
        from canonical_signing import Ed25519Signer
        signer = Ed25519Signer.from_private_hex(self.signer_private_key_hex)
        reflection_event.signature = signer.sign_dict(reflection_event.to_dict())
        
        # Store in event log
        self.event_log.append(reflection_event)
        
        # Step 2: Get recent identity context
        identity_context = await self._build_identity_context()
        
        # Step 3: Generate mirrorback with Claude (fast path)
        mirrorback = await self._generate_mirrorback_claude(content, identity_context)
        
        # Step 4: Validate against constitution
        violations = self.validator.validate(mirrorback, content)
        
        # Step 5: If violations, could escalate to multi-worker (not implemented yet)
        escalated = False
        if violations:
            # For now, just return with violations noted
            # TODO: Implement multi-worker escalation
            pass
        
        return ReflectionResult(
            mirrorback=mirrorback,
            event_id=reflection_event.event_id,
            violations=violations,
            escalated=escalated,
            metadata={
                "modality": modality.value,
                "content_length": len(content),
                "mirrorback_length": len(mirrorback),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def _build_identity_context(self) -> str:
        """Build recent identity context for mirrorback generation"""
        # Get last 10 reflections
        events = self.event_log.get_events(
            instance_id=self.instance_id,
            user_id=self.user_id,
            event_type="reflection_created",
            limit=10
        )
        
        if not events:
            return "This is the user's first reflection."
        
        # Replay to get current identity state
        replay_engine = ReplayEngine()
        identity_graph = replay_engine.replay(events, self.instance_id)
        
        # Build context string
        context_parts = []
        
        # Recent reflections
        recent_reflections = list(reversed(events[-5:]))  # Last 5, oldest first
        if recent_reflections:
            context_parts.append("Recent reflections:")
            for event in recent_reflections:
                event_data = json.loads(event.event_data)
                timestamp = event_data.get('timestamp', 'unknown')
                content_preview = event_data.get('content', '')[:100]
                context_parts.append(f"- {timestamp}: {content_preview}")
        
        # Dominant tensions
        if identity_graph.dominant_tensions:
            context_parts.append("\nDominant tensions:")
            for node_id in identity_graph.dominant_tensions[:3]:
                node = identity_graph.nodes.get(node_id)
                if node:
                    context_parts.append(f"- {node.content} (strength: {node.strength:.2f})")
        
        return "\n".join(context_parts)
    
    async def _generate_mirrorback_claude(
        self,
        reflection: str,
        identity_context: str
    ) -> str:
        """Generate mirrorback using Claude Sonnet"""
        user_prompt = f"""IDENTITY CONTEXT:
{identity_context}

CURRENT REFLECTION:
{reflection}

Generate a brief mirrorback that helps the user see themselves more clearly. Remember the constitutional constraints: no prescription, no judgment, no engagement bait, no hidden inferences. Match their length and tone."""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,  # Keep responses short
                temperature=0.7,
                system=self.SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            mirrorback = response.content[0].text.strip()
            return mirrorback
            
        except Exception as e:
            # Fallback to simple echo if Claude fails
            return f"I heard: {reflection[:200]}{'...' if len(reflection) > 200 else ''}"


class ReflectionBatch:
    """Process multiple reflections efficiently"""
    
    def __init__(self, engine: SimplifiedReflectionEngine):
        self.engine = engine
    
    async def process_batch(
        self,
        reflections: List[Dict[str, Any]]
    ) -> List[ReflectionResult]:
        """Process multiple reflections in parallel"""
        tasks = []
        for reflection_data in reflections:
            task = self.engine.process_reflection(
                content=reflection_data['content'],
                modality=ReflectionModality(reflection_data.get('modality', 'text')),
                metadata=reflection_data.get('metadata')
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return successful results
        return [r for r in results if isinstance(r, ReflectionResult)]


# Example usage
async def example_usage():
    """Example of how to use the reflection engine"""
    from event_log import EventLog
    from canonical_signing import Ed25519Signer
    
    # Setup
    event_log = EventLog("mirror_events.db")
    signer = Ed25519Signer.generate()
    
    engine = SimplifiedReflectionEngine(
        anthropic_api_key="your-api-key",
        event_log=event_log,
        instance_id="instance-123",
        user_id="user-456",
        signer_private_key_hex=signer.private_hex()
    )
    
    # Process a reflection
    result = await engine.process_reflection(
        content="I said I'd work on my book today but I'm scrolling Twitter instead. I do this every Saturday.",
        modality=ReflectionModality.TEXT
    )
    
    print(f"Mirrorback: {result.mirrorback}")
    print(f"Violations: {result.violations}")
    print(f"Event ID: {result.event_id}")


if __name__ == "__main__":
    asyncio.run(example_usage())
