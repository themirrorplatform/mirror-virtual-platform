"""
Candidate Cards: Public metadata about reflective conditions

These go to Commons. Never contain identity graphs or private data.
Include asymmetry metrics (structural, not ideological).
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class AsymmetryLevel(Enum):
    """Structural asymmetry levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EvidenceTier(Enum):
    """Evidence quality tiers (from spec)"""
    DECLARED = "declared"  # Self-reported (weight: 0.30)
    ATTESTED = "attested"  # Third-party verification (weight: 0.50)
    OBSERVED = "observed"  # System observation (weight: 0.80)


@dataclass
class AsymmetryReport:
    """Asymmetry metrics for candidate"""
    exit_friction: AsymmetryLevel
    data_demand_ratio: float  # 0.0 to 1.0
    opacity: bool
    identity_coercion: bool
    unilateral_control: bool
    lock_in_terms: bool
    evidence_tier: EvidenceTier
    reported_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_risk_score(self) -> float:
        """
        Convert asymmetry to risk score (0.0 to 1.0).
        
        Applies evidence tier weighting.
        """
        # Evidence tier weights (from spec)
        tier_weights = {
            EvidenceTier.DECLARED: 0.30,
            EvidenceTier.ATTESTED: 0.50,
            EvidenceTier.OBSERVED: 0.80,
        }
        
        # Component scores
        friction_score = {
            AsymmetryLevel.LOW: 0.1,
            AsymmetryLevel.MEDIUM: 0.4,
            AsymmetryLevel.HIGH: 0.8,
        }[self.exit_friction]
        
        boolean_count = sum([
            self.opacity,
            self.identity_coercion,
            self.unilateral_control,
            self.lock_in_terms,
        ])
        
        # Base risk
        base_risk = (
            friction_score * 0.3 +
            self.data_demand_ratio * 0.2 +
            (boolean_count / 4.0) * 0.5
        )
        
        # Apply evidence tier weighting
        return base_risk * tier_weights[self.evidence_tier]


@dataclass
class CandidateCard:
    """
    Public metadata about a reflective condition.
    
    Minimum viable: node_id, card_type, interaction_style, lens_tags
    Optional: asymmetry report, attestations
    """
    node_id: str  # Unique identifier
    card_type: str  # "person", "room", "artifact", "practice"
    interaction_style: str  # "witness", "dialogue", "debate", "structured"
    lens_tags: List[str]  # Which lenses this relates to
    
    # Optional
    title: Optional[str] = None
    description: Optional[str] = None
    creator_id: Optional[str] = None
    asymmetry_report: Optional[AsymmetryReport] = None
    attestation_count: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        result = {
            'node_id': self.node_id,
            'card_type': self.card_type,
            'interaction_style': self.interaction_style,
            'lens_tags': self.lens_tags,
            'attestation_count': self.attestation_count,
            'created_at': self.created_at.isoformat(),
        }
        
        if self.title:
            result['title'] = self.title
        if self.description:
            result['description'] = self.description
        if self.asymmetry_report:
            result['asymmetry_report'] = {
                'exit_friction': self.asymmetry_report.exit_friction.value,
                'data_demand_ratio': self.asymmetry_report.data_demand_ratio,
                'opacity': self.asymmetry_report.opacity,
                'identity_coercion': self.asymmetry_report.identity_coercion,
                'unilateral_control': self.asymmetry_report.unilateral_control,
                'lock_in_terms': self.asymmetry_report.lock_in_terms,
                'evidence_tier': self.asymmetry_report.evidence_tier.value,
                'risk_score': self.asymmetry_report.to_risk_score(),
            }
        
        return result
    
    @staticmethod
    def from_dict(data: dict) -> 'CandidateCard':
        """Deserialize from dict"""
        asymmetry_report = None
        if 'asymmetry_report' in data:
            ar = data['asymmetry_report']
            asymmetry_report = AsymmetryReport(
                exit_friction=AsymmetryLevel(ar['exit_friction']),
                data_demand_ratio=ar['data_demand_ratio'],
                opacity=ar['opacity'],
                identity_coercion=ar['identity_coercion'],
                unilateral_control=ar['unilateral_control'],
                lock_in_terms=ar['lock_in_terms'],
                evidence_tier=EvidenceTier(ar['evidence_tier']),
            )
        
        return CandidateCard(
            node_id=data['node_id'],
            card_type=data['card_type'],
            interaction_style=data['interaction_style'],
            lens_tags=data['lens_tags'],
            title=data.get('title'),
            description=data.get('description'),
            creator_id=data.get('creator_id'),
            asymmetry_report=asymmetry_report,
            attestation_count=data.get('attestation_count', 0),
            created_at=datetime.fromisoformat(data['created_at']) if 'created_at' in data else datetime.utcnow(),
        )


class CandidateCardManager:
    """
    Manages candidate card lifecycle.
    
    Local storage + Commons sync.
    """
    
    def __init__(self, storage_path):
        self.storage_path = storage_path
        self.cards: Dict[str, CandidateCard] = {}
    
    def create_card(self, card: CandidateCard) -> None:
        """Create new candidate card"""
        self.cards[card.node_id] = card
        # TODO: Publish to Commons if user opts in
    
    def get_card(self, node_id: str) -> Optional[CandidateCard]:
        """Retrieve card by ID"""
        return self.cards.get(node_id)
    
    def search_cards(self, lens_tags: List[str], interaction_style: Optional[str] = None,
                    max_results: int = 50) -> List[CandidateCard]:
        """
        Search cards by criteria (local cache).
        
        In production, this queries Commons API.
        """
        results = []
        
        for card in self.cards.values():
            # Filter by lens tags (intersection)
            if lens_tags:
                tag_overlap = len(set(card.lens_tags) & set(lens_tags))
                if tag_overlap == 0:
                    continue
            
            # Filter by interaction style
            if interaction_style and card.interaction_style != interaction_style:
                continue
            
            results.append(card)
        
        return results[:max_results]
    
    def add_asymmetry_report(self, node_id: str, report: AsymmetryReport) -> None:
        """Add/update asymmetry metrics"""
        if node_id in self.cards:
            self.cards[node_id].asymmetry_report = report
            self.cards[node_id].last_updated = datetime.utcnow()
