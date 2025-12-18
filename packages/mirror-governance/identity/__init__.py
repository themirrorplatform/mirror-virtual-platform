"""
Identity and Fork Management

Manages:
- Fork legitimacy determination
- Exit rights enforcement
- Identity continuity across forks
"""

from .fork import ForkManager, Fork, ForkType, ForkLegitimacy
from .exit_rights import ExitRightsManager, ExitRequest, ExitResult

__all__ = [
    "ForkManager",
    "Fork",
    "ForkType",
    "ForkLegitimacy",
    "ExitRightsManager",
    "ExitRequest",
    "ExitResult",
]
