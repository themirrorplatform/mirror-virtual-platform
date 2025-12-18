"""
Storage Bridge - Connects Orchestration to Storage Layer

This module bridges the orchestration layer to the storage layer,
handling all data persistence while maintaining constitutional constraints.

Responsibilities:
- Save reflections (user input + AI response)
- Save patterns detected in reflections
- Save tensions identified
- Maintain immutable audit trail
- Export user data on request
- Delete user data on request
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid
import hashlib
import importlib.util
import sys
from pathlib import Path


class StorageType(Enum):
    """Types of storage backends"""
    SQLITE = "sqlite"      # Local SQLite
    SUPABASE = "supabase"  # Cloud with E2E encryption
    MEMORY = "memory"      # In-memory (testing)


@dataclass
class StorageConfig:
    """Configuration for storage backend"""
    storage_type: StorageType = StorageType.SQLITE
    db_path: str = "~/.mirror/data.db"
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    encryption_enabled: bool = True
    encryption_key: Optional[str] = None


@dataclass
class StorageReflection:
    """A stored reflection"""
    id: str
    user_id: str
    session_id: str
    user_input: str
    ai_response: str
    patterns_detected: List[str] = field(default_factory=list)
    tensions_detected: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    input_hash: str = ""  # SHA-256 for integrity
    response_hash: str = ""
    
    def __post_init__(self):
        if not self.input_hash:
            self.input_hash = hashlib.sha256(self.user_input.encode()).hexdigest()
        if not self.response_hash:
            self.response_hash = hashlib.sha256(self.ai_response.encode()).hexdigest()


@dataclass
class StoragePattern:
    """A detected pattern"""
    id: str
    user_id: str
    pattern_type: str  # "emotion", "topic", "behavior"
    name: str
    occurrences: int
    confidence: float
    first_detected: datetime
    last_detected: datetime
    examples: List[str] = field(default_factory=list)


@dataclass
class StorageTension:
    """A detected tension/contradiction"""
    id: str
    user_id: str
    tension_type: str  # "emotional", "behavioral", "temporal"
    description: str
    side_a: str
    side_b: str
    severity: float
    detected_at: datetime


@dataclass
class StorageAuditEvent:
    """An immutable audit trail event"""
    id: str
    user_id: str
    session_id: str
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime
    previous_hash: Optional[str]  # Hash chain for tamper detection
    event_hash: str


class StorageBridge:
    """
    Bridge between orchestration and storage layers.
    
    Handles all persistence operations while maintaining
    constitutional constraints.
    """
    
    def __init__(self, config: StorageConfig):
        self.config = config
        self._storage = None
        self._last_event_hash: Dict[str, str] = {}  # Hash chain per user
        
    async def initialize(self) -> None:
        """Initialize the storage backend"""
        if self.config.storage_type == StorageType.SQLITE:
            # Try regular import first
            try:
                from mirror_storage.local.sqlite import SQLiteStorage
            except ImportError:
                # Fallback: load from source path when package isn't installed
                SQLiteStorage = self._load_local_storage_impl(
                    module_name="mirror_storage.local.sqlite",
                    relative_path=Path(__file__).resolve().parents[1] / "mirror-storage" / "local" / "sqlite.py",
                    class_name="SQLiteStorage",
                )
            
            storage_config = type('Config', (), {
                'user_id': 'default',
                'base_path': self.config.db_path.replace('~', str(__import__('pathlib').Path.home())),
                'encrypt_at_rest': self.config.encryption_enabled,
            })()
            
            self._storage = SQLiteStorage(storage_config)
            await self._storage.initialize()
            
        elif self.config.storage_type == StorageType.SUPABASE:
            from mirror_storage.cloud.supabase import SupabaseStorage
            from mirror_storage.encryption import EncryptionManager
            
            if not self.config.supabase_url or not self.config.supabase_key:
                raise ValueError("Supabase URL and key required for Supabase storage")
            
            encryption = EncryptionManager.from_passphrase(
                self.config.encryption_key or "default"
            )
            
            self._storage = SupabaseStorage(
                url=self.config.supabase_url,
                key=self.config.supabase_key,
                encryption=encryption,
            )
            await self._storage.initialize()
            
        elif self.config.storage_type == StorageType.MEMORY:
            # Try regular import first
            try:
                from mirror_storage.local.memory import MemoryStorage
            except ImportError:
                MemoryStorage = self._load_local_storage_impl(
                    module_name="mirror_storage.local.memory",
                    relative_path=Path(__file__).resolve().parents[1] / "mirror-storage" / "local" / "memory.py",
                    class_name="MemoryStorage",
                )
            
            storage_config = type('Config', (), {
                'user_id': 'default',
            })()
            
            self._storage = MemoryStorage(storage_config)
            await self._storage.initialize()
    
    async def close(self) -> None:
        """Close storage connection"""
        if self._storage:
            await self._storage.close()
    
    async def save_reflection(
        self,
        user_id: str,
        session_id: str,
        user_input: str,
        ai_response: str,
        patterns: Optional[List[str]] = None,
        tensions: Optional[List[str]] = None,
    ) -> StorageReflection:
        """Save a reflection (user input + AI response)"""
        reflection = StorageReflection(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            user_input=user_input,
            ai_response=ai_response,
            patterns_detected=patterns or [],
            tensions_detected=tensions or [],
        )
        
        if self._storage:
            # Convert to mirror_storage format
            Reflection = self._resolve_storage_symbol("Reflection")

            storage_reflection = Reflection(
                id=reflection.id,
                user_id=user_id,
                content=user_input,
                response=ai_response,
                mode="POST_ACTION",
                created_at=reflection.created_at,
                metadata={
                    "session_id": session_id,
                    "patterns": patterns or [],
                    "tensions": tensions or [],
                },
                content_hash=reflection.input_hash,
            )
            
            await self._storage.save_reflection(storage_reflection)
        
        # Log to audit trail
        await self._log_audit_event(
            user_id=user_id,
            session_id=session_id,
            event_type="reflection_saved",
            data={
                "reflection_id": reflection.id,
                "input_length": len(user_input),
                "response_length": len(ai_response),
                "patterns_count": len(patterns or []),
                "tensions_count": len(tensions or []),
            }
        )
        
        return reflection
    
    async def save_pattern(
        self,
        user_id: str,
        pattern_type: str,
        name: str,
        occurrences: int,
        confidence: float,
        examples: Optional[List[str]] = None,
    ) -> StoragePattern:
        """Save a detected pattern"""
        pattern = StoragePattern(
            id=str(uuid.uuid4()),
            user_id=user_id,
            pattern_type=pattern_type,
            name=name,
            occurrences=occurrences,
            confidence=confidence,
            first_detected=datetime.utcnow(),
            last_detected=datetime.utcnow(),
            examples=examples or [],
        )
        
        if self._storage:
            Pattern = self._resolve_storage_symbol("Pattern")

            storage_pattern = Pattern(
                id=pattern.id,
                user_id=user_id,
                pattern_type=pattern_type,
                name=name,
                occurrences=occurrences,
                confidence=confidence,
                first_seen=pattern.first_detected,
                last_seen=pattern.last_detected,
                contexts=examples or [],
            )
            
            await self._storage.save_pattern(storage_pattern)
        
        return pattern
    
    async def save_tension(
        self,
        user_id: str,
        tension_type: str,
        description: str,
        side_a: str,
        side_b: str,
        severity: float = 0.5,
    ) -> StorageTension:
        """Save a detected tension"""
        tension = StorageTension(
            id=str(uuid.uuid4()),
            user_id=user_id,
            tension_type=tension_type,
            description=description,
            side_a=side_a,
            side_b=side_b,
            severity=severity,
            detected_at=datetime.utcnow(),
        )
        
        if self._storage:
            Tension = self._resolve_storage_symbol("Tension")

            storage_tension = Tension(
                id=tension.id,
                user_id=user_id,
                tension_type=tension_type,
                description=description,
                severity=severity,
                first_detected=tension.detected_at,
                last_detected=tension.detected_at,
                evidence=[side_a, side_b],
            )
            
            await self._storage.save_tension(storage_tension)
        
        return tension
    
    async def get_reflections(
        self,
        user_id: str,
        limit: int = 50,
        since: Optional[datetime] = None,
    ) -> List[StorageReflection]:
        """Get user's past reflections"""
        if not self._storage:
            return []
        
        reflections = await self._storage.get_reflections(
            user_id=user_id,
            limit=limit,
            since=since,
        )
        
        return [
            StorageReflection(
                id=r.id,
                user_id=r.user_id,
                session_id=r.metadata.get("session_id", ""),
                user_input=r.content,
                ai_response=r.response or "",
                patterns_detected=r.metadata.get("patterns", []),
                tensions_detected=r.metadata.get("tensions", []),
                created_at=r.created_at,
                input_hash=r.content_hash,
            )
            for r in reflections
        ]
    
    async def get_patterns(self, user_id: str) -> List[StoragePattern]:
        """Get user's detected patterns"""
        if not self._storage:
            return []
        
        patterns = await self._storage.get_patterns(user_id)
        
        return [
            StoragePattern(
                id=p.id,
                user_id=p.user_id,
                pattern_type=p.pattern_type,
                name=p.name,
                occurrences=p.occurrences,
                confidence=p.confidence,
                first_detected=p.first_seen,
                last_detected=p.last_seen,
                examples=p.contexts,
            )
            for p in patterns
        ]
    
    async def get_tensions(self, user_id: str) -> List[StorageTension]:
        """Get user's detected tensions"""
        if not self._storage:
            return []
        
        tensions = await self._storage.get_tensions(user_id)
        
        return [
            StorageTension(
                id=t.id,
                user_id=t.user_id,
                tension_type=t.tension_type,
                description=t.description,
                side_a=t.evidence[0] if t.evidence else "",
                side_b=t.evidence[1] if len(t.evidence) > 1 else "",
                severity=t.severity,
                detected_at=t.first_detected,
            )
            for t in tensions
        ]
    
    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Export all user data (constitutional right).
        
        User can always export their complete data at any time.
        """
        if not self._storage:
            return {}
        
        export = await self._storage.export_all(user_id)
        
        await self._log_audit_event(
            user_id=user_id,
            session_id="",
            event_type="data_exported",
            data={
                "export_timestamp": datetime.utcnow().isoformat(),
                "reflection_count": len(export.get("reflections", [])),
                "pattern_count": len(export.get("patterns", [])),
                "tension_count": len(export.get("tensions", [])),
            }
        )
        
        return export
    
    async def delete_user_data(self, user_id: str) -> bool:
        """
        Delete all user data (constitutional right).
        
        User can request complete deletion at any time.
        This is immediate and complete.
        """
        if not self._storage:
            return True
        
        # Log deletion request BEFORE deleting
        await self._log_audit_event(
            user_id=user_id,
            session_id="",
            event_type="data_deletion_requested",
            data={
                "timestamp": datetime.utcnow().isoformat(),
                "reason": "User requested complete deletion (Axiom 7: Exit Freedom)",
            }
        )
        
        # Delete all data
        result = await self._storage.delete_all(user_id)
        
        return result
    
    async def _log_audit_event(
        self,
        user_id: str,
        session_id: str,
        event_type: str,
        data: Dict[str, Any],
    ) -> str:
        """
        Log an event to the immutable audit trail.
        
        Audit trail uses hash chain for tamper detection.
        """
        if not self._storage:
            return ""
        
        AuditEvent = self._resolve_storage_symbol("AuditEvent")
        
        # Get previous hash for this user
        previous_hash = self._last_event_hash.get(user_id)
        
        # Create event with hash chain
        event_data = {
            **data,
            "previous_hash": previous_hash,
        }
        
        # Hash the event
        event_str = str(sorted(event_data.items()))
        event_hash = hashlib.sha256(event_str.encode()).hexdigest()
        
        # Create audit event
        audit_event = AuditEvent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_type=event_type,
            timestamp=datetime.utcnow(),
            data=data,
            previous_hash=previous_hash,
            event_hash=event_hash,
        )
        
        # Store it
        event_id = await self._storage.append_audit_event(audit_event)
        
        # Update hash chain
        self._last_event_hash[user_id] = event_hash
        
        return event_id
    
    async def verify_audit_trail(self, user_id: str) -> bool:
        """Verify integrity of user's audit trail"""
        if not self._storage:
            return True
        
        return await self._storage.verify_audit_chain(user_id)

    def _load_local_storage_impl(self, module_name: str, relative_path: Path, class_name: str):
        """
        Load a storage implementation class directly from source file when
        the package is not installed. Returns the class object.
        """
        # Ensure synthetic parent package exists for relative imports
        pkg_name = "mirror_storage"
        pkg_path = Path(__file__).resolve().parents[1] / "mirror-storage"
        if pkg_name not in sys.modules:
            init_file = pkg_path / "__init__.py"
            spec_pkg = importlib.util.spec_from_file_location(pkg_name, str(init_file))
            pkg_module = importlib.util.module_from_spec(spec_pkg)
            # Mark as package
            pkg_module.__path__ = [str(pkg_path)]  # type: ignore[attr-defined]
            sys.modules[pkg_name] = pkg_module
            if spec_pkg.loader:
                spec_pkg.loader.exec_module(pkg_module)  # type: ignore

        spec = importlib.util.spec_from_file_location(module_name, str(relative_path))
        module = importlib.util.module_from_spec(spec)
        # Set proper package context
        parent_pkg = module_name.rsplit('.', 1)[0]
        module.__package__ = parent_pkg
        spec.loader.exec_module(module)  # type: ignore
        cls = getattr(module, class_name)
        return cls

    def _resolve_storage_symbol(self, symbol_name: str):
        """
        Resolve symbols from mirror_storage.base with a fallback to source
        files when the package is not installed.
        """
        try:
            from mirror_storage import base as storage_base
            return getattr(storage_base, symbol_name)
        except ImportError:
            # Fallback: load base.py directly
            base_path = Path(__file__).resolve().parents[1] / "mirror-storage" / "base.py"
            spec = importlib.util.spec_from_file_location("mirror_storage.base", str(base_path))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)  # type: ignore
            return getattr(module, symbol_name)
