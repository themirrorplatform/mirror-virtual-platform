# mirrorx-engine/app/tension_tracker.py
"""
Tension Tracking for MirrorX Engine

Detects paradoxes, calculates intensity, tracks position changes over time.
Tensions are the core of Mirror's approach to self-reflection.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from collections import defaultdict

from mirrorcore.models.base import MirrorLLM


class TensionTracker:
    """
    Tracks and analyzes tensions (paradoxes) in reflections.
    
    A tension exists when someone experiences two seemingly opposing
    forces, needs, or states simultaneously.
    """
    
    # Common tension archetypes (seeded patterns)
    SEED_TENSIONS = [
        {
            'name': 'Control vs Surrender',
            'axis_a': 'Control',
            'axis_b': 'Surrender',
            'keywords': ['control', 'surrender', 'let go', 'manage', 'release']
        },
        {
            'name': 'Certainty vs Openness',
            'axis_a': 'Certainty',
            'axis_b': 'Openness',
            'keywords': ['certain', 'uncertain', 'open', 'clear', 'ambiguous']
        },
        {
            'name': 'Connection vs Solitude',
            'axis_a': 'Connection',
            'axis_b': 'Solitude',
            'keywords': ['alone', 'together', 'connection', 'isolation', 'community']
        },
        {
            'name': 'Action vs Rest',
            'axis_a': 'Action',
            'axis_b': 'Rest',
            'keywords': ['action', 'rest', 'doing', 'being', 'busy', 'stillness']
        },
        {
            'name': 'Structure vs Flow',
            'axis_a': 'Structure',
            'axis_b': 'Flow',
            'keywords': ['structure', 'flow', 'plan', 'spontaneous', 'routine']
        }
    ]
    
    def __init__(self, llm: MirrorLLM):
        """
        Initialize tension tracker.
        
        Args:
            llm: LLM adapter for tension detection
        """
        self.llm = llm
    
    def detect_tensions(
        self,
        reflection: Dict[str, Any],
        known_tensions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect tensions in a single reflection.
        
        Args:
            reflection: Reflection dict with {id, content, created_at}
            known_tensions: Previously identified tensions to look for
            
        Returns:
            List of detected tension dicts
        """
        content = reflection.get('content', '')
        if not content:
            return []
        
        detected = []
        
        # Method 1: Check against seed tensions (keyword-based)
        seed_matches = self._detect_seed_tensions(content)
        detected.extend(seed_matches)
        
        # Method 2: Check against known tensions
        if known_tensions:
            known_matches = self._detect_known_tensions(content, known_tensions)
            detected.extend(known_matches)
        
        # Method 3: Use LLM to detect new tensions
        llm_tensions = self._detect_by_llm(content, known_tensions)
        detected.extend(llm_tensions)
        
        # Deduplicate by tension name
        unique = self._deduplicate_tensions(detected)
        
        # Add reflection context
        for tension in unique:
            tension['reflection_id'] = reflection['id']
            tension['detected_at'] = reflection.get('created_at', datetime.utcnow().isoformat())
        
        return unique
    
    def calculate_position(
        self,
        reflection_content: str,
        tension: Dict[str, Any]
    ) -> float:
        """
        Calculate position on tension axis (-1 to +1).
        
        Args:
            reflection_content: Text to analyze
            tension: Tension dict with axis_a and axis_b
            
        Returns:
            Position from -1 (fully axis_a) to +1 (fully axis_b)
        """
        axis_a = tension['axis_a'].lower()
        axis_b = tension['axis_b'].lower()
        
        # Simple keyword frequency approach
        content_lower = reflection_content.lower()
        
        # Count mentions of each axis
        count_a = content_lower.count(axis_a)
        count_b = content_lower.count(axis_b)
        
        # Check for related words
        if 'keywords_a' in tension:
            for keyword in tension['keywords_a']:
                count_a += content_lower.count(keyword.lower())
        
        if 'keywords_b' in tension:
            for keyword in tension['keywords_b']:
                count_b += content_lower.count(keyword.lower())
        
        # Calculate position
        total = count_a + count_b
        if total == 0:
            return 0.0  # Neutral/balanced
        
        # Map to -1 to +1 range
        position = (count_b - count_a) / total
        
        # Clamp to valid range
        return max(-1.0, min(1.0, position))
    
    def calculate_intensity(
        self,
        reflection_content: str,
        tension: Dict[str, Any]
    ) -> float:
        """
        Calculate tension intensity (0 to 1).
        
        Intensity represents how strongly the tension is felt,
        regardless of position on the axis.
        
        Args:
            reflection_content: Text to analyze
            tension: Tension dict
            
        Returns:
            Intensity from 0 (not present) to 1 (very strong)
        """
        content_lower = reflection_content.lower()
        
        # Check for intensity indicators
        strong_words = [
            'very', 'really', 'deeply', 'strongly', 'intensely',
            'completely', 'totally', 'absolutely', 'extremely'
        ]
        
        conflict_words = [
            'torn', 'stuck', 'between', 'conflict', 'struggle',
            'pull', 'tension', 'paradox', 'both', 'either'
        ]
        
        # Base intensity from keyword presence
        axis_a_present = tension['axis_a'].lower() in content_lower
        axis_b_present = tension['axis_b'].lower() in content_lower
        
        if axis_a_present and axis_b_present:
            base_intensity = 0.7  # Both poles mentioned = high tension
        elif axis_a_present or axis_b_present:
            base_intensity = 0.4  # One pole mentioned = moderate
        else:
            base_intensity = 0.2  # Neither explicitly mentioned = low
        
        # Boost for strong language
        strong_count = sum(1 for word in strong_words if word in content_lower)
        intensity_boost = min(0.2, strong_count * 0.05)
        
        # Boost for conflict language
        conflict_count = sum(1 for word in conflict_words if word in content_lower)
        conflict_boost = min(0.3, conflict_count * 0.1)
        
        total_intensity = min(1.0, base_intensity + intensity_boost + conflict_boost)
        
        return round(total_intensity, 2)
    
    def track_tension_evolution(
        self,
        tension: Dict[str, Any],
        reflections: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Track how a tension evolves across multiple reflections.
        
        Args:
            tension: Tension dict with name and axes
            reflections: List of reflections (chronologically ordered)
            
        Returns:
            Evolution analysis dict
        """
        timeline = []
        
        for reflection in reflections:
            content = reflection.get('content', '')
            
            # Check if tension is present
            if self._is_tension_present(content, tension):
                position = self.calculate_position(content, tension)
                intensity = self.calculate_intensity(content, tension)
                
                timeline.append({
                    'reflection_id': reflection['id'],
                    'timestamp': reflection.get('created_at'),
                    'position': position,
                    'intensity': intensity
                })
        
        if not timeline:
            return {
                'trend': 'absent',
                'average_position': 0.0,
                'average_intensity': 0.0,
                'timeline': []
            }
        
        # Calculate averages
        avg_position = sum(t['position'] for t in timeline) / len(timeline)
        avg_intensity = sum(t['intensity'] for t in timeline) / len(timeline)
        
        # Detect trend
        if len(timeline) >= 3:
            first_third = timeline[:len(timeline)//3]
            last_third = timeline[-len(timeline)//3:]
            
            avg_pos_early = sum(t['position'] for t in first_third) / len(first_third)
            avg_pos_late = sum(t['position'] for t in last_third) / len(last_third)
            
            position_change = avg_pos_late - avg_pos_early
            
            if abs(position_change) < 0.2:
                trend = 'stable'
            elif position_change > 0:
                trend = f'shifting toward {tension["axis_b"]}'
            else:
                trend = f'shifting toward {tension["axis_a"]}'
        else:
            trend = 'insufficient data'
        
        return {
            'trend': trend,
            'average_position': round(avg_position, 2),
            'average_intensity': round(avg_intensity, 2),
            'occurrence_count': len(timeline),
            'timeline': timeline,
            'first_seen': timeline[0]['timestamp'] if timeline else None,
            'last_seen': timeline[-1]['timestamp'] if timeline else None
        }
    
    def suggest_related_tensions(
        self,
        active_tensions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Suggest related tensions based on active ones.
        
        Args:
            active_tensions: Currently tracked tensions
            
        Returns:
            List of suggested tension dicts
        """
        suggestions = []
        
        # Tension relationship map
        relationships = {
            'Control vs Surrender': ['Structure vs Flow', 'Certainty vs Openness'],
            'Certainty vs Openness': ['Control vs Surrender', 'Action vs Rest'],
            'Connection vs Solitude': ['Structure vs Flow', 'Action vs Rest'],
            'Action vs Rest': ['Control vs Surrender', 'Structure vs Flow'],
            'Structure vs Flow': ['Control vs Surrender', 'Action vs Rest']
        }
        
        # Get unique active tension names
        active_names = {t['name'] for t in active_tensions}
        
        # Find related tensions
        for active_name in active_names:
            if active_name in relationships:
                for related_name in relationships[active_name]:
                    if related_name not in active_names:
                        # Find the seed tension
                        for seed in self.SEED_TENSIONS:
                            if seed['name'] == related_name:
                                suggestions.append({
                                    'name': seed['name'],
                                    'axis_a': seed['axis_a'],
                                    'axis_b': seed['axis_b'],
                                    'rationale': f"Related to active tension: {active_name}",
                                    'confidence': 0.6
                                })
                                break
        
        # Deduplicate
        seen = set()
        unique_suggestions = []
        for s in suggestions:
            if s['name'] not in seen:
                seen.add(s['name'])
                unique_suggestions.append(s)
        
        return unique_suggestions[:5]  # Limit to top 5
    
    def _detect_seed_tensions(self, content: str) -> List[Dict[str, Any]]:
        """Detect tensions from seed archetypes using keywords."""
        content_lower = content.lower()
        detected = []
        
        for seed in self.SEED_TENSIONS:
            # Check if any keywords present
            keyword_matches = sum(
                1 for keyword in seed['keywords']
                if keyword in content_lower
            )
            
            if keyword_matches >= 2:  # At least 2 keywords
                position = self.calculate_position(content, seed)
                intensity = self.calculate_intensity(content, seed)
                
                detected.append({
                    'name': seed['name'],
                    'axis_a': seed['axis_a'],
                    'axis_b': seed['axis_b'],
                    'position': position,
                    'intensity': intensity,
                    'origin': 'system_seed',
                    'confidence': 0.7
                })
        
        return detected
    
    def _detect_known_tensions(
        self,
        content: str,
        known_tensions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Check for previously identified tensions."""
        content_lower = content.lower()
        detected = []
        
        for tension in known_tensions:
            axis_a = tension.get('axis_a', '').lower()
            axis_b = tension.get('axis_b', '').lower()
            
            # Check if either axis mentioned
            if axis_a in content_lower or axis_b in content_lower:
                position = self.calculate_position(content, tension)
                intensity = self.calculate_intensity(content, tension)
                
                detected.append({
                    'name': tension['name'],
                    'axis_a': tension['axis_a'],
                    'axis_b': tension['axis_b'],
                    'position': position,
                    'intensity': intensity,
                    'origin': 'user_created',
                    'confidence': 0.8
                })
        
        return detected
    
    def _detect_by_llm(
        self,
        content: str,
        known_tensions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Use LLM to detect new tensions."""
        try:
            llm_tensions = self.llm.detect_tensions(content, known_tensions)
            
            # Ensure all required fields present
            for tension in llm_tensions:
                if 'origin' not in tension:
                    tension['origin'] = 'llm_suggested'
                if 'confidence' not in tension:
                    tension['confidence'] = 0.75
            
            return llm_tensions
        except Exception:
            return []
    
    def _is_tension_present(
        self,
        content: str,
        tension: Dict[str, Any]
    ) -> bool:
        """Check if tension is present in content."""
        content_lower = content.lower()
        axis_a = tension['axis_a'].lower()
        axis_b = tension['axis_b'].lower()
        
        # Check for explicit mention
        if axis_a in content_lower or axis_b in content_lower:
            return True
        
        # Check for keywords if available
        if 'keywords' in tension:
            for keyword in tension['keywords']:
                if keyword.lower() in content_lower:
                    return True
        
        return False
    
    def _deduplicate_tensions(
        self,
        tensions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Remove duplicate tensions, keeping highest confidence."""
        by_name = defaultdict(list)
        
        for tension in tensions:
            by_name[tension['name']].append(tension)
        
        unique = []
        for name, group in by_name.items():
            # Keep the one with highest confidence
            best = max(group, key=lambda t: t.get('confidence', 0))
            unique.append(best)
        
        return unique
    
    def get_tension_report(
        self,
        reflections: List[Dict[str, Any]],
        known_tensions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive tension report across reflections.
        
        Args:
            reflections: All reflections to analyze
            known_tensions: Previously tracked tensions
            
        Returns:
            Report dict with active tensions, trends, suggestions
        """
        all_detected = []
        
        # Detect tensions in each reflection
        for reflection in reflections:
            detected = self.detect_tensions(reflection, known_tensions)
            all_detected.extend(detected)
        
        # Group by tension name
        by_tension = defaultdict(list)
        for detection in all_detected:
            by_tension[detection['name']].append(detection)
        
        # Analyze each tension
        active_tensions = []
        for name, detections in by_tension.items():
            if len(detections) < 2:
                continue  # Need multiple occurrences
            
            # Get base tension info
            base = detections[0]
            
            # Calculate evolution
            tension_refs = [
                r for r in reflections
                if r['id'] in [d['reflection_id'] for d in detections]
            ]
            evolution = self.track_tension_evolution(base, tension_refs)
            
            active_tensions.append({
                'name': name,
                'axis_a': base['axis_a'],
                'axis_b': base['axis_b'],
                'occurrence_count': len(detections),
                'average_position': evolution['average_position'],
                'average_intensity': evolution['average_intensity'],
                'trend': evolution['trend'],
                'first_seen': evolution['first_seen'],
                'last_seen': evolution['last_seen']
            })
        
        # Sort by occurrence count
        active_tensions.sort(key=lambda t: t['occurrence_count'], reverse=True)
        
        # Get suggestions
        suggestions = self.suggest_related_tensions(active_tensions[:5])
        
        return {
            'active_tensions': active_tensions,
            'total_unique_tensions': len(active_tensions),
            'suggestions': suggestions,
            'analyzed_reflections': len(reflections)
        }
