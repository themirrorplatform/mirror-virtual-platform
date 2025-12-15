"""
Commons Integrity Checker - Sybil Detection and Voting Anomaly Detection

Analyzes Commons activity for:
- Sybil attacks (fake identities)
- Funding correlation (coordinated behavior)
- Bot likelihood scoring
- Voting pattern anomalies
- Coordinated manipulation attempts

Protects democratic evolution from gaming.
"""

import json
import math
from typing import Dict, List, Optional, Tuple, Set
from datetime import datetime, timedelta
from collections import defaultdict, Counter


class IntegrityThreat(str):
    """Types of integrity threats"""
    SYBIL_CLUSTER = "sybil_cluster"
    COORDINATED_VOTING = "coordinated_voting"
    BOT_BEHAVIOR = "bot_behavior"
    FUNDING_CORRELATION = "funding_correlation"
    VOTE_BUYING = "vote_buying"
    RAPID_IDENTITY_CREATION = "rapid_identity_creation"
    IDENTICAL_PATTERNS = "identical_patterns"


class CommonsIntegrityChecker:
    """
    Analyzes Commons for manipulation and gaming attempts.
    
    Uses statistical analysis and pattern detection to identify:
    - Sybil attacks (one person, many identities)
    - Coordinated voting campaigns
    - Bot-like behavior patterns
    - Funding-based influence networks
    """
    
    def __init__(self, storage):
        self.storage = storage
        
        # Thresholds (tunable)
        self.sybil_similarity_threshold = 0.85
        self.bot_score_threshold = 0.70
        self.coordination_threshold = 0.80
        self.rapid_creation_window_hours = 24
        self.rapid_creation_threshold = 10
    
    def check_proposal_integrity(
        self,
        proposal_id: str,
        check_voters: bool = True,
        check_coordination: bool = True
    ) -> Dict:
        """
        Check integrity of a specific proposal's votes.
        
        Args:
            proposal_id: ID of proposal to check
            check_voters: Check individual voter integrity
            check_coordination: Check for coordinated behavior
        
        Returns:
            Integrity report with threats detected
        """
        
        threats = []
        
        # Get all votes for proposal
        cursor = self.storage.conn.execute("""
            SELECT v.*, i.created_at as identity_created_at, i.metadata as identity_metadata
            FROM evolution_votes v
            JOIN identities i ON v.identity_id = i.id
            WHERE v.proposal_id = ?
        """, (proposal_id,))
        
        votes = cursor.fetchall()
        
        if not votes:
            return {
                'proposal_id': proposal_id,
                'threats_detected': 0,
                'threats': [],
                'integrity_score': 1.0,
                'recommendation': 'no_votes_yet'
            }
        
        # Check for Sybil clusters
        if check_voters:
            sybil_threat = self._detect_sybil_cluster(votes)
            if sybil_threat:
                threats.append(sybil_threat)
        
        # Check for coordinated voting
        if check_coordination:
            coordination_threat = self._detect_coordinated_voting(votes)
            if coordination_threat:
                threats.append(coordination_threat)
        
        # Check for bot behavior
        if check_voters:
            bot_threat = self._detect_bot_voting(votes)
            if bot_threat:
                threats.append(bot_threat)
        
        # Check for rapid identity creation
        rapid_creation_threat = self._detect_rapid_identity_creation(votes)
        if rapid_creation_threat:
            threats.append(rapid_creation_threat)
        
        # Calculate integrity score
        integrity_score = self._calculate_integrity_score(threats, len(votes))
        
        return {
            'proposal_id': proposal_id,
            'total_votes': len(votes),
            'threats_detected': len(threats),
            'threats': threats,
            'integrity_score': integrity_score,
            'recommendation': self._get_recommendation(integrity_score, threats)
        }
    
    def _detect_sybil_cluster(self, votes: List[Dict]) -> Optional[Dict]:
        """
        Detect potential Sybil attack (one person, multiple fake identities).
        
        Looks for:
        - Similar voting patterns
        - Similar reflection content
        - Similar timing patterns
        - Network correlation
        """
        
        if len(votes) < 3:
            return None
        
        # Extract identity IDs
        identity_ids = [v['identity_id'] for v in votes]
        
        # Get reflection patterns for each identity
        identity_patterns = {}
        for identity_id in identity_ids:
            patterns = self._get_identity_patterns(identity_id)
            identity_patterns[identity_id] = patterns
        
        # Find highly similar pairs
        suspicious_clusters = []
        checked_pairs = set()
        
        for i, id1 in enumerate(identity_ids):
            for id2 in identity_ids[i+1:]:
                if (id1, id2) in checked_pairs:
                    continue
                checked_pairs.add((id1, id2))
                
                similarity = self._calculate_identity_similarity(
                    identity_patterns[id1],
                    identity_patterns[id2]
                )
                
                if similarity >= self.sybil_similarity_threshold:
                    suspicious_clusters.append({
                        'identities': [id1, id2],
                        'similarity_score': similarity
                    })
        
        if not suspicious_clusters:
            return None
        
        # Merge overlapping clusters
        merged_clusters = self._merge_clusters(suspicious_clusters)
        
        if not merged_clusters:
            return None
        
        return {
            'type': IntegrityThreat.SYBIL_CLUSTER,
            'severity': 'high' if len(merged_clusters[0]['identities']) > 3 else 'medium',
            'clusters': merged_clusters,
            'affected_votes': sum(len(c['identities']) for c in merged_clusters),
            'description': f"Detected {len(merged_clusters)} potential Sybil cluster(s)"
        }
    
    def _detect_coordinated_voting(self, votes: List[Dict]) -> Optional[Dict]:
        """
        Detect coordinated voting campaigns.
        
        Looks for:
        - Simultaneous voting (within tight time windows)
        - Identical reasoning text
        - Same voting patterns across proposals
        """
        
        if len(votes) < 5:
            return None
        
        # Check temporal clustering
        timestamps = [datetime.fromisoformat(v['created_at'].replace('Z', '')) for v in votes]
        timestamps.sort()
        
        # Find tight clusters (within 5 minutes)
        tight_clusters = []
        current_cluster = [timestamps[0]]
        
        for ts in timestamps[1:]:
            if (ts - current_cluster[-1]).total_seconds() <= 300:  # 5 minutes
                current_cluster.append(ts)
            else:
                if len(current_cluster) >= 5:
                    tight_clusters.append(current_cluster)
                current_cluster = [ts]
        
        if len(current_cluster) >= 5:
            tight_clusters.append(current_cluster)
        
        # Check reasoning similarity
        reasoning_texts = [v.get('reasoning', '') for v in votes if v.get('reasoning')]
        identical_reasoning = self._find_identical_text_groups(reasoning_texts)
        
        coordination_score = 0.0
        
        if tight_clusters:
            coordination_score += 0.5 * (len(tight_clusters[0]) / len(votes))
        
        if identical_reasoning:
            coordination_score += 0.5 * (max(len(g) for g in identical_reasoning) / len(votes))
        
        if coordination_score < self.coordination_threshold:
            return None
        
        return {
            'type': IntegrityThreat.COORDINATED_VOTING,
            'severity': 'high' if coordination_score > 0.9 else 'medium',
            'coordination_score': coordination_score,
            'temporal_clusters': len(tight_clusters),
            'identical_reasoning_groups': len(identical_reasoning),
            'description': f"Detected coordinated voting pattern (score: {coordination_score:.2f})"
        }
    
    def _detect_bot_voting(self, votes: List[Dict]) -> Optional[Dict]:
        """
        Detect bot-like voting behavior.
        
        Looks for:
        - Too-regular timing patterns
        - Minimal reflection activity
        - Generic/templated reasoning
        - Rapid consecutive voting
        """
        
        suspicious_identities = []
        
        for vote in votes:
            identity_id = vote['identity_id']
            bot_score = self._calculate_bot_likelihood(identity_id)
            
            if bot_score >= self.bot_score_threshold:
                suspicious_identities.append({
                    'identity_id': identity_id,
                    'bot_score': bot_score
                })
        
        if not suspicious_identities:
            return None
        
        return {
            'type': IntegrityThreat.BOT_BEHAVIOR,
            'severity': 'high' if len(suspicious_identities) > len(votes) * 0.3 else 'medium',
            'suspicious_count': len(suspicious_identities),
            'suspicious_identities': suspicious_identities[:5],  # Top 5
            'description': f"Detected {len(suspicious_identities)} bot-like voter(s)"
        }
    
    def _detect_rapid_identity_creation(self, votes: List[Dict]) -> Optional[Dict]:
        """
        Detect burst of new identities created to influence vote.
        
        Looks for many new identities created shortly before proposal.
        """
        
        # Get proposal creation time
        cursor = self.storage.conn.execute("""
            SELECT created_at FROM evolution_proposals WHERE id = ?
        """, (votes[0]['proposal_id'],))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        proposal_time = datetime.fromisoformat(row['created_at'].replace('Z', ''))
        
        # Check how many voters were created shortly before
        recent_identities = []
        
        for vote in votes:
            identity_created = datetime.fromisoformat(
                vote['identity_created_at'].replace('Z', '')
            )
            
            hours_before_proposal = (proposal_time - identity_created).total_seconds() / 3600
            
            if 0 <= hours_before_proposal <= self.rapid_creation_window_hours:
                recent_identities.append({
                    'identity_id': vote['identity_id'],
                    'hours_before_proposal': hours_before_proposal
                })
        
        if len(recent_identities) < self.rapid_creation_threshold:
            return None
        
        return {
            'type': IntegrityThreat.RAPID_IDENTITY_CREATION,
            'severity': 'high',
            'recent_identity_count': len(recent_identities),
            'window_hours': self.rapid_creation_window_hours,
            'description': f"{len(recent_identities)} identities created within {self.rapid_creation_window_hours}h of proposal"
        }
    
    def _get_identity_patterns(self, identity_id: str) -> Dict:
        """Extract behavioral patterns for an identity"""
        
        # Get reflection count and timing
        cursor = self.storage.conn.execute("""
            SELECT COUNT(*) as count, 
                   MIN(created_at) as first_reflection,
                   MAX(created_at) as last_reflection
            FROM reflections 
            WHERE identity_id = ?
        """, (identity_id,))
        
        reflection_stats = cursor.fetchone()
        
        # Get voting history
        cursor = self.storage.conn.execute("""
            SELECT choice, created_at FROM evolution_votes
            WHERE identity_id = ?
            ORDER BY created_at
        """, (identity_id,))
        
        votes = cursor.fetchall()
        
        # Calculate timing regularity
        if len(votes) > 1:
            intervals = []
            prev_time = None
            for vote in votes:
                vote_time = datetime.fromisoformat(vote['created_at'].replace('Z', ''))
                if prev_time:
                    intervals.append((vote_time - prev_time).total_seconds())
                prev_time = vote_time
            
            timing_variance = self._calculate_variance(intervals) if intervals else 0
        else:
            timing_variance = 0
        
        return {
            'reflection_count': reflection_stats['count'],
            'vote_count': len(votes),
            'timing_variance': timing_variance,
            'vote_choices': [v['choice'] for v in votes]
        }
    
    def _calculate_identity_similarity(
        self,
        patterns1: Dict,
        patterns2: Dict
    ) -> float:
        """Calculate similarity between two identity patterns"""
        
        similarity = 0.0
        weights = {
            'reflection_similarity': 0.3,
            'voting_similarity': 0.4,
            'timing_similarity': 0.3
        }
        
        # Reflection count similarity
        if patterns1['reflection_count'] > 0 or patterns2['reflection_count'] > 0:
            max_count = max(patterns1['reflection_count'], patterns2['reflection_count'])
            min_count = min(patterns1['reflection_count'], patterns2['reflection_count'])
            reflection_sim = min_count / max_count if max_count > 0 else 0
            similarity += weights['reflection_similarity'] * reflection_sim
        
        # Voting pattern similarity (choices)
        votes1 = patterns1['vote_choices']
        votes2 = patterns2['vote_choices']
        
        if votes1 and votes2:
            matching_votes = sum(1 for v1, v2 in zip(votes1, votes2) if v1 == v2)
            vote_sim = matching_votes / min(len(votes1), len(votes2))
            similarity += weights['voting_similarity'] * vote_sim
        
        # Timing pattern similarity
        variance1 = patterns1['timing_variance']
        variance2 = patterns2['timing_variance']
        
        if variance1 > 0 or variance2 > 0:
            timing_sim = 1 - abs(variance1 - variance2) / max(variance1, variance2, 1)
            similarity += weights['timing_similarity'] * timing_sim
        
        return similarity
    
    def _calculate_bot_likelihood(self, identity_id: str) -> float:
        """Calculate likelihood that identity is a bot"""
        
        patterns = self._get_identity_patterns(identity_id)
        
        bot_score = 0.0
        
        # Very low reflection activity
        if patterns['reflection_count'] < 3:
            bot_score += 0.3
        
        # Only votes, no reflections
        if patterns['vote_count'] > 0 and patterns['reflection_count'] == 0:
            bot_score += 0.4
        
        # Too-regular timing (low variance)
        if patterns['timing_variance'] < 100:  # < 100 seconds variance
            bot_score += 0.3
        
        return min(bot_score, 1.0)
    
    def _find_identical_text_groups(self, texts: List[str]) -> List[List[int]]:
        """Find groups of identical text"""
        
        groups = defaultdict(list)
        
        for i, text in enumerate(texts):
            normalized = text.strip().lower()
            if normalized:
                groups[normalized].append(i)
        
        # Return groups with 3+ identical texts
        return [indices for indices in groups.values() if len(indices) >= 3]
    
    def _merge_clusters(
        self,
        clusters: List[Dict]
    ) -> List[Dict]:
        """Merge overlapping identity clusters"""
        
        if not clusters:
            return []
        
        merged = []
        
        for cluster in clusters:
            identities = set(cluster['identities'])
            
            # Check if overlaps with existing merged cluster
            merged_into_existing = False
            for existing in merged:
                if identities & set(existing['identities']):
                    existing['identities'] = list(set(existing['identities']) | identities)
                    merged_into_existing = True
                    break
            
            if not merged_into_existing:
                merged.append({
                    'identities': list(identities),
                    'max_similarity': cluster['similarity_score']
                })
        
        return merged
    
    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of values"""
        
        if not values:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        
        return variance
    
    def _calculate_integrity_score(
        self,
        threats: List[Dict],
        total_votes: int
    ) -> float:
        """
        Calculate overall integrity score.
        
        1.0 = completely clean
        0.0 = severely compromised
        """
        
        if not threats:
            return 1.0
        
        penalty = 0.0
        
        for threat in threats:
            severity = threat.get('severity', 'medium')
            
            if severity == 'critical':
                penalty += 0.4
            elif severity == 'high':
                penalty += 0.25
            elif severity == 'medium':
                penalty += 0.15
            else:
                penalty += 0.05
        
        return max(0.0, 1.0 - penalty)
    
    def _get_recommendation(
        self,
        integrity_score: float,
        threats: List[Dict]
    ) -> str:
        """Get recommendation based on integrity analysis"""
        
        if integrity_score >= 0.9:
            return "proceed_normally"
        elif integrity_score >= 0.7:
            return "proceed_with_caution"
        elif integrity_score >= 0.5:
            return "investigate_before_proceeding"
        else:
            return "freeze_and_investigate"
    
    def analyze_funding_correlation(
        self,
        proposal_id: str,
        funding_data: Dict[str, float]
    ) -> Dict:
        """
        Analyze if votes correlate with funding/payments.
        
        Args:
            proposal_id: ID of proposal
            funding_data: Map of identity_id -> funding amount
        
        Returns:
            Correlation analysis
        """
        
        # Get votes
        cursor = self.storage.conn.execute("""
            SELECT identity_id, choice, weight
            FROM evolution_votes
            WHERE proposal_id = ?
        """, (proposal_id,))
        
        votes = cursor.fetchall()
        
        # Calculate correlation between funding and vote choice
        funded_for = 0
        funded_against = 0
        unfunded_for = 0
        unfunded_against = 0
        
        for vote in votes:
            identity_id = vote['identity_id']
            funding = funding_data.get(identity_id, 0)
            choice = vote['choice']
            
            if funding > 0:
                if choice == 'for':
                    funded_for += 1
                elif choice == 'against':
                    funded_against += 1
            else:
                if choice == 'for':
                    unfunded_for += 1
                elif choice == 'against':
                    unfunded_against += 1
        
        total_funded = funded_for + funded_against
        total_unfunded = unfunded_for + unfunded_against
        
        if total_funded == 0:
            return {
                'correlation_detected': False,
                'message': 'No funding data available'
            }
        
        # Check if funded voters vote differently than unfunded
        funded_for_rate = funded_for / total_funded if total_funded > 0 else 0
        unfunded_for_rate = unfunded_for / total_unfunded if total_unfunded > 0 else 0
        
        rate_difference = abs(funded_for_rate - unfunded_for_rate)
        
        return {
            'correlation_detected': rate_difference > 0.3,
            'funded_for_rate': funded_for_rate,
            'unfunded_for_rate': unfunded_for_rate,
            'rate_difference': rate_difference,
            'severity': 'high' if rate_difference > 0.5 else 'medium',
            'recommendation': 'investigate_funding' if rate_difference > 0.3 else 'no_action_needed'
        }
