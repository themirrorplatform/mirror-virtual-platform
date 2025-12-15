"""
Mirror Finder: Constitutional Routing Intelligence

MirrorX as Finder - routes users to reflective conditions (people, rooms, artifacts, practices)
using Identity Graph as compass, not engagement optimization.

Constitutional Guarantees:
- Sovereignty: Identity Graph stays local
- Reflection over Prescription: Opens doors, doesn't push through them
- Accountable Power: All routing inspectable, reversible, interruptible
- No Comfort Optimization: Discomfort ≠ negative signal
- No Hidden State: All posture, targets, scores visible
- Exit Is Sacred: Finder can be disabled, data exportable
"""

from .identity_graph import IdentityGraph, GraphNode, GraphEdge
from .tpv import TensionProxyVector, LensUsageTracker
from .posture import PostureManager, Posture
from .finder_targets import FinderTargetSynthesizer, FinderTarget
from .candidate_cards import CandidateCard, CandidateCardManager
from .mirror_score import MirrorScoreCalculator
from .routing_engine import RoutingEngine
from .mistake_protocol import MistakeProtocol, MistakeType

__all__ = [
    'IdentityGraph',
    'GraphNode',
    'GraphEdge',
    'TensionProxyVector',
    'LensUsageTracker',
    'PostureManager',
    'Posture',
    'FinderTargetSynthesizer',
    'FinderTarget',
    'CandidateCard',
    'CandidateCardManager',
    'MirrorScoreCalculator',
    'RoutingEngine',
    'MistakeProtocol',
    'MistakeType',
]
