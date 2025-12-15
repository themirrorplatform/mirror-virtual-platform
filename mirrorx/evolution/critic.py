"""
MirrorX Self-Critic - Self-Monitoring Agent

Evaluates every reflection output for constitutional violations,
advice leakage, tone drift, and pattern misses.

Has authority to veto outputs and force regeneration.
"""

import re
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import Counter


class MirrorXCritic:
    """
    Self-monitoring agent that evaluates MirrorX behavior.
    
    Runs after every reflection to check for:
    - Constitutional violations
    - Advice leakage
    - Tone drift
    - Pattern misses
    
    Has veto authority: can block outputs and force regeneration.
    """
    
    def __init__(self, storage):
        self.storage = storage
        self.violation_log = []
        self.veto_threshold = 0.6  # Below this, regeneration is forced
    
    def critique_reflection(
        self,
        reflection_id: str,
        mirrorback: str,
        user_feedback: Optional[Dict] = None
    ) -> Dict:
        """
        Evaluate single reflection for issues.
        
        Returns critique with:
        - Violations detected
        - Severity
        - Recommendations
        - Veto decision (block/allow)
        """
        
        critique = {
            'reflection_id': reflection_id,
            'violations': [],
            'warnings': [],
            'score': 1.0,
            'recommendations': [],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Check constitutional compliance
        const_check = self._check_constitutional(mirrorback)
        if const_check['violations']:
            critique['violations'].extend(const_check['violations'])
            critique['score'] -= 0.2
        
        # Check for advice leakage (CRITICAL)
        advice_check = self._check_advice_leakage(mirrorback)
        if advice_check['detected']:
            critique['violations'].append({
                'type': 'advice_leakage',
                'severity': advice_check['severity'],
                'evidence': advice_check['examples'],
                'count': advice_check['count']
            })
            
            # Severe penalty for advice
            if advice_check['severity'] == 'high':
                critique['score'] -= 0.4
            elif advice_check['severity'] == 'medium':
                critique['score'] -= 0.3
            else:
                critique['score'] -= 0.15
        
        # Check tone appropriateness
        tone_check = self._check_tone(mirrorback)
        if tone_check['issues']:
            critique['warnings'].extend(tone_check['issues'])
            critique['score'] -= 0.1 * len(tone_check['issues'])
        
        # Check for optimization language
        optimization_check = self._check_optimization_language(mirrorback)
        if optimization_check['detected']:
            critique['violations'].append({
                'type': 'optimization_language',
                'severity': 'high',
                'evidence': optimization_check['examples']
            })
            critique['score'] -= 0.3
        
        # Incorporate user feedback if available
        if user_feedback:
            if user_feedback.get('rating', 5) <= 2:
                critique['score'] -= 0.2
                critique['warnings'].append({
                    'type': 'low_user_rating',
                    'severity': 'medium',
                    'rating': user_feedback['rating']
                })
            
            if 'over_advice' in user_feedback.get('flags', []):
                critique['violations'].append({
                    'type': 'user_reported_advice',
                    'severity': 'high',
                    'source': 'user_feedback'
                })
                critique['score'] -= 0.3
            
            if 'made_me_feel_worse' in user_feedback.get('flags', []):
                critique['violations'].append({
                    'type': 'harmful_impact',
                    'severity': 'critical',
                    'source': 'user_feedback'
                })
                critique['score'] -= 0.4
        
        # Ensure score doesn't go negative
        critique['score'] = max(0.0, critique['score'])
        
        # Generate recommendations if needed
        if critique['violations']:
            critique['recommendations'] = self._generate_corrections(critique['violations'])
        
        # VETO DECISION
        critique['veto'] = critique['score'] < self.veto_threshold
        if critique['veto']:
            critique['veto_reason'] = 'Score below safety threshold - regeneration required'
        
        # Log for pattern analysis
        self._log_critique(critique)
        
        return critique
    
    def critique_and_enforce(
        self,
        reflection_id: str,
        mirrorback: str,
        generator,
        user_feedback: Optional[Dict] = None
    ) -> Dict:
        """
        Critique with enforcement authority.
        
        If critical failure, regenerate with constraints.
        
        Returns:
        {
            'allowed': True/False,
            'regenerated': True/False,
            'critique': {...},
            'mirrorback': '...',
            'rejected_versions': [...]
        }
        """
        
        # Run critique
        critique = self.critique_reflection(reflection_id, mirrorback, user_feedback)
        
        # Critical failure threshold - FORCE REGENERATION
        if critique['veto']:
            return self._regenerate_with_constraints(
                reflection_id,
                mirrorback,
                critique,
                generator
            )
        
        # Non-critical: allow but log
        return {
            'allowed': True,
            'regenerated': False,
            'critique': critique,
            'mirrorback': mirrorback,
            'rejected_versions': []
        }
    
    def _regenerate_with_constraints(
        self,
        reflection_id: str,
        failed_mirrorback: str,
        critique: Dict,
        generator
    ) -> Dict:
        """
        Force regeneration with stricter constraints.
        
        This is the Critic exercising veto authority.
        """
        
        # Extract violations
        violations = critique['violations']
        
        # Build constraint prompt
        constraints = self._build_constraint_prompt(violations)
        
        # Regenerate (assuming generator has this method)
        try:
            new_mirrorback = generator.regenerate_with_constraints(
                reflection_id=reflection_id,
                additional_constraints=constraints,
                previous_attempt=failed_mirrorback,
                critique=critique
            )
        except AttributeError:
            # Generator doesn't support regeneration yet
            # Fall back to minimal safe response
            return {
                'allowed': True,
                'regenerated': True,
                'fallback': True,
                'critique': critique,
                'mirrorback': self._generate_minimal_safe_response(),
                'rejected_versions': [failed_mirrorback]
            }
        
        # Re-critique the new version
        new_critique = self.critique_reflection(reflection_id, new_mirrorback)
        
        if new_critique['score'] >= self.veto_threshold:
            # Success
            return {
                'allowed': True,
                'regenerated': True,
                'critique': new_critique,
                'mirrorback': new_mirrorback,
                'rejected_versions': [failed_mirrorback]
            }
        else:
            # Still failing - fallback to minimal safe response
            return {
                'allowed': True,
                'regenerated': True,
                'fallback': True,
                'critique': new_critique,
                'mirrorback': self._generate_minimal_safe_response(),
                'rejected_versions': [failed_mirrorback, new_mirrorback]
            }
    
    def _check_advice_leakage(self, text: str) -> Dict:
        """Detect advice-giving patterns"""
        
        # Directive phrases (weighted by severity)
        high_severity_patterns = [
            r'\byou should\b',
            r'\byou need to\b',
            r'\byou must\b',
            r'\byou have to\b',
        ]
        
        medium_severity_patterns = [
            r'\bi recommend\b',
            r'\bi suggest you\b',
            r'\btry to\b',
            r'\bmake sure to\b',
            r'\bbe sure to\b',
        ]
        
        low_severity_patterns = [
            r'\byou could\b',
            r'\byou might want to\b',
            r'\bconsider\b.*\byou\b',
        ]
        
        detected = []
        text_lower = text.lower()
        
        # Check high severity
        for pattern in high_severity_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            detected.extend(matches)
        
        high_count = len(detected)
        
        # Check medium severity
        for pattern in medium_severity_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            detected.extend(matches)
        
        medium_count = len(detected) - high_count
        
        # Check low severity
        for pattern in low_severity_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            detected.extend(matches)
        
        low_count = len(detected) - high_count - medium_count
        
        # Determine severity
        severity = 'low'
        if high_count > 0:
            severity = 'high'
        elif medium_count > 2:
            severity = 'high'
        elif medium_count > 0 or low_count > 3:
            severity = 'medium'
        elif low_count > 0:
            severity = 'low'
        
        return {
            'detected': len(detected) > 0,
            'count': len(detected),
            'severity': severity,
            'examples': detected[:3]  # First 3 examples
        }
    
    def _check_constitutional(self, text: str) -> Dict:
        """Check for constitutional violations"""
        
        violations = []
        text_lower = text.lower()
        
        # Check for persuasion language
        persuasion_indicators = ['persuade', 'convince', 'change your mind']
        if any(indicator in text_lower for indicator in persuasion_indicators):
            violations.append({
                'type': 'persuasion_language',
                'severity': 'high'
            })
        
        # Check for diagnostic language
        diagnostic_indicators = ['diagnose', 'you have', 'you are suffering from']
        if any(indicator in text_lower for indicator in diagnostic_indicators):
            violations.append({
                'type': 'diagnostic_language',
                'severity': 'critical'
            })
        
        return {
            'violations': violations
        }
    
    def _check_tone(self, text: str) -> Dict:
        """Check tone appropriateness"""
        
        issues = []
        text_lower = text.lower()
        
        # Check for overly clinical tone
        clinical_markers = ['analyze', 'assess', 'evaluate', 'determine']
        clinical_count = sum(1 for marker in clinical_markers if marker in text_lower)
        if clinical_count > 3:
            issues.append({
                'type': 'overly_clinical',
                'severity': 'low',
                'count': clinical_count
            })
        
        # Check for motivational language
        motivational_markers = ['you can do it', 'believe in yourself', 'stay strong']
        if any(marker in text_lower for marker in motivational_markers):
            issues.append({
                'type': 'motivational_language',
                'severity': 'medium'
            })
        
        return {
            'issues': issues
        }
    
    def _check_optimization_language(self, text: str) -> Dict:
        """Check for optimization/productivity framing"""
        
        text_lower = text.lower()
        
        optimization_indicators = [
            'optimize', 'maximize', 'productivity', 'efficiency',
            'performance', 'achieve', 'goals', 'targets'
        ]
        
        detected = [ind for ind in optimization_indicators if ind in text_lower]
        
        return {
            'detected': len(detected) > 0,
            'examples': detected
        }
    
    def _generate_minimal_safe_response(self) -> str:
        """
        Minimal response when all generation fails critique.
        
        This is the "do no harm" fallback.
        """
        
        return (
            "I'm noticing I'm having difficulty reflecting clearly "
            "right now. Let me pause and try again, or we can "
            "continue this reflection another time."
        )
    
    def _build_constraint_prompt(self, violations: List[Dict]) -> str:
        """Build additional constraints for regeneration"""
        
        constraints = ["CRITICAL CONSTRAINTS:"]
        
        for violation in violations:
            vtype = violation['type']
            
            if vtype == 'advice_leakage':
                constraints.append("- Do NOT use phrases like 'you should', 'you need to', 'try to'")
                constraints.append("- Only observe and reflect, never prescribe")
            
            elif vtype == 'optimization_language':
                constraints.append("- Avoid optimization, productivity, or achievement framing")
                constraints.append("- Focus on presence, not performance")
            
            elif vtype == 'persuasion_language':
                constraints.append("- Do NOT try to persuade or convince")
                constraints.append("- Simply reflect what is present")
        
        return "\n".join(constraints)
    
    def _generate_corrections(self, violations: List[Dict]) -> List[str]:
        """Generate correction recommendations"""
        
        recommendations = []
        
        for violation in violations:
            vtype = violation['type']
            
            if vtype == 'advice_leakage':
                recommendations.append("Remove all prescriptive language")
                recommendations.append("Reframe as observations rather than directions")
            
            elif vtype == 'optimization_language':
                recommendations.append("Remove productivity/achievement framing")
                recommendations.append("Focus on what's present rather than what should be achieved")
            
            elif vtype == 'harmful_impact':
                recommendations.append("Soften tone significantly")
                recommendations.append("Add more gentle exploratory language")
        
        return recommendations
    
    def _log_critique(self, critique: Dict):
        """Log critique for pattern analysis"""
        self.violation_log.append(critique)
        
        # Keep only last 1000 critiques in memory
        if len(self.violation_log) > 1000:
            self.violation_log = self.violation_log[-1000:]
    
    def get_critic_status(self) -> Dict:
        """Get current critic monitoring status"""
        
        recent_violations = self._get_recent_violations(days=7)
        
        return {
            'monitoring': 'active',
            'last_violation': recent_violations[0] if recent_violations else None,
            'common_violation_type': self._most_common_violation_type(),
            'correction_confidence': self._calculate_confidence(),
            'total_critiques': len(self.violation_log),
            'veto_rate': self._calculate_veto_rate()
        }
    
    def _get_recent_violations(self, days: int = 7) -> List[Dict]:
        """Get violations from last N days"""
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        recent = []
        for critique in reversed(self.violation_log):
            if critique.get('violations'):
                try:
                    timestamp = datetime.fromisoformat(critique['timestamp'])
                    if timestamp >= cutoff:
                        recent.append(critique)
                except:
                    continue
        
        return recent
    
    def _most_common_violation_type(self) -> str:
        """Identify most common violation pattern"""
        
        if not self.violation_log:
            return 'none'
        
        violation_types = []
        for critique in self.violation_log:
            for v in critique.get('violations', []):
                violation_types.append(v['type'])
        
        if not violation_types:
            return 'none'
        
        most_common = Counter(violation_types).most_common(1)[0]
        return most_common[0]
    
    def _calculate_confidence(self) -> float:
        """Calculate critic's confidence in corrections"""
        
        if len(self.violation_log) < 10:
            return 0.5  # Not enough data
        
        # Simple heuristic: fewer recent violations = higher confidence
        recent = self._get_recent_violations(days=7)
        total_recent = len([c for c in self.violation_log[-100:] if c])
        
        if total_recent == 0:
            return 0.9
        
        violation_rate = len(recent) / total_recent
        confidence = 1.0 - violation_rate
        
        return max(0.1, min(0.95, confidence))
    
    def _calculate_veto_rate(self) -> float:
        """Calculate percentage of outputs vetoed"""
        
        if not self.violation_log:
            return 0.0
        
        vetoed = sum(1 for c in self.violation_log if c.get('veto', False))
        return vetoed / len(self.violation_log)
