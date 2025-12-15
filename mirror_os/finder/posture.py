"""
Posture System: User's current reflective state

Two-layer: Declared (canonical) + Suggested (advisory)
No hidden posture state. User correction is final.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict
from datetime import datetime
import json
from pathlib import Path


class Posture(Enum):
    """Finite set of reflective postures"""
    UNKNOWN = "unknown"
    OVERWHELMED = "overwhelmed"
    GUARDED = "guarded"
    GROUNDED = "grounded"
    OPEN = "open"
    EXPLORATORY = "exploratory"


class InteractionStyle(Enum):
    """How candidate wants to interact"""
    WITNESS = "witness"  # Silent listening/observation
    DIALOGUE = "dialogue"  # Mutual exchange
    DEBATE = "debate"  # Challenge/contrast
    STRUCTURED = "structured"  # Guided/facilitated


# PostureFit compatibility matrix (from spec)
POSTURE_FIT_MATRIX: Dict[Posture, Dict[InteractionStyle, float]] = {
    Posture.OVERWHELMED: {
        InteractionStyle.WITNESS: 1.00,
        InteractionStyle.DIALOGUE: 0.60,
        InteractionStyle.DEBATE: 0.10,
        InteractionStyle.STRUCTURED: 0.80,
    },
    Posture.GUARDED: {
        InteractionStyle.WITNESS: 0.90,
        InteractionStyle.DIALOGUE: 0.50,
        InteractionStyle.DEBATE: 0.20,
        InteractionStyle.STRUCTURED: 0.70,
    },
    Posture.GROUNDED: {
        InteractionStyle.WITNESS: 0.70,
        InteractionStyle.DIALOGUE: 0.90,
        InteractionStyle.DEBATE: 0.60,
        InteractionStyle.STRUCTURED: 0.80,
    },
    Posture.OPEN: {
        InteractionStyle.WITNESS: 0.50,
        InteractionStyle.DIALOGUE: 1.00,
        InteractionStyle.DEBATE: 0.80,
        InteractionStyle.STRUCTURED: 0.70,
    },
    Posture.EXPLORATORY: {
        InteractionStyle.WITNESS: 0.30,
        InteractionStyle.DIALOGUE: 0.80,
        InteractionStyle.DEBATE: 1.00,
        InteractionStyle.STRUCTURED: 0.60,
    },
    Posture.UNKNOWN: {
        InteractionStyle.WITNESS: 0.70,
        InteractionStyle.DIALOGUE: 0.70,
        InteractionStyle.DEBATE: 0.40,
        InteractionStyle.STRUCTURED: 0.70,
    },
}


# Adjacency target distance + tolerance (from spec)
ADJACENCY_PARAMS: Dict[Posture, tuple] = {
    Posture.OVERWHELMED: (0.25, 0.10),  # (μ, σ)
    Posture.GUARDED: (0.30, 0.10),
    Posture.GROUNDED: (0.45, 0.15),
    Posture.OPEN: (0.55, 0.18),
    Posture.EXPLORATORY: (0.65, 0.20),
    Posture.UNKNOWN: (0.45, 0.20),
}


@dataclass
class PostureState:
    """Current posture state"""
    declared: Posture  # User set (canonical)
    suggested: Optional[Posture]  # System suggestion (advisory)
    declared_at: datetime
    suggested_at: Optional[datetime]
    divergence_count: int = 0  # How many sessions they've differed
    last_divergence_prompt: Optional[datetime] = None


class PostureManager:
    """
    Manages user posture state.
    
    Invariant: Declared posture is canonical. Suggestion never overrides.
    Divergence prompts are optional, dismissible, never repeated.
    """
    
    DIVERGENCE_THRESHOLD_SESSIONS = 14  # Days before optional prompt
    
    def __init__(self, user_id: str, storage_path: Path):
        self.user_id = user_id
        self.storage_path = storage_path
        self.state: PostureState = PostureState(
            declared=Posture.UNKNOWN,
            suggested=None,
            declared_at=datetime.utcnow(),
            suggested_at=None
        )
        self._load()
    
    def set_declared(self, posture: Posture) -> None:
        """User explicitly sets posture (canonical)"""
        self.state.declared = posture
        self.state.declared_at = datetime.utcnow()
        
        # Reset divergence if they explicitly set
        if self.state.suggested and self.state.suggested != posture:
            self.state.divergence_count = 0
        
        self._save()
    
    def set_suggested(self, posture: Posture) -> None:
        """System suggests posture (advisory only)"""
        self.state.suggested = posture
        self.state.suggested_at = datetime.utcnow()
        
        # Track divergence
        if self.state.declared != posture:
            self.state.divergence_count += 1
        else:
            self.state.divergence_count = 0
        
        self._save()
    
    def get_canonical(self) -> Posture:
        """Get posture used for routing (always declared)"""
        return self.state.declared
    
    def should_prompt_divergence(self) -> bool:
        """
        Check if system should offer optional divergence review.
        
        Only if:
        - Divergence >= threshold sessions
        - Haven't prompted recently
        """
        if self.state.divergence_count < self.DIVERGENCE_THRESHOLD_SESSIONS:
            return False
        
        if self.state.last_divergence_prompt:
            days_since_prompt = (datetime.utcnow() - self.state.last_divergence_prompt).days
            if days_since_prompt < 30:  # Don't nag more than monthly
                return False
        
        return True
    
    def mark_divergence_prompted(self) -> None:
        """Record that we showed the divergence prompt"""
        self.state.last_divergence_prompt = datetime.utcnow()
        self._save()
    
    def get_posture_fit(self, interaction_style: InteractionStyle, 
                       requested_style: Optional[InteractionStyle] = None) -> float:
        """
        Calculate PostureFit score.
        
        If user explicitly requested a style, apply boost.
        """
        posture = self.get_canonical()
        base_fit = POSTURE_FIT_MATRIX[posture][interaction_style]
        
        # Override boost (from spec)
        if requested_style and requested_style == interaction_style:
            return min(1.0, base_fit + 0.20)
        
        return base_fit
    
    def get_adjacency_params(self) -> tuple:
        """Get (μ, σ) for current posture"""
        return ADJACENCY_PARAMS[self.get_canonical()]
    
    def _load(self):
        """Load posture state from storage"""
        state_file = self.storage_path / f"posture_{self.user_id}.json"
        if state_file.exists():
            with open(state_file, 'r') as f:
                data = json.load(f)
                self.state = PostureState(
                    declared=Posture(data['declared']),
                    suggested=Posture(data['suggested']) if data.get('suggested') else None,
                    declared_at=datetime.fromisoformat(data['declared_at']),
                    suggested_at=datetime.fromisoformat(data['suggested_at']) if data.get('suggested_at') else None,
                    divergence_count=data.get('divergence_count', 0),
                    last_divergence_prompt=datetime.fromisoformat(data['last_divergence_prompt']) if data.get('last_divergence_prompt') else None
                )
    
    def _save(self):
        """Save posture state to storage"""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        state_file = self.storage_path / f"posture_{self.user_id}.json"
        
        data = {
            'user_id': self.user_id,
            'declared': self.state.declared.value,
            'suggested': self.state.suggested.value if self.state.suggested else None,
            'declared_at': self.state.declared_at.isoformat(),
            'suggested_at': self.state.suggested_at.isoformat() if self.state.suggested_at else None,
            'divergence_count': self.state.divergence_count,
            'last_divergence_prompt': self.state.last_divergence_prompt.isoformat() if self.state.last_divergence_prompt else None,
        }
        
        with open(state_file, 'w') as f:
            json.dump(data, f, indent=2)
