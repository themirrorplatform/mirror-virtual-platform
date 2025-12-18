"""
Voting System

Implements democratic voting with:
- Liquid democracy (vote delegation)
- Quadratic voting (prevents plutocracy)
- Minority protection (supermajority triggers)
"""

from .engine import VotingEngine
from .delegation import DelegationManager
from .quadratic import QuadraticCalculator

__all__ = [
    "VotingEngine",
    "DelegationManager",
    "QuadraticCalculator",
]
