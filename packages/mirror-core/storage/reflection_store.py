"""
Reflection Store

High-level interface for storing and retrieving reflections with
integration to the Mirror pipeline.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from .local_store import LocalStore, StorageConfig
from .encryption import EncryptionManager
from protocol.types import MirrorRequest, MirrorResponse
from engine.pipeline import PipelineResult
from layers.l2_semantic import Pattern, Tension


class ReflectionStore:
    """
    High-level store for reflections with semantic data.
    
    Integrates with Mirror pipeline to persist:
    - User reflections and responses
    - Detected patterns
    - Identified tensions
    - Semantic context
    """
    
    def __init__(
        self,
        config: StorageConfig,
        encryption_manager: Optional[EncryptionManager] = None
    ):
        self.store = LocalStore(config)
        self.encryption = encryption_manager
        self.config = config
    
    def save_reflection(
        self,
        request: MirrorRequest,
        result: PipelineResult
    ) -> str:
        """
        Save a reflection with its response and semantic data.
        
        Returns:
            reflection_id
        """
        reflection_id = str(uuid.uuid4())
        
        # Prepare content (encrypt if enabled)
        content = request.user_content
        response_text = result.response.reflection if result.response else None
        
        if self.encryption and self.config.encrypted:
            content = self.encryption.encrypt(content)
            if response_text:
                response_text = self.encryption.encrypt(response_text)
        
        # Store reflection
        metadata = {
            "mode": request.mode.value,
            "crisis_detected": result.crisis_detected,
            "violations": [v.axiom_id for v in result.violations],
            "execution_time_ms": result.execution_time_ms
        }
        
        self.store.store_reflection(
            reflection_id,
            request.user_id,
            content,
            response_text,
            request.mode.value,
            metadata
        )
        
        # Store patterns if detected
        if result.semantic_context and result.semantic_context.patterns:
            self._save_patterns(request.user_id, result.semantic_context.patterns)
        
        # Store tensions if detected
        if result.semantic_context and result.semantic_context.tensions:
            self._save_tensions(request.user_id, result.semantic_context.tensions)
        
        return reflection_id
    
    def _save_patterns(self, user_id: str, patterns: List[Pattern]) -> None:
        """Save detected patterns"""
        for pattern in patterns:
            pattern_id = f"{user_id}_{pattern.type.value}_{pattern.name}"
            self.store.store_pattern(
                pattern_id,
                user_id,
                pattern.type.value,
                pattern.name,
                pattern.occurrences,
                pattern.first_seen,
                pattern.last_seen,
                pattern.confidence,
                pattern.contexts
            )
    
    def _save_tensions(self, user_id: str, tensions: List[Tension]) -> None:
        """Save detected tensions"""
        # Tensions stored as metadata for now
        # Could be expanded to dedicated table
        pass
    
    def get_reflection_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get user's reflection history"""
        reflections = self.store.get_reflections(user_id, limit=limit)
        
        # Decrypt if needed
        if self.encryption and self.config.encrypted:
            for reflection in reflections:
                if reflection['content']:
                    try:
                        reflection['content'] = self.encryption.decrypt(reflection['content'])
                    except:
                        reflection['content'] = "[Encrypted]"
                
                if reflection['response']:
                    try:
                        reflection['response'] = self.encryption.decrypt(reflection['response'])
                    except:
                        reflection['response'] = "[Encrypted]"
        
        return reflections
    
    def get_user_patterns(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's detected patterns"""
        return self.store.get_patterns(user_id)
    
    def get_storage_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of user's stored data"""
        stats = self.store.get_storage_stats(user_id)
        patterns = self.get_user_patterns(user_id)
        
        return {
            **stats,
            "patterns_summary": {
                "total": len(patterns),
                "by_type": self._count_by_type(patterns)
            }
        }
    
    def _count_by_type(self, patterns: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count patterns by type"""
        counts = {}
        for pattern in patterns:
            ptype = pattern.get('type', 'unknown')
            counts[ptype] = counts.get(ptype, 0) + 1
        return counts
    
    def export_all_data(self, user_id: str) -> Dict[str, Any]:
        """
        Export all user data (sovereignty feature).
        
        Critical for user sovereignty - they can take their data
        and migrate to another system at any time.
        """
        data = self.store.export_data(user_id)
        
        # Decrypt if encrypted
        if self.encryption and self.config.encrypted:
            for reflection in data['reflections']:
                try:
                    if reflection['content']:
                        reflection['content'] = self.encryption.decrypt(reflection['content'])
                    if reflection['response']:
                        reflection['response'] = self.encryption.decrypt(reflection['response'])
                except:
                    pass  # Leave encrypted if decryption fails
        
        return data
