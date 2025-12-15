"""
Finder Targets: Abstract descriptions of reflective conditions

Generated from Identity Graph snapshot.
User-editable before search begins.
Never sent to Commons (only used to query).
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
from .identity_graph import IdentityGraph
from .posture import Posture
import json


@dataclass
class FinderTarget:
    """Abstract description of reflective condition to find"""
    id: str
    target_type: str  # "tension_mirror", "pattern_interrupt", "boundary_test", "value_amplifier"
    description: str  # Human-readable
    lens_tags: List[str] = field(default_factory=list)
    interaction_style_preference: Optional[str] = None
    intensity_level: str = "medium"  # "low", "medium", "high"
    created_at: datetime = field(default_factory=datetime.utcnow)
    user_edited: bool = False
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'target_type': self.target_type,
            'description': self.description,
            'lens_tags': self.lens_tags,
            'interaction_style_preference': self.interaction_style_preference,
            'intensity_level': self.intensity_level,
            'user_edited': self.user_edited,
        }


class FinderTargetSynthesizer:
    """
    Generates Finder Targets from Identity Graph snapshot.
    
    Uses template-based generation (deterministic).
    """
    
    # Target templates (from spec)
    TEMPLATES = {
        'tension_mirror': {
            'description': 'Someone navigating the tension between {tension_a} and {tension_b}',
            'lens_tags_strategy': 'tension_tags',
            'interaction_style': 'dialogue',
        },
        'pattern_interrupt': {
            'description': 'Someone who has broken the pattern of {loop_name}',
            'lens_tags_strategy': 'loop_tags',
            'interaction_style': 'witness',
        },
        'boundary_test': {
            'description': 'Someone testing the boundary of {axis_name}',
            'lens_tags_strategy': 'axis_tags',
            'interaction_style': 'debate',
        },
        'value_amplifier': {
            'description': 'Someone who embodies {axis_positive}',
            'lens_tags_strategy': 'axis_positive_tags',
            'interaction_style': 'structured',
        },
    }
    
    def __init__(self, identity_graph: IdentityGraph):
        self.graph = identity_graph
    
    def generate_targets(self, posture: Posture, max_targets: int = 5) -> List[FinderTarget]:
        """
        Generate Finder Targets from current graph snapshot.
        
        Posture influences which templates are used:
        - Overwhelmed: Mostly witness/value_amplifier
        - Grounded: Balanced mix
        - Exploratory: Mostly boundary_test/pattern_interrupt
        """
        snapshot = self.graph.get_snapshot()
        targets = []
        
        # Generate tension mirrors
        if posture in [Posture.GROUNDED, Posture.OPEN, Posture.EXPLORATORY]:
            for tension_data in snapshot['active_tensions'][:3]:
                target = self._generate_tension_mirror(tension_data)
                if target:
                    targets.append(target)
        
        # Generate pattern interrupts
        if posture in [Posture.EXPLORATORY, Posture.OPEN]:
            for loop_data in snapshot['recurring_loops'][:2]:
                target = self._generate_pattern_interrupt(loop_data)
                if target:
                    targets.append(target)
        
        # Generate boundary tests
        if posture in [Posture.EXPLORATORY, Posture.GROUNDED]:
            for axis_data in snapshot['axes'][:2]:
                if axis_data.get('axis_type') == 'boundary':
                    target = self._generate_boundary_test(axis_data)
                    if target:
                        targets.append(target)
        
        # Generate value amplifiers
        if posture in [Posture.OVERWHELMED, Posture.GUARDED, Posture.OPEN]:
            for axis_data in snapshot['axes'][:2]:
                if axis_data.get('axis_type') == 'value':
                    target = self._generate_value_amplifier(axis_data)
                    if target:
                        targets.append(target)
        
        return targets[:max_targets]
    
    def _generate_tension_mirror(self, tension_data: dict) -> Optional[FinderTarget]:
        """Generate target from tension"""
        template = self.TEMPLATES['tension_mirror']
        
        return FinderTarget(
            id=f"target_tension_{tension_data['id']}",
            target_type='tension_mirror',
            description=template['description'].format(
                tension_a=tension_data.get('name', '').split('↔')[0].strip(),
                tension_b=tension_data.get('name', '').split('↔')[1].strip() if '↔' in tension_data.get('name', '') else 'unknown'
            ),
            lens_tags=tension_data.get('lens_tags', []),
            interaction_style_preference=template['interaction_style'],
            intensity_level='high' if tension_data.get('energy', 0) > 0.7 else 'medium'
        )
    
    def _generate_pattern_interrupt(self, loop_data: dict) -> Optional[FinderTarget]:
        """Generate target from recurring loop"""
        template = self.TEMPLATES['pattern_interrupt']
        
        return FinderTarget(
            id=f"target_loop_{loop_data['id']}",
            target_type='pattern_interrupt',
            description=template['description'].format(
                loop_name=loop_data.get('pattern_name', 'recurring pattern')
            ),
            lens_tags=[],  # TODO: Extract from loop nodes
            interaction_style_preference=template['interaction_style'],
            intensity_level='medium'
        )
    
    def _generate_boundary_test(self, axis_data: dict) -> Optional[FinderTarget]:
        """Generate target from identity axis"""
        template = self.TEMPLATES['boundary_test']
        
        return FinderTarget(
            id=f"target_axis_boundary_{axis_data['id']}",
            target_type='boundary_test',
            description=template['description'].format(
                axis_name=axis_data.get('axis_type', 'boundary')
            ),
            lens_tags=[],
            interaction_style_preference=template['interaction_style'],
            intensity_level='high'
        )
    
    def _generate_value_amplifier(self, axis_data: dict) -> Optional[FinderTarget]:
        """Generate target from value axis"""
        template = self.TEMPLATES['value_amplifier']
        
        return FinderTarget(
            id=f"target_axis_value_{axis_data['id']}",
            target_type='value_amplifier',
            description=template['description'].format(
                axis_positive=axis_data.get('axis_type', 'value')
            ),
            lens_tags=[],
            interaction_style_preference=template['interaction_style'],
            intensity_level='low'
        )
