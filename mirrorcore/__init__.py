# mirrorcore/__init__.py
"""
MirrorCore - Sovereign Reflection Engine

This is Layer 1: The core that must never require the platform.

Usage:
    python -m mirrorcore          # Start local web UI
    from mirrorcore import Mirror # Use as library
"""

__version__ = "1.0.0"

from mirrorcore.config import MirrorSettings, get_settings

__all__ = ["MirrorSettings", "get_settings", "__version__"]
