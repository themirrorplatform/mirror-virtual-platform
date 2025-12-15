"""
Evolution Conflict Resolver

Manages conflicts when multiple evolution proposals compete:
- Local vs Commons
- Commons vs Commons
- Version conflicts

CORE PRINCIPLE: Local always takes precedence over Commons.
User must be presented with ALL conflicts - no silent adoption.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum


class ConflictType(Enum):
    LOCAL_VS_COMMONS = "local_vs_commons"
    COMMONS_VS_COMMONS = "commons_vs_commons"
    VERSION_CONFLICT = "version_conflict"
    PARAMETER_CONFLICT = "parameter_conflict"


class ResolutionStrategy(Enum):
    LOCAL_PRECEDENCE = "local_precedence"  # Always prefer local
    FREEZE_AND_PRESENT = "freeze_and_present"  # Stop, show user
    LATEST_VERSION = "latest_version"  # Timestamp wins
    USER_DECISION = "user_decision"  # Explicit user choice required


class ConflictResolver:
    """
    Detects and resolves conflicts between evolution proposals.
    
    MANDATORY: All conflicts MUST be presented to user before adoption.
    No silent resolution of ambiguous cases.
    """
    
    def __init__(self, storage):
        self.storage = storage
        self.conflict_log = []
    
    def check_for_conflicts(
        self,
        proposal: Dict,
        existing_proposals: List[Dict],
        local_state: Dict
    ) -> Dict:
        """
        Check if proposal conflicts with existing proposals or local state.
        
        Returns:
        {
            'has_conflicts': True/False,
            'conflicts': [...],
            'resolution_required': True/False,
            'auto_resolvable': True/False
        }
        """
        
        conflicts = []
        
        # Check against local state first (highest priority)
        local_conflict = self._check_local_conflict(proposal, local_state)
        if local_conflict:
            conflicts.append(local_conflict)
        
        # Check against other proposals
        for existing in existing_proposals:
            conflict = self._check_proposal_conflict(proposal, existing)
            if conflict:
                conflicts.append(conflict)
        
        # Determine if auto-resolvable
        auto_resolvable = all(
            c['resolution_strategy'] == ResolutionStrategy.LOCAL_PRECEDENCE
            for c in conflicts
        )
        
        return {
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts,
            'resolution_required': not auto_resolvable,
            'auto_resolvable': auto_resolvable,
            'total_conflicts': len(conflicts)
        }
    
    def _check_local_conflict(
        self,
        proposal: Dict,
        local_state: Dict
    ) -> Optional[Dict]:
        """
        Check if proposal conflicts with local changes.
        
        Local ALWAYS wins - this returns conflict so user can see it,
        but resolution is automatic.
        """
        
        target = proposal.get('target', {})
        target_type = target.get('type')  # e.g., 'tone', 'mirrorback_style', 'prompt'
        target_path = target.get('path')
        
        # Check if local has modifications to same target
        local_modifications = local_state.get('modifications', {})
        
        if target_type in local_modifications:
            local_value = local_modifications[target_type]
            proposed_value = proposal.get('changes', {}).get('value')
            
            if local_value != proposed_value:
                return {
                    'type': ConflictType.LOCAL_VS_COMMONS,
                    'severity': 'info',  # Not critical, just informational
                    'target': target,
                    'local_value': local_value,
                    'commons_value': proposed_value,
                    'resolution_strategy': ResolutionStrategy.LOCAL_PRECEDENCE,
                    'resolution': 'Local configuration takes precedence',
                    'auto_resolve': True,
                    'user_notification': True  # User should see this happened
                }
        
        return None
    
    def _check_proposal_conflict(
        self,
        proposal_a: Dict,
        proposal_b: Dict
    ) -> Optional[Dict]:
        """
        Check if two proposals conflict.
        
        Conflicts occur when:
        - Same target, different changes
        - Incompatible parameter modifications
        - Version dependencies
        """
        
        target_a = proposal_a.get('target', {})
        target_b = proposal_b.get('target', {})
        
        # Check if targeting same component
        if (target_a.get('type') == target_b.get('type') and
            target_a.get('path') == target_b.get('path')):
            
            changes_a = proposal_a.get('changes', {})
            changes_b = proposal_b.get('changes', {})
            
            # Check if changes are different
            if changes_a.get('value') != changes_b.get('value'):
                
                # Check if both from Commons
                if (proposal_a.get('source') == 'commons' and
                    proposal_b.get('source') == 'commons'):
                    
                    return {
                        'type': ConflictType.COMMONS_VS_COMMONS,
                        'severity': 'medium',
                        'target': target_a,
                        'proposal_a': {
                            'id': proposal_a.get('id'),
                            'value': changes_a.get('value'),
                            'votes': proposal_a.get('votes_for', 0),
                            'timestamp': proposal_a.get('created_at')
                        },
                        'proposal_b': {
                            'id': proposal_b.get('id'),
                            'value': changes_b.get('value'),
                            'votes': proposal_b.get('votes_for', 0),
                            'timestamp': proposal_b.get('created_at')
                        },
                        'resolution_strategy': ResolutionStrategy.FREEZE_AND_PRESENT,
                        'resolution': 'User decision required',
                        'auto_resolve': False,
                        'user_notification': True
                    }
        
        # Check version conflicts
        version_conflict = self._check_version_conflict(proposal_a, proposal_b)
        if version_conflict:
            return version_conflict
        
        return None
    
    def _check_version_conflict(
        self,
        proposal_a: Dict,
        proposal_b: Dict
    ) -> Optional[Dict]:
        """Check if proposals have incompatible version requirements"""
        
        requires_a = proposal_a.get('requires_version')
        requires_b = proposal_b.get('requires_version')
        
        if requires_a and requires_b:
            # Simple version check (could be more sophisticated)
            if requires_a != requires_b:
                return {
                    'type': ConflictType.VERSION_CONFLICT,
                    'severity': 'high',
                    'proposal_a': {
                        'id': proposal_a.get('id'),
                        'requires_version': requires_a
                    },
                    'proposal_b': {
                        'id': proposal_b.get('id'),
                        'requires_version': requires_b
                    },
                    'resolution_strategy': ResolutionStrategy.FREEZE_AND_PRESENT,
                    'resolution': 'Version compatibility check required',
                    'auto_resolve': False,
                    'user_notification': True
                }
        
        return None
    
    def resolve_conflicts(
        self,
        conflicts: List[Dict],
        user_preference: Optional[Dict] = None
    ) -> Dict:
        """
        Resolve detected conflicts.
        
        CRITICAL: User preference is REQUIRED for non-auto-resolvable conflicts.
        This method will NOT silently choose - it returns instructions for presentation.
        """
        
        resolutions = []
        presentation_required = []
        
        for conflict in conflicts:
            strategy = conflict['resolution_strategy']
            
            if strategy == ResolutionStrategy.LOCAL_PRECEDENCE:
                # Auto-resolve: local wins
                resolutions.append({
                    'conflict': conflict,
                    'resolution': 'local_precedence',
                    'action': 'reject_commons_proposal',
                    'notify_user': True,
                    'message': (
                        f"Commons proposal for {conflict['target']} "
                        f"conflicts with your local configuration. "
                        f"Your local settings will be preserved."
                    )
                })
            
            elif strategy == ResolutionStrategy.FREEZE_AND_PRESENT:
                # MANDATORY user presentation
                presentation_required.append({
                    'conflict': conflict,
                    'requires_user_decision': True,
                    'options': self._generate_resolution_options(conflict),
                    'cannot_proceed_without_decision': True
                })
            
            elif strategy == ResolutionStrategy.USER_DECISION:
                # Explicit user choice needed
                if user_preference and conflict.get('id') in user_preference:
                    chosen = user_preference[conflict['id']]
                    resolutions.append({
                        'conflict': conflict,
                        'resolution': 'user_decision',
                        'chosen': chosen,
                        'action': 'apply_chosen_proposal'
                    })
                else:
                    presentation_required.append({
                        'conflict': conflict,
                        'requires_user_decision': True,
                        'options': self._generate_resolution_options(conflict),
                        'cannot_proceed_without_decision': True
                    })
        
        # If ANY conflicts require presentation, BLOCK adoption
        if presentation_required:
            return {
                'can_proceed': False,
                'presentation_required': True,
                'conflicts_to_present': presentation_required,
                'auto_resolutions': resolutions,
                'total_conflicts': len(conflicts),
                'message': (
                    f"{len(presentation_required)} conflict(s) require your decision "
                    f"before any changes can be applied."
                )
            }
        
        # All conflicts auto-resolvable
        return {
            'can_proceed': True,
            'presentation_required': False,
            'resolutions': resolutions,
            'total_conflicts': len(conflicts),
            'message': f"All {len(conflicts)} conflict(s) resolved automatically."
        }
    
    def _generate_resolution_options(self, conflict: Dict) -> List[Dict]:
        """Generate options for user to choose from"""
        
        conflict_type = conflict['type']
        
        if conflict_type == ConflictType.COMMONS_VS_COMMONS:
            proposal_a = conflict['proposal_a']
            proposal_b = conflict['proposal_b']
            
            return [
                {
                    'id': 'choose_a',
                    'label': f"Use proposal A ({proposal_a['votes']} votes)",
                    'value': proposal_a['value'],
                    'metadata': proposal_a
                },
                {
                    'id': 'choose_b',
                    'label': f"Use proposal B ({proposal_b['votes']} votes)",
                    'value': proposal_b['value'],
                    'metadata': proposal_b
                },
                {
                    'id': 'reject_both',
                    'label': "Keep current behavior (reject both)",
                    'value': None,
                    'metadata': {'action': 'no_change'}
                }
            ]
        
        elif conflict_type == ConflictType.LOCAL_VS_COMMONS:
            return [
                {
                    'id': 'keep_local',
                    'label': "Keep my local configuration",
                    'value': conflict['local_value'],
                    'recommended': True
                },
                {
                    'id': 'adopt_commons',
                    'label': "Adopt Commons proposal",
                    'value': conflict['commons_value']
                }
            ]
        
        else:
            return [
                {
                    'id': 'manual_review',
                    'label': "Review conflict details",
                    'value': None
                }
            ]
    
    def freeze_evolution(self, reason: str, conflicts: List[Dict]) -> Dict:
        """
        Freeze all evolution adoption until conflicts resolved.
        
        This is a hard gate - no evolution proceeds.
        """
        
        freeze_record = {
            'frozen': True,
            'frozen_at': datetime.utcnow().isoformat(),
            'reason': reason,
            'conflicts': conflicts,
            'requires_user_action': True,
            'can_unfreeze': False  # Only user action unfreezes
        }
        
        # Store freeze state
        self._store_freeze_state(freeze_record)
        
        return freeze_record
    
    def unfreeze_evolution(
        self,
        resolutions: List[Dict],
        user_confirmed: bool = False
    ) -> Dict:
        """
        Unfreeze evolution after conflicts resolved.
        
        Requires user confirmation.
        """
        
        if not user_confirmed:
            return {
                'success': False,
                'error': 'User confirmation required to unfreeze evolution'
            }
        
        unfreeze_record = {
            'unfrozen': True,
            'unfrozen_at': datetime.utcnow().isoformat(),
            'resolutions_applied': resolutions,
            'user_confirmed': True
        }
        
        # Clear freeze state
        self._clear_freeze_state()
        
        # Log resolutions
        self._log_resolutions(resolutions)
        
        return unfreeze_record
    
    def get_conflict_history(self, days: int = 30) -> List[Dict]:
        """Get history of conflicts for pattern analysis"""
        
        # Would query from storage in real implementation
        return self.conflict_log[-100:]
    
    def _store_freeze_state(self, freeze_record: Dict):
        """Persist freeze state"""
        # In real implementation, would store in database
        # For now, just log
        self.conflict_log.append({
            'type': 'freeze',
            'record': freeze_record,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def _clear_freeze_state(self):
        """Clear freeze state"""
        # In real implementation, would update database
        self.conflict_log.append({
            'type': 'unfreeze',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def _log_resolutions(self, resolutions: List[Dict]):
        """Log conflict resolutions for audit"""
        for resolution in resolutions:
            self.conflict_log.append({
                'type': 'resolution',
                'resolution': resolution,
                'timestamp': datetime.utcnow().isoformat()
            })
    
    def is_frozen(self) -> bool:
        """Check if evolution system is currently frozen"""
        # Check if there's a recent freeze event without an unfreeze
        for event in reversed(self.conflict_log):
            if event['type'] == 'unfreeze':
                return False
            if event['type'] == 'freeze':
                return True
        return False
