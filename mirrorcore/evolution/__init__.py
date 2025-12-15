# mirrorcore/evolution/__init__.py
"""
Evolution subsystem for MirrorCore.

This module handles tracking engine performance,
constitutional compliance, and user feedback to drive
continuous improvement.
"""

from .observer import EvolutionObserver

__all__ = ['EvolutionObserver']
