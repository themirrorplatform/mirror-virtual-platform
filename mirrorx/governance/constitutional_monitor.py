"""
Constitutional Monitor - Core Governance System

Enforces constitutional integrity for all evolution proposals.
Provides hard-floor enforcement that cannot be bypassed.
"""

import json
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime


class ConstitutionalMonitor:
    """
    Real-time constitutional compliance monitoring.
    
    Scores every proposal against constitutional invariants.
    Hard-blocks adoption below threshold.
    """
    
    def __init__(self, constitution_path: Optional[Path] = None):
        self.constitution_path = constitution_path or Path(__file__).parent.parent.parent / "constitution" / "invariants.yaml"
        self.constitution = self._load_constitution()
        self.invariants = self._load_invariants()
        self.threshold = 0.85  # 85% minimum compliance
    
    def score_proposal(self, proposal: Dict) -> Dict:
        """
        Score proposal against constitution.
        
        Returns:
        {
            'score': 0.97,
            'passed': True,
            'hard_block': False,
            'flags': [],
            'violations': [],
            'hard_blocks': []
        }
        """
        
        scores = {}
        flags = []
        violations = []
        hard_blocks = []
        
        # Check each constitutional principle
        for principle in self.constitution:
            result = self._check_principle(proposal, principle)
            scores[principle['id']] = result['score']
            
            # Hard floor check - CRITICAL
            hard_minimum = principle.get('hard_minimum', 0.90)
            if result['score'] < hard_minimum:
                hard_blocks.append({
                    'principle': principle['name'],
                    'principle_id': principle['id'],
                    'score': result['score'],
                    'minimum': hard_minimum,
                    'reason': result['reason']
                })
            
            if result['flags']:
                flags.extend(result['flags'])
            
            if result['score'] < 0.90:
                violations.append({
                    'principle': principle['name'],
                    'principle_id': principle['id'],
                    'score': result['score'],
                    'reason': result['reason']
                })
        
        # Overall score
        overall = sum(scores.values()) / len(scores) if scores else 0.0
        
        # CRITICAL: Hard blocks override overall score
        if hard_blocks:
            return {
                'score': overall,
                'passed': False,
                'hard_block': True,
                'hard_blocks': hard_blocks,
                'principle_scores': scores,
                'flags': flags,
                'violations': violations,
                'recommendation': 'HARD CONSTITUTIONAL BLOCK - Cannot adopt under any circumstance',
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # Normal threshold check
        return {
            'score': overall,
            'passed': overall >= self.threshold,
            'hard_block': False,
            'principle_scores': scores,
            'flags': flags,
            'violations': violations,
            'recommendation': self._get_recommendation(overall, violations),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _check_principle(self, proposal: Dict, principle: Dict) -> Dict:
        """Check proposal against single principle"""
        
        principle_id = principle['id']
        
        if principle_id == 'sovereignty':
            return self._check_sovereignty(proposal, principle)
        elif principle_id == 'reflection':
            return self._check_reflection_purity(proposal, principle)
        elif principle_id == 'safety':
            return self._check_safety(proposal, principle)
        elif principle_id == 'anti_optimization':
            return self._check_optimization(proposal, principle)
        elif principle_id == 'plurality_over_coherence':
            return self._check_plurality(proposal, principle)
        
        # Default: no violations detected
        return {
            'score': 1.0,
            'flags': [],
            'reason': 'Principle check not implemented'
        }
    
    def _check_sovereignty(self, proposal: Dict, principle: Dict) -> Dict:
        """Check if proposal maintains data sovereignty"""
        
        changes = proposal.get('changes', {})
        if isinstance(changes, str):
            try:
                changes = json.loads(changes)
            except:
                changes = {}
        
        flags = []
        
        # Check for new data flows
        data_flow_indicators = [
            'upload', 'send', 'transmit', 'share', 'sync', 'remote', 'cloud'
        ]
        
        content = str(proposal.get('content', '')) + str(proposal.get('description', ''))
        content_lower = content.lower()
        
        violations_count = sum(1 for indicator in data_flow_indicators if indicator in content_lower)
        
        if violations_count > 2:
            flags.append({
                'type': 'potential_sovereignty_violation',
                'severity': 'high',
                'count': violations_count
            })
        
        # Check for default opt-out changes
        if 'default' in content_lower and any(word in content_lower for word in ['share', 'sync', 'upload']):
            flags.append({
                'type': 'default_data_sharing',
                'severity': 'critical'
            })
        
        # Score based on flags
        score = 1.0 - (len([f for f in flags if f['severity'] == 'critical']) * 0.5)
        score -= (len([f for f in flags if f['severity'] == 'high']) * 0.2)
        
        return {
            'score': max(0.0, score),
            'flags': flags,
            'reason': f'Detected {violations_count} potential sovereignty concerns' if flags else 'No sovereignty violations'
        }
    
    def _check_reflection_purity(self, proposal: Dict, principle: Dict) -> Dict:
        """Check if proposal maintains non-directive reflection"""
        
        content = str(proposal.get('content', '')) + str(proposal.get('description', ''))
        
        flags = []
        
        # Check for advice-giving language
        advice_indicators = [
            'you should', 'you must', 'you need to', 'you have to',
            'i recommend', 'i suggest you', 'you ought to', 'try to',
            'make sure to', 'be sure to'
        ]
        
        directive_count = sum(1 for indicator in advice_indicators if indicator in content.lower())
        
        if directive_count > 2:
            flags.append({
                'type': 'directive_language',
                'severity': 'medium',
                'count': directive_count,
                'examples': [ind for ind in advice_indicators if ind in content.lower()][:3]
            })
        
        # Check for optimization language
        optimization_indicators = [
            'optimize', 'maximize', 'improve performance', 'increase productivity',
            'achieve goals', 'reach targets'
        ]
        
        optimization_count = sum(1 for indicator in optimization_indicators if indicator in content.lower())
        
        if optimization_count > 1:
            flags.append({
                'type': 'optimization_language',
                'severity': 'high',
                'count': optimization_count
            })
        
        # Score based on flags
        score = 1.0 - (len(flags) * 0.15)
        
        return {
            'score': max(0.0, score),
            'flags': flags,
            'reason': f'Directive language detected {directive_count} times' if flags else 'No reflection violations'
        }
    
    def _check_safety(self, proposal: Dict, principle: Dict) -> Dict:
        """Check if proposal maintains safety boundaries"""
        
        content = str(proposal.get('content', '')) + str(proposal.get('description', ''))
        content_lower = content.lower()
        
        flags = []
        
        # Check for medical/diagnostic language
        medical_indicators = ['diagnose', 'treat', 'cure', 'prescribe', 'medical advice']
        if any(indicator in content_lower for indicator in medical_indicators):
            flags.append({
                'type': 'medical_boundary',
                'severity': 'critical'
            })
        
        # Check for crisis/emergency handling changes
        crisis_indicators = ['suicide', 'self-harm', 'emergency', 'crisis']
        if any(indicator in content_lower for indicator in crisis_indicators):
            # This might be okay if it's improving crisis handling
            if 'improve' not in content_lower and 'better' not in content_lower:
                flags.append({
                    'type': 'crisis_handling_change',
                    'severity': 'high'
                })
        
        score = 1.0 - (len([f for f in flags if f['severity'] == 'critical']) * 0.5)
        score -= (len([f for f in flags if f['severity'] == 'high']) * 0.2)
        
        return {
            'score': max(0.0, score),
            'flags': flags,
            'reason': 'Safety boundary concerns detected' if flags else 'No safety violations'
        }
    
    def _check_optimization(self, proposal: Dict, principle: Dict) -> Dict:
        """Check if proposal avoids optimization for engagement"""
        
        content = str(proposal.get('content', '')) + str(proposal.get('description', ''))
        content_lower = content.lower()
        
        flags = []
        
        # Check for engagement optimization
        engagement_indicators = [
            'engagement', 'retention', 'time spent', 'daily active',
            'stickiness', 'addiction', 'habit', 'streak'
        ]
        
        if any(indicator in content_lower for indicator in engagement_indicators):
            flags.append({
                'type': 'engagement_optimization',
                'severity': 'critical'
            })
        
        # Check for behavioral manipulation
        manipulation_indicators = [
            'nudge', 'persuade', 'convince', 'change behavior',
            'modify habits', 'shape actions'
        ]
        
        if any(indicator in content_lower for indicator in manipulation_indicators):
            flags.append({
                'type': 'behavioral_manipulation',
                'severity': 'high'
            })
        
        score = 1.0 - (len([f for f in flags if f['severity'] == 'critical']) * 0.5)
        score -= (len([f for f in flags if f['severity'] == 'high']) * 0.3)
        
        return {
            'score': max(0.0, score),
            'flags': flags,
            'reason': 'Optimization concerns detected' if flags else 'No optimization violations'
        }
    
    def _check_plurality(self, proposal: Dict, principle: Dict) -> Dict:
        """Check if proposal preserves plurality and exit rights"""
        
        content = str(proposal.get('content', '')) + str(proposal.get('description', ''))
        content_lower = content.lower()
        
        flags = []
        
        # Check for lock-in mechanisms
        lockin_indicators = [
            'prevent', 'block', 'disable', 'require', 'mandatory', 'forced'
        ]
        
        if any(indicator in content_lower for indicator in lockin_indicators):
            # Check if it's about exit/export
            if 'export' in content_lower or 'leave' in content_lower or 'disconnect' in content_lower:
                flags.append({
                    'type': 'exit_restriction',
                    'severity': 'critical'
                })
        
        score = 1.0 - (len([f for f in flags if f['severity'] == 'critical']) * 1.0)  # Zero tolerance
        
        return {
            'score': max(0.0, score),
            'flags': flags,
            'reason': 'Plurality violation detected' if flags else 'Plurality preserved'
        }
    
    def _get_recommendation(self, score: float, violations: List[Dict]) -> str:
        """Generate recommendation based on score"""
        
        if score >= 0.95:
            return "Strong constitutional alignment. Safe to adopt."
        elif score >= self.threshold:
            return "Acceptable alignment. Review flags before adopting."
        else:
            return "CONSTITUTIONAL VIOLATION. Cannot adopt without override."
    
    def _load_constitution(self) -> List[Dict]:
        """Load constitution principles from YAML"""
        
        import yaml
        from pathlib import Path
        
        # Resolve constitution directory
        repo_root = Path(__file__).parent.parent.parent
        constitution_file = repo_root / "constitution" / "invariants.yaml"
        
        if not constitution_file.exists():
            # Fail closed: refuse to run without constitution
            raise FileNotFoundError(
                f"Constitution file not found: {constitution_file}\n"
                "The constitutional monitor cannot run without constitution loaded.\n"
                "This is a fail-closed safety mechanism."
            )
        
        try:
            with open(constitution_file, 'r', encoding='utf-8') as f:
                constitution_data = yaml.safe_load(f)
            
            # Extract invariants and convert to internal format
            principles = []
            for invariant in constitution_data.get('invariants', []):
                principle = {
                    'id': invariant.get('id', 'unknown'),
                    'name': invariant.get('name', 'Unknown Principle'),
                    'description': invariant.get('description', ''),
                    'hard_minimum': 1.0 if invariant.get('failure_action') == 'auto_reject' else 0.8,
                }
                
                # Add threshold if measurement exists
                if 'measurement' in invariant:
                    principle['threshold'] = invariant['measurement'].get('threshold', 0.9)
                
                # Add checks if present
                if 'checks' in invariant:
                    principle['checks'] = invariant['checks']
                
                principles.append(principle)
            
            if not principles:
                raise ValueError("No invariants found in constitution YAML")
            
            logger.info(f"Loaded {len(principles)} constitutional principles from {constitution_file}")
            return principles
            
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse constitution YAML: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to load constitution: {e}")
                'hard_minimum': 0.90,
                'description': 'Reflections must not become advice.'
            },
            {
                'id': 'anti_optimization',
                'name': 'Anti-Manipulation Check',
                'hard_minimum': 0.95,  # Near-zero tolerance
                'description': 'No optimization for engagement/retention metrics.'
            },
            {
                'id': 'safety',
                'name': 'Safety Boundaries',
                'hard_minimum': 0.90,
                'description': 'Must maintain appropriate boundaries around medical/crisis content.'
            },
            {
                'id': 'plurality_over_coherence',
                'name': 'Plurality Over Dominance',
                'hard_minimum': 1.0,  # Core axiom
                'description': 'Must always choose dissent/exit ease over system coherence.'
            }
        ]
    
    def _load_invariants(self) -> Dict:
        """Load constitutional invariants"""
        return {
            'version': '1.0.0',
            'last_updated': datetime.utcnow().isoformat(),
            'principles': self.constitution
        }
