"""
Proposal System

Handles creation, validation, and lifecycle of governance proposals.
"""

from .schema import Proposal, ProposalChange, ChangeType
from .validator import ProposalValidator

__all__ = [
    "Proposal",
    "ProposalChange",
    "ChangeType",
    "ProposalValidator",
]
