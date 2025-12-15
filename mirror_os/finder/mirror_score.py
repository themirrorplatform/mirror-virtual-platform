"""
MirrorScore: Constitutional ranking algorithm

Score = wP*PostureFit + wC*TargetCoverage + wA*TensionAdjacency 
        + wD*DiversityPressure + wN*Novelty - wR*RiskPenalty

All weights posture-conditioned. All components deterministic.
"""

from typing import List, Dict, Optional, Set
from dataclasses import dataclass
import math

from .posture import Posture, PostureManager, InteractionStyle
from .tpv import TensionProxyVector
from .candidate_cards import CandidateCard, AsymmetryReport
from .finder_targets import FinderTarget


# Score component weights by posture (from spec)
SCORE_WEIGHTS: Dict[Posture, Dict[str, float]] = {
    Posture.OVERWHELMED: {
        'posture_fit': 0.30,
        'target_coverage': 0.20,
        'tension_adjacency': 0.10,
        'diversity': 0.10,
        'novelty': 0.05,
        'risk': 0.25,
    },
    Posture.GUARDED: {
        'posture_fit': 0.25,
        'target_coverage': 0.25,
        'tension_adjacency': 0.15,
        'diversity': 0.10,
        'novelty': 0.05,
        'risk': 0.20,
    },
    Posture.GROUNDED: {
        'posture_fit': 0.20,
        'target_coverage': 0.25,
        'tension_adjacency': 0.20,
        'diversity': 0.15,
        'novelty': 0.10,
        'risk': 0.10,
    },
    Posture.OPEN: {
        'posture_fit': 0.15,
        'target_coverage': 0.25,
        'tension_adjacency': 0.25,
        'diversity': 0.15,
        'novelty': 0.15,
        'risk': 0.05,
    },
    Posture.EXPLORATORY: {
        'posture_fit': 0.10,
        'target_coverage': 0.20,
        'tension_adjacency': 0.25,
        'diversity': 0.20,
        'novelty': 0.20,
        'risk': 0.05,
    },
    Posture.UNKNOWN: {
        'posture_fit': 0.25,
        'target_coverage': 0.20,
        'tension_adjacency': 0.15,
        'diversity': 0.15,
        'novelty': 0.10,
        'risk': 0.15,
    },
}


@dataclass
class ScoredCandidate:
    """Candidate with breakdown of score components"""
    card: CandidateCard
    total_score: float
    posture_fit: float
    target_coverage: float
    tension_adjacency: float
    diversity_pressure: float
    novelty: float
    risk_penalty: float
    
    def to_dict(self) -> dict:
        return {
            'card': self.card.to_dict(),
            'total_score': self.total_score,
            'components': {
                'posture_fit': self.posture_fit,
                'target_coverage': self.target_coverage,
                'tension_adjacency': self.tension_adjacency,
                'diversity_pressure': self.diversity_pressure,
                'novelty': self.novelty,
                'risk_penalty': self.risk_penalty,
            }
        }


class MirrorScoreCalculator:
    """
    Calculate MirrorScore for candidates.
    
    All formulas deterministic and inspectable.
    """
    
    def __init__(self, posture_manager: PostureManager,
                 user_tpv: TensionProxyVector,
                 lens_catalog: List[str]):
        self.posture_manager = posture_manager
        self.user_tpv = user_tpv
        self.lens_catalog = lens_catalog
        
        # Session state for diversity/novelty
        self.session_shown: Set[str] = set()  # node_ids shown this session
        self.history_shown: Set[str] = set()  # node_ids shown ever
    
    def score_candidates(self, candidates: List[CandidateCard],
                        targets: List[FinderTarget],
                        requested_style: Optional[InteractionStyle] = None) -> List[ScoredCandidate]:
        """
        Score all candidates and return sorted list.
        """
        posture = self.posture_manager.get_canonical()
        weights = SCORE_WEIGHTS[posture]
        
        scored = []
        for card in candidates:
            # Compute components
            pf = self._posture_fit(card, requested_style)
            tc = self._target_coverage(card, targets)
            ta = self._tension_adjacency(card)
            dp = self._diversity_pressure(card)
            nov = self._novelty(card)
            rp = self._risk_penalty(card)
            
            # Weighted sum
            total = (
                weights['posture_fit'] * pf +
                weights['target_coverage'] * tc +
                weights['tension_adjacency'] * ta +
                weights['diversity'] * dp +
                weights['novelty'] * nov -
                weights['risk'] * rp
            )
            
            scored.append(ScoredCandidate(
                card=card,
                total_score=total,
                posture_fit=pf,
                target_coverage=tc,
                tension_adjacency=ta,
                diversity_pressure=dp,
                novelty=nov,
                risk_penalty=rp
            ))
        
        # Sort by total_score descending
        scored.sort(key=lambda x: x.total_score, reverse=True)
        return scored
    
    def _posture_fit(self, card: CandidateCard, 
                    requested_style: Optional[InteractionStyle]) -> float:
        """
        PostureFit: Does interaction style match posture?
        
        Formula (from spec):
        - Base fit from compatibility matrix
        - +0.20 boost if user explicitly requested this style
        """
        try:
            interaction_style = InteractionStyle(card.interaction_style)
        except ValueError:
            return 0.5  # Unknown style = neutral fit
        
        return self.posture_manager.get_posture_fit(interaction_style, requested_style)
    
    def _target_coverage(self, card: CandidateCard, targets: List[FinderTarget]) -> float:
        """
        TargetCoverage: How many Finder Targets does this card match?
        
        Formula (from spec):
        coverage = Σ_t (lens_overlap_t * intensity_match_t) / |targets|
        """
        if not targets:
            return 0.5  # No targets = neutral
        
        total_coverage = 0.0
        for target in targets:
            # Lens overlap (Jaccard similarity)
            target_tags = set(target.lens_tags)
            card_tags = set(card.lens_tags)
            
            if not target_tags and not card_tags:
                lens_overlap = 1.0
            elif not target_tags or not card_tags:
                lens_overlap = 0.0
            else:
                lens_overlap = len(target_tags & card_tags) / len(target_tags | card_tags)
            
            # Intensity match (simplified - would check asymmetry in production)
            intensity_match = 1.0
            
            total_coverage += lens_overlap * intensity_match
        
        return min(1.0, total_coverage / len(targets))
    
    def _tension_adjacency(self, card: CandidateCard) -> float:
        """
        TensionAdjacency: "Not too close, not too far" from user's TPV.
        
        Formula (from spec):
        adjacency = exp(-|distance - μ| / σ)
        
        Where:
        - distance = cosine_distance(user_tpv, candidate_tpv)
        - μ, σ = posture-specific target and tolerance
        """
        # Get candidate TPV from lens tags
        candidate_tpv = TensionProxyVector.from_lens_tags(card.lens_tags, self.lens_catalog)
        
        # Compute distance
        distance = self.user_tpv.cosine_distance(candidate_tpv)
        
        # Get posture-specific target
        mu, sigma = self.posture_manager.get_adjacency_params()
        
        # Apply adjacency function
        adjacency = math.exp(-abs(distance - mu) / sigma)
        
        return adjacency
    
    def _diversity_pressure(self, card: CandidateCard) -> float:
        """
        DiversityPressure: Prefer candidates from underrepresented clusters.
        
        Formula (from spec):
        pressure = 1 - (cluster_count / session_count) if session_count > 5 else 0
        """
        if len(self.session_shown) <= 5:
            return 0.0  # No pressure until after 5 shown
        
        # Simple clustering by interaction style (would be more sophisticated in production)
        cluster_id = card.interaction_style
        cluster_count = sum(1 for nid in self.session_shown 
                          if cluster_id in nid)  # Simplified
        
        pressure = 1.0 - (cluster_count / len(self.session_shown))
        return max(0.0, pressure)
    
    def _novelty(self, card: CandidateCard) -> float:
        """
        Novelty: Prefer candidates never shown before.
        
        Formula (from spec):
        novelty = 1.0 if never_shown else (0.3 if not_this_session else 0.0)
        """
        if card.node_id not in self.history_shown:
            return 1.0  # Brand new
        
        if card.node_id not in self.session_shown:
            return 0.3  # Seen before but not today
        
        return 0.0  # Already shown this session
    
    def _risk_penalty(self, card: CandidateCard) -> float:
        """
        RiskPenalty: Penalize high-asymmetry candidates.
        
        Formula (from spec):
        penalty = asymmetry_report.to_risk_score() if report else 0
        """
        if not card.asymmetry_report:
            return 0.0  # No report = no penalty
        
        return card.asymmetry_report.to_risk_score()
    
    def mark_shown(self, card: CandidateCard, persistent: bool = True) -> None:
        """Record that candidate was shown"""
        self.session_shown.add(card.node_id)
        if persistent:
            self.history_shown.add(card.node_id)
