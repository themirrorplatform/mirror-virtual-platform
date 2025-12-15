# mirrorx-engine/app/pattern_detector.py
"""
Pattern Detection for MirrorX Engine

Identifies recurring themes, motifs, and patterns across reflections
using embedding similarity and LLM-based analysis.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timedelta

from mirrorcore.models.base import MirrorLLM


class Pattern:
    """Represents a detected pattern."""
    
    def __init__(
        self,
        name: str,
        description: str,
        occurrences: List[str],  # Reflection IDs
        confidence: float,
        first_seen: datetime,
        last_seen: datetime,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.name = name
        self.description = description
        self.occurrences = occurrences
        self.confidence = confidence
        self.first_seen = first_seen
        self.last_seen = last_seen
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'description': self.description,
            'occurrence_count': len(self.occurrences),
            'occurrences': self.occurrences,
            'confidence': self.confidence,
            'first_seen': self.first_seen.isoformat(),
            'last_seen': self.last_seen.isoformat(),
            'metadata': self.metadata
        }
    
    def __repr__(self) -> str:
        return f"<Pattern: {self.name} ({len(self.occurrences)} occurrences)>"


class PatternDetector:
    """
    Detects recurring patterns in reflections.
    
    Uses combination of:
    1. Embedding-based similarity clustering
    2. LLM-based theme extraction
    3. Statistical co-occurrence analysis
    """
    
    def __init__(
        self,
        llm: MirrorLLM,
        similarity_threshold: float = 0.75,
        min_occurrences: int = 2,
        time_window_days: int = 90
    ):
        """
        Initialize pattern detector.
        
        Args:
            llm: LLM adapter for analysis
            similarity_threshold: Min cosine similarity (0-1) to group reflections
            min_occurrences: Min times pattern must appear to be detected
            time_window_days: Look back this many days for patterns
        """
        self.llm = llm
        self.similarity_threshold = similarity_threshold
        self.min_occurrences = min_occurrences
        self.time_window_days = time_window_days
    
    def detect_patterns(
        self,
        reflections: List[Dict[str, Any]],
        existing_patterns: Optional[List[Pattern]] = None
    ) -> List[Pattern]:
        """
        Detect patterns across reflections.
        
        Args:
            reflections: List of reflection dicts with {id, content, created_at}
            existing_patterns: Previously detected patterns to update
            
        Returns:
            List of detected patterns (new + updated)
        """
        if not reflections:
            return existing_patterns or []
        
        # Filter by time window
        cutoff = datetime.utcnow() - timedelta(days=self.time_window_days)
        recent_reflections = [
            r for r in reflections
            if self._parse_timestamp(r.get('created_at', '')) >= cutoff
        ]
        
        if len(recent_reflections) < self.min_occurrences:
            return existing_patterns or []
        
        # Method 1: Embedding-based clustering
        embedding_patterns = self._detect_by_embeddings(recent_reflections)
        
        # Method 2: LLM-based theme extraction
        llm_patterns = self._detect_by_llm(recent_reflections)
        
        # Method 3: Keyword co-occurrence (simple heuristic)
        keyword_patterns = self._detect_by_keywords(recent_reflections)
        
        # Merge and deduplicate patterns
        all_patterns = embedding_patterns + llm_patterns + keyword_patterns
        merged = self._merge_similar_patterns(all_patterns)
        
        # Filter by minimum occurrences
        filtered = [p for p in merged if len(p.occurrences) >= self.min_occurrences]
        
        # Update existing patterns
        if existing_patterns:
            filtered = self._update_existing_patterns(filtered, existing_patterns)
        
        # Sort by occurrence count (most frequent first)
        filtered.sort(key=lambda p: len(p.occurrences), reverse=True)
        
        return filtered
    
    def _detect_by_embeddings(
        self,
        reflections: List[Dict[str, Any]]
    ) -> List[Pattern]:
        """Detect patterns using embedding similarity clustering."""
        if len(reflections) < self.min_occurrences:
            return []
        
        # Generate embeddings
        texts = [r['content'] for r in reflections]
        try:
            embeddings = self.llm.get_embeddings(texts)
        except (NotImplementedError, Exception):
            return []  # LLM doesn't support embeddings
        
        # Convert to numpy for cosine similarity
        embeddings_array = np.array(embeddings)
        
        # Compute pairwise cosine similarity
        similarity_matrix = self._cosine_similarity_matrix(embeddings_array)
        
        # Cluster by similarity threshold
        clusters = self._cluster_by_similarity(similarity_matrix, self.similarity_threshold)
        
        # Convert clusters to patterns
        patterns = []
        for cluster_indices in clusters:
            if len(cluster_indices) < self.min_occurrences:
                continue
            
            cluster_reflections = [reflections[i] for i in cluster_indices]
            
            # Generate pattern name/description using LLM
            pattern_info = self._generate_pattern_summary(cluster_reflections)
            
            patterns.append(Pattern(
                name=pattern_info['name'],
                description=pattern_info['description'],
                occurrences=[r['id'] for r in cluster_reflections],
                confidence=pattern_info['confidence'],
                first_seen=min(self._parse_timestamp(r['created_at']) for r in cluster_reflections),
                last_seen=max(self._parse_timestamp(r['created_at']) for r in cluster_reflections),
                metadata={'detection_method': 'embedding_similarity'}
            ))
        
        return patterns
    
    def _detect_by_llm(
        self,
        reflections: List[Dict[str, Any]]
    ) -> List[Pattern]:
        """Detect patterns using LLM theme extraction."""
        # Use LLM's built-in pattern detection
        reflection_texts = [r['content'] for r in reflections]
        
        try:
            llm_patterns = self.llm.detect_patterns(
                reflection_texts,
                existing_patterns=None
            )
        except Exception:
            return []
        
        # Convert to Pattern objects
        patterns = []
        for lp in llm_patterns:
            # Match occurrences back to reflection IDs
            occurrence_ids = []
            for example in lp.get('examples', []):
                for r in reflections:
                    if example.lower() in r['content'].lower():
                        if r['id'] not in occurrence_ids:
                            occurrence_ids.append(r['id'])
            
            if len(occurrence_ids) >= self.min_occurrences:
                matching_reflections = [r for r in reflections if r['id'] in occurrence_ids]
                patterns.append(Pattern(
                    name=lp['name'],
                    description=lp.get('description', ''),
                    occurrences=occurrence_ids,
                    confidence=lp.get('confidence', 0.7),
                    first_seen=min(self._parse_timestamp(r['created_at']) for r in matching_reflections),
                    last_seen=max(self._parse_timestamp(r['created_at']) for r in matching_reflections),
                    metadata={'detection_method': 'llm_analysis'}
                ))
        
        return patterns
    
    def _detect_by_keywords(
        self,
        reflections: List[Dict[str, Any]]
    ) -> List[Pattern]:
        """Simple keyword-based pattern detection."""
        # Extract common phrases (2-3 word sequences)
        phrase_occurrences = defaultdict(list)
        
        for reflection in reflections:
            content = reflection['content'].lower()
            words = content.split()
            
            # 2-word phrases
            for i in range(len(words) - 1):
                phrase = f"{words[i]} {words[i+1]}"
                if len(phrase) > 6:  # Skip very short phrases
                    phrase_occurrences[phrase].append(reflection['id'])
            
            # 3-word phrases
            for i in range(len(words) - 2):
                phrase = f"{words[i]} {words[i+1]} {words[i+2]}"
                if len(phrase) > 10:
                    phrase_occurrences[phrase].append(reflection['id'])
        
        # Convert to patterns
        patterns = []
        for phrase, occurrence_ids in phrase_occurrences.items():
            if len(set(occurrence_ids)) >= self.min_occurrences:
                unique_ids = list(set(occurrence_ids))
                matching_reflections = [r for r in reflections if r['id'] in unique_ids]
                
                patterns.append(Pattern(
                    name=f"Recurring phrase: \"{phrase}\"",
                    description=f"This phrase appears {len(unique_ids)} times",
                    occurrences=unique_ids,
                    confidence=0.6,  # Lower confidence for keyword-based
                    first_seen=min(self._parse_timestamp(r['created_at']) for r in matching_reflections),
                    last_seen=max(self._parse_timestamp(r['created_at']) for r in matching_reflections),
                    metadata={'detection_method': 'keyword_cooccurrence', 'phrase': phrase}
                ))
        
        return patterns
    
    def _cosine_similarity_matrix(self, embeddings: np.ndarray) -> np.ndarray:
        """Compute cosine similarity matrix for embeddings."""
        # Normalize embeddings
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized = embeddings / (norms + 1e-10)
        
        # Compute cosine similarity (dot product of normalized vectors)
        similarity = np.dot(normalized, normalized.T)
        
        return similarity
    
    def _cluster_by_similarity(
        self,
        similarity_matrix: np.ndarray,
        threshold: float
    ) -> List[List[int]]:
        """Cluster items by similarity threshold (simple greedy clustering)."""
        n = similarity_matrix.shape[0]
        visited = set()
        clusters = []
        
        for i in range(n):
            if i in visited:
                continue
            
            # Start new cluster
            cluster = [i]
            visited.add(i)
            
            # Add similar items
            for j in range(i + 1, n):
                if j not in visited and similarity_matrix[i, j] >= threshold:
                    cluster.append(j)
                    visited.add(j)
            
            clusters.append(cluster)
        
        return clusters
    
    def _generate_pattern_summary(
        self,
        reflections: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate pattern name and description using LLM."""
        # Sample up to 5 reflections for summary
        sample = reflections[:5]
        sample_texts = [r['content'] for r in sample]
        
        # Use LLM to summarize the pattern
        try:
            summary = self.llm.summarize_thread(sample_texts, max_length=100)
            
            # Extract pattern name (first sentence or up to 50 chars)
            name = summary.split('.')[0][:50]
            if len(name) < 10:
                name = f"Pattern in {len(reflections)} reflections"
            
            return {
                'name': name,
                'description': summary,
                'confidence': 0.75
            }
        except Exception:
            return {
                'name': f"Recurring theme ({len(reflections)} occurrences)",
                'description': "Similar reflections detected",
                'confidence': 0.6
            }
    
    def _merge_similar_patterns(
        self,
        patterns: List[Pattern]
    ) -> List[Pattern]:
        """Merge patterns that are very similar."""
        if len(patterns) <= 1:
            return patterns
        
        merged = []
        used = set()
        
        for i, p1 in enumerate(patterns):
            if i in used:
                continue
            
            # Check for overlap with other patterns
            combined_occurrences = set(p1.occurrences)
            combined_patterns = [p1]
            
            for j, p2 in enumerate(patterns[i+1:], start=i+1):
                if j in used:
                    continue
                
                # Calculate overlap
                overlap = len(set(p1.occurrences) & set(p2.occurrences))
                total = len(set(p1.occurrences) | set(p2.occurrences))
                overlap_ratio = overlap / total if total > 0 else 0
                
                # Merge if high overlap (>60%)
                if overlap_ratio > 0.6:
                    combined_occurrences.update(p2.occurrences)
                    combined_patterns.append(p2)
                    used.add(j)
            
            # Create merged pattern
            if len(combined_patterns) > 1:
                # Use the pattern with highest confidence as base
                base = max(combined_patterns, key=lambda p: p.confidence)
                merged_pattern = Pattern(
                    name=base.name,
                    description=base.description,
                    occurrences=list(combined_occurrences),
                    confidence=np.mean([p.confidence for p in combined_patterns]),
                    first_seen=min(p.first_seen for p in combined_patterns),
                    last_seen=max(p.last_seen for p in combined_patterns),
                    metadata={'merged_from': len(combined_patterns)}
                )
                merged.append(merged_pattern)
            else:
                merged.append(p1)
            
            used.add(i)
        
        return merged
    
    def _update_existing_patterns(
        self,
        new_patterns: List[Pattern],
        existing_patterns: List[Pattern]
    ) -> List[Pattern]:
        """Update existing patterns with new occurrences."""
        updated = []
        matched_new = set()
        
        for existing in existing_patterns:
            # Find matching new pattern (by name similarity)
            best_match = None
            best_score = 0
            
            for i, new in enumerate(new_patterns):
                if i in matched_new:
                    continue
                
                # Simple name similarity
                score = self._string_similarity(existing.name.lower(), new.name.lower())
                if score > best_score and score > 0.5:
                    best_score = score
                    best_match = (i, new)
            
            if best_match:
                idx, new = best_match
                matched_new.add(idx)
                
                # Merge occurrences
                all_occurrences = list(set(existing.occurrences + new.occurrences))
                
                updated.append(Pattern(
                    name=existing.name,  # Keep original name
                    description=new.description,  # Use updated description
                    occurrences=all_occurrences,
                    confidence=max(existing.confidence, new.confidence),
                    first_seen=min(existing.first_seen, new.first_seen),
                    last_seen=max(existing.last_seen, new.last_seen),
                    metadata={**existing.metadata, 'updated': True}
                ))
            else:
                # No match, keep existing
                updated.append(existing)
        
        # Add unmatched new patterns
        for i, new in enumerate(new_patterns):
            if i not in matched_new:
                updated.append(new)
        
        return updated
    
    def _string_similarity(self, s1: str, s2: str) -> float:
        """Simple string similarity (Jaccard index of words)."""
        words1 = set(s1.split())
        words2 = set(s2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        return intersection / union if union > 0 else 0.0
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse ISO 8601 timestamp."""
        try:
            # Remove 'Z' suffix if present
            if timestamp_str.endswith('Z'):
                timestamp_str = timestamp_str[:-1]
            return datetime.fromisoformat(timestamp_str)
        except (ValueError, AttributeError):
            return datetime.utcnow()
    
    def get_pattern_evolution(
        self,
        pattern: Pattern,
        all_reflections: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze how a pattern has evolved over time.
        
        Args:
            pattern: Pattern to analyze
            all_reflections: All reflections (for context)
            
        Returns:
            Evolution analysis dict
        """
        # Get reflections matching this pattern
        pattern_reflections = [
            r for r in all_reflections
            if r['id'] in pattern.occurrences
        ]
        
        # Sort by date
        pattern_reflections.sort(
            key=lambda r: self._parse_timestamp(r.get('created_at', ''))
        )
        
        # Calculate frequency over time
        timestamps = [self._parse_timestamp(r['created_at']) for r in pattern_reflections]
        
        if len(timestamps) < 2:
            return {
                'trend': 'stable',
                'frequency_change': 0.0,
                'timeline': []
            }
        
        # Simple trend: compare first half vs second half
        midpoint = len(timestamps) // 2
        first_half_days = (timestamps[midpoint] - timestamps[0]).days or 1
        second_half_days = (timestamps[-1] - timestamps[midpoint]).days or 1
        
        first_half_freq = midpoint / first_half_days
        second_half_freq = (len(timestamps) - midpoint) / second_half_days
        
        change = (second_half_freq - first_half_freq) / (first_half_freq + 1e-10)
        
        if change > 0.2:
            trend = 'increasing'
        elif change < -0.2:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'frequency_change': change,
            'first_occurrence': timestamps[0].isoformat(),
            'last_occurrence': timestamps[-1].isoformat(),
            'total_days': (timestamps[-1] - timestamps[0]).days,
            'occurrence_count': len(timestamps)
        }
