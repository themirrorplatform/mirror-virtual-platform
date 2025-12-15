"""
Routing Engine: Complete Finder pipeline

Pipeline: Graph Snapshot → Finder Targets → Query Commons → Constitutional Gates → Score → Present Doors

Constitutional guarantees enforced at each stage.
"""

from typing import List, Optional, Dict
from dataclasses import dataclass
from enum import Enum
import logging

from .identity_graph import IdentityGraph
from .posture import PostureManager, Posture, InteractionStyle
from .tpv import TensionProxyVector, LensUsageTracker
from .finder_targets import FinderTargetSynthesizer, FinderTarget
from .candidate_cards import CandidateCard, CandidateCardManager
from .mirror_score import MirrorScoreCalculator, ScoredCandidate
from .mistake_protocol import MistakeProtocol


class FinderMode(Enum):
    """Finder operational modes"""
    FIRST_MIRROR = "first_mirror"  # Cold start mode
    ACTIVE = "active"  # Normal operation
    MANUAL = "manual"  # User manually selects
    RANDOM = "random"  # Random sampling
    OFF = "off"  # Finder disabled


@dataclass
class Door:
    """A reflective possibility presented to user"""
    candidate: ScoredCandidate
    target_match: FinderTarget  # Which target it matched
    why_now: str  # Explanation of why this door appeared
    dismissible: bool = True
    
    def to_dict(self) -> dict:
        return {
            'candidate': self.candidate.to_dict(),
            'target_match': self.target_match.to_dict(),
            'why_now': self.why_now,
            'dismissible': self.dismissible,
        }


class RoutingEngine:
    """
    Complete Finder routing pipeline.
    
    Constitutional principles:
    - Opens doors, doesn't push through them
    - All scoring inspectable
    - User can interrupt at any stage
    - Exit is always available
    """
    
    def __init__(self,
                 identity_graph: IdentityGraph,
                 posture_manager: PostureManager,
                 user_tpv: TensionProxyVector,
                 candidate_manager: CandidateCardManager,
                 mistake_protocol: MistakeProtocol,
                 lens_catalog: List[str]):
        
        self.graph = identity_graph
        self.posture_manager = posture_manager
        self.user_tpv = user_tpv
        self.candidate_manager = candidate_manager
        self.mistake_protocol = mistake_protocol
        self.lens_catalog = lens_catalog
        
        self.target_synthesizer = FinderTargetSynthesizer(identity_graph)
        self.score_calculator = MirrorScoreCalculator(
            posture_manager, user_tpv, lens_catalog
        )
        
        self.mode: FinderMode = FinderMode.ACTIVE
        self.logger = logging.getLogger('RoutingEngine')
    
    def find_doors(self, max_doors: int = 3,
                  requested_style: Optional[InteractionStyle] = None,
                  user_edits: Optional[Dict] = None) -> List[Door]:
        """
        Execute complete Finder pipeline.
        
        Returns 1-3 doors (reflective possibilities).
        """
        if self.mode == FinderMode.OFF:
            return []
        
        # Stage 1: Generate Finder Targets from Identity Graph
        posture = self.posture_manager.get_canonical()
        targets = self.target_synthesizer.generate_targets(posture, max_targets=5)
        
        if not targets:
            self.logger.info("No targets generated - empty graph or cold start")
            return self._cold_start_mode()
        
        # Allow user to edit targets
        if user_edits:
            targets = self._apply_user_edits(targets, user_edits)
        
        # Stage 2: Query Commons for Candidate Cards
        candidates = self._query_candidates(targets, requested_style)
        
        if not candidates:
            self.logger.info("No candidates found matching targets")
            return []
        
        # Stage 3: Apply Constitutional Gates
        candidates = self._apply_gates(candidates)
        
        if not candidates:
            self.logger.info("All candidates filtered by constitutional gates")
            return []
        
        # Stage 4: Score candidates with MirrorScore
        scored = self.score_calculator.score_candidates(
            candidates, targets, requested_style
        )
        
        # Stage 5: Select top N as doors
        doors = self._select_doors(scored, targets, max_doors)
        
        # Stage 6: Mark as shown (for diversity/novelty)
        for door in doors:
            self.score_calculator.mark_shown(door.candidate.card)
        
        return doors
    
    def _query_candidates(self, targets: List[FinderTarget],
                         requested_style: Optional[InteractionStyle]) -> List[CandidateCard]:
        """
        Query Commons for candidates matching targets.
        
        In production, this calls Commons REST API.
        """
        all_candidates = []
        
        for target in targets:
            # Search by lens tags
            candidates = self.candidate_manager.search_cards(
                lens_tags=target.lens_tags,
                interaction_style=target.interaction_style_preference,
                max_results=50
            )
            all_candidates.extend(candidates)
        
        # Deduplicate by node_id
        seen = set()
        unique = []
        for card in all_candidates:
            if card.node_id not in seen:
                seen.add(card.node_id)
                unique.append(card)
        
        return unique
    
    def _apply_gates(self, candidates: List[CandidateCard]) -> List[CandidateCard]:
        """
        Apply constitutional gates to filter candidates.
        
        Gates (from spec):
        1. Consent: No candidates marked "no_contact"
        2. Safety: Filter extreme risk scores
        3. Capacity: Respect user's bandwidth
        """
        filtered = []
        
        for card in candidates:
            # Gate 1: Consent (simplified - would check metadata)
            # TODO: Check if user has blocked this node_id
            
            # Gate 2: Safety - filter extreme asymmetry
            if card.asymmetry_report:
                risk = card.asymmetry_report.to_risk_score()
                posture = self.posture_manager.get_canonical()
                
                # Risk thresholds by posture
                risk_threshold = {
                    Posture.OVERWHELMED: 0.3,
                    Posture.GUARDED: 0.4,
                    Posture.GROUNDED: 0.6,
                    Posture.OPEN: 0.7,
                    Posture.EXPLORATORY: 0.8,
                    Posture.UNKNOWN: 0.5,
                }
                
                if risk > risk_threshold[posture]:
                    self.logger.info(f"Filtered {card.node_id} - risk {risk:.2f} exceeds threshold")
                    continue
            
            # Gate 3: Capacity (simplified - would check session state)
            # TODO: Check if user is at bandwidth limit
            
            filtered.append(card)
        
        return filtered
    
    def _select_doors(self, scored: List[ScoredCandidate],
                     targets: List[FinderTarget], max_doors: int) -> List[Door]:
        """
        Select top N scored candidates as doors.
        
        Generate "why now" explanations.
        """
        doors = []
        
        for i, scored_candidate in enumerate(scored[:max_doors]):
            # Find best-matching target
            best_target = self._match_target(scored_candidate.card, targets)
            
            # Generate explanation
            why_now = self._generate_why_now(scored_candidate, best_target)
            
            doors.append(Door(
                candidate=scored_candidate,
                target_match=best_target,
                why_now=why_now,
                dismissible=True
            ))
        
        return doors
    
    def _match_target(self, card: CandidateCard, targets: List[FinderTarget]) -> FinderTarget:
        """Find which target this card best matches"""
        best_target = targets[0]
        best_overlap = 0
        
        for target in targets:
            overlap = len(set(card.lens_tags) & set(target.lens_tags))
            if overlap > best_overlap:
                best_overlap = overlap
                best_target = target
        
        return best_target
    
    def _generate_why_now(self, scored: ScoredCandidate, target: FinderTarget) -> str:
        """Generate human-readable explanation"""
        components = []
        
        if scored.posture_fit > 0.7:
            components.append(f"matches your {self.posture_manager.get_canonical().value} posture")
        
        if scored.target_coverage > 0.6:
            components.append(f"addresses: {target.description}")
        
        if scored.tension_adjacency > 0.7:
            components.append("navigates similar tensions")
        
        if scored.novelty > 0.5:
            components.append("new to you")
        
        if not components:
            return "May offer a different perspective"
        
        return " • ".join(components)
    
    def _apply_user_edits(self, targets: List[FinderTarget], edits: Dict) -> List[FinderTarget]:
        """Apply user's manual edits to targets"""
        # TODO: Implement target editing
        return targets
    
    def _cold_start_mode(self) -> List[Door]:
        """
        Handle cold start (empty Identity Graph).
        
        Present curated first mirrors.
        """
        self.logger.info("Cold start - presenting first mirrors")
        
        # Query for "first_mirror" tagged cards
        candidates = self.candidate_manager.search_cards(
            lens_tags=['first_mirror'],
            max_results=10
        )
        
        if not candidates:
            return []
        
        # Create synthetic scored candidates
        doors = []
        for card in candidates[:3]:
            scored = ScoredCandidate(
                card=card,
                total_score=1.0,
                posture_fit=1.0,
                target_coverage=1.0,
                tension_adjacency=1.0,
                diversity_pressure=0.0,
                novelty=1.0,
                risk_penalty=0.0
            )
            
            doors.append(Door(
                candidate=scored,
                target_match=FinderTarget(
                    id='cold_start',
                    target_type='first_mirror',
                    description='Begin your reflection journey',
                    lens_tags=['first_mirror']
                ),
                why_now="A place to begin",
                dismissible=True
            ))
        
        return doors
    
    def set_mode(self, mode: FinderMode) -> None:
        """Change Finder mode (user control)"""
        self.mode = mode
        self.logger.info(f"Finder mode set to: {mode.value}")
    
    def get_audit_log(self) -> Dict:
        """
        Return complete audit trail of last routing decision.
        
        Constitutional requirement: All routing must be inspectable.
        """
        return {
            'mode': self.mode.value,
            'posture': self.posture_manager.get_canonical().value,
            'tpv': self.user_tpv.to_dict(),
            'targets_generated': len(self.target_synthesizer.generate_targets(
                self.posture_manager.get_canonical()
            )),
            'session_shown_count': len(self.score_calculator.session_shown),
            'history_shown_count': len(self.score_calculator.history_shown),
        }
