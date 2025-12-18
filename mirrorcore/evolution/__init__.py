# mirrorcore/evolution/__init__.py
"""
Evolution subsystem for MirrorCore.

This module handles tracking engine performance,
constitutional compliance, and user feedback to drive
continuous improvement.
"""

from .engine import EvolutionEngine, EvolutionObserver, EvolutionCritic, EvolutionEvent
__all__ = ['EvolutionEngine', 'EvolutionObserver', 'EvolutionCritic', 'EvolutionEvent']
