"""
Mirror Engine Module

The engine is the heart of Mirror - it processes requests through
the constitutional pipeline: L0 → L1 → L2 → L3 → Response.

Key components:
- pipeline.py: The main processing pipeline
- state.py: Conversation and identity state management
- audit.py: Immutable audit trail
- recovery.py: Error handling and graceful degradation
"""

from .pipeline import MirrorEngine

__all__ = ["MirrorEngine"]
