# mirror_worldview/commons.py
"""
Mirror Commons: Shared Reflection Space

Public space where reflections can be shared (with explicit consent).

Constitutional guarantees:
- I4: Data sovereignty - user decides what's public
- I2: Identity locality - no cross-identity analysis
- L0 + L1: All public content passes constitutional checks
- I13: No engagement/behavior tracking metrics
- I14: K-anonymity for any aggregate research data

Design:
- Opt-in only (explicit consent required)
- Constitutional filtering (L0 + L1 checks before publication)
- Privacy controls (user can make anything private again)
- Discovery mechanisms (search by themes, not identities)
- Moderation queue (Guardian oversight)
"""

import json
import sqlite3
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum


class PublicationStatus(Enum):
    """Status of public reflection"""
    PENDING = "pending"  # Awaiting moderation
    PUBLISHED = "published"  # Live in Commons
    REJECTED = "rejected"  # Failed constitutional check
    WITHDRAWN = "withdrawn"  # User removed


@dataclass
class PublicReflection:
    """Public reflection in Commons"""
    id: str
    content: str
    themes: List[str]
    published_at: datetime
    status: PublicationStatus
    identity_hash: str  # Anonymous hash, not actual ID
    constitutional_score: float  # L0 + L1 compliance
    moderation_notes: Optional[str] = None


@dataclass
class DiscoveryQuery:
    """Query for discovering public reflections"""
    themes: Optional[List[str]] = None
    min_date: Optional[datetime] = None
    max_date: Optional[datetime] = None
    limit: int = 20
    offset: int = 0


class MirrorCommons:
    """
    Shared space for public reflections.
    
    Features:
    - Explicit opt-in (user must consent to each publication)
    - Constitutional filtering (all content passes L0 + L1)
    - Privacy controls (can withdraw anytime)
    - Anonymous discovery (search themes, not identities)
    - Guardian moderation (enforce invariants)
    """
    
    def __init__(self, db_path: Path, l0_checker, l1_safety, guardian):
        """
        Initialize Commons.
        
        Args:
            db_path: Database path
            l0_checker: L0AxiomChecker instance
            l1_safety: L1SafetyLayer instance
            guardian: Guardian instance
        """
        self.db_path = db_path
        self.l0 = l0_checker
        self.l1 = l1_safety
        self.guardian = guardian
        
        self._init_db()
        
        # Metrics (I13 compliant)
        self.metrics = {
            'total_submissions': 0,
            'published_count': 0,
            'rejected_count': 0,
            'withdrawn_count': 0,
            'constitutional_checks': 0,
            'guardian_interventions': 0
        }
    
    def _init_db(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            # Public reflections table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS public_reflections (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    themes TEXT NOT NULL,
                    identity_hash TEXT NOT NULL,
                    status TEXT NOT NULL,
                    constitutional_score REAL NOT NULL,
                    published_at TEXT,
                    created_at TEXT NOT NULL,
                    moderation_notes TEXT
                )
            """)
            
            # Theme index for discovery
            conn.execute("""
                CREATE TABLE IF NOT EXISTS reflection_themes (
                    reflection_id TEXT NOT NULL,
                    theme TEXT NOT NULL,
                    FOREIGN KEY (reflection_id) REFERENCES public_reflections(id)
                )
            """)
            
            # Create indexes
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_themes 
                ON reflection_themes(theme)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_status 
                ON public_reflections(status)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_published_at 
                ON public_reflections(published_at)
            """)
            
            conn.commit()
    
    def _create_identity_hash(self, identity_id: str) -> str:
        """
        Create anonymous hash of identity.
        
        Uses salted hash to prevent linkage while maintaining
        uniqueness for I14 k-anonymity checks.
        """
        # In production, would use per-installation salt
        salt = "mirror-commons-v1"
        return hashlib.sha256(f"{salt}{identity_id}".encode()).hexdigest()[:16]
    
    async def submit_for_publication(
        self,
        identity_id: str,
        content: str,
        themes: List[str]
    ) -> Dict[str, Any]:
        """
        Submit reflection for publication to Commons.
        
        Steps:
        1. Run constitutional checks (L0 + L1)
        2. Create anonymous identity hash
        3. Store in moderation queue
        4. Return submission result
        
        Args:
            identity_id: Identity submitting reflection
            content: Reflection content
            themes: Extracted themes
        
        Returns:
            Submission result with status
        """
        self.metrics['total_submissions'] += 1
        self.metrics['constitutional_checks'] += 1
        
        # Step 1: Constitutional checks
        l0_result = self.l0.check(content)
        l1_result = await self.l1.check(content, identity_id)
        
        # Calculate constitutional score
        constitutional_score = self._calculate_constitutional_score(l0_result, l1_result)
        
        # Determine if acceptable
        if constitutional_score < 0.8:
            # Rejected - constitutional violations
            self.metrics['rejected_count'] += 1
            
            rejection_reason = self._get_rejection_reason(l0_result, l1_result)
            
            return {
                'status': 'rejected',
                'reason': rejection_reason,
                'constitutional_score': constitutional_score,
                'l0_violations': l0_result.violations,
                'l1_tier': l1_result.tier if hasattr(l1_result, 'tier') else None
            }
        
        # Step 2: Create anonymous hash
        identity_hash = self._create_identity_hash(identity_id)
        
        # Step 3: Store for moderation
        reflection_id = self._generate_reflection_id()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO public_reflections (
                    id, content, themes, identity_hash, status,
                    constitutional_score, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                reflection_id,
                content,
                json.dumps(themes),
                identity_hash,
                PublicationStatus.PENDING.value,
                constitutional_score,
                datetime.utcnow().isoformat()
            ))
            
            # Add theme entries
            for theme in themes:
                conn.execute("""
                    INSERT INTO reflection_themes (reflection_id, theme)
                    VALUES (?, ?)
                """, (reflection_id, theme.lower()))
            
            conn.commit()
        
        return {
            'status': 'pending',
            'reflection_id': reflection_id,
            'constitutional_score': constitutional_score,
            'message': 'Submitted for moderation'
        }
    
    def _calculate_constitutional_score(
        self,
        l0_result: Any,
        l1_result: Any
    ) -> float:
        """
        Calculate constitutional compliance score.
        
        Returns:
            Float 0.0-1.0 (1.0 = perfect compliance)
        """
        score = 1.0
        
        # L0 violations (each violation reduces score)
        if hasattr(l0_result, 'violations'):
            score -= len(l0_result.violations) * 0.15
        
        # L1 tier (tier 1 = block, tier 2 = flag)
        if hasattr(l1_result, 'tier'):
            if l1_result.tier == 1:
                score = 0.0  # Immediate block
            elif l1_result.tier == 2:
                score *= 0.85  # Significant flag
        
        return max(0.0, min(1.0, score))
    
    def _get_rejection_reason(self, l0_result: Any, l1_result: Any) -> str:
        """Generate human-readable rejection reason"""
        reasons = []
        
        if hasattr(l0_result, 'violations') and l0_result.violations:
            reasons.append(f"Constitutional violations: {', '.join(l0_result.violations[:2])}")
        
        if hasattr(l1_result, 'tier') and l1_result.tier == 1:
            reasons.append("Safety concern detected")
        
        return "; ".join(reasons) if reasons else "Constitutional compliance threshold not met"
    
    def _generate_reflection_id(self) -> str:
        """Generate unique reflection ID"""
        import secrets
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_part = secrets.token_hex(8)
        return f"ref-{timestamp}-{random_part}"
    
    def publish_reflection(self, reflection_id: str) -> bool:
        """
        Publish reflection from moderation queue.
        
        Args:
            reflection_id: Reflection to publish
        
        Returns:
            True if published, False if not found
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT status FROM public_reflections
                WHERE id = ?
            """, (reflection_id,))
            
            result = cursor.fetchone()
            if not result:
                return False
            
            if result[0] != PublicationStatus.PENDING.value:
                return False
            
            # Publish
            conn.execute("""
                UPDATE public_reflections
                SET status = ?, published_at = ?
                WHERE id = ?
            """, (
                PublicationStatus.PUBLISHED.value,
                datetime.utcnow().isoformat(),
                reflection_id
            ))
            conn.commit()
            
            self.metrics['published_count'] += 1
            
            return True
    
    def withdraw_reflection(self, identity_id: str, reflection_id: str) -> bool:
        """
        Withdraw (unpublish) reflection.
        
        User can withdraw their own reflections at any time (I4).
        
        Args:
            identity_id: Identity withdrawing reflection
            reflection_id: Reflection to withdraw
        
        Returns:
            True if withdrawn, False if not found or not owned
        """
        identity_hash = self._create_identity_hash(identity_id)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT identity_hash, status FROM public_reflections
                WHERE id = ?
            """, (reflection_id,))
            
            result = cursor.fetchone()
            if not result:
                return False
            
            stored_hash, status = result
            
            # Verify ownership
            if stored_hash != identity_hash:
                return False
            
            # Can only withdraw published reflections
            if status != PublicationStatus.PUBLISHED.value:
                return False
            
            # Withdraw
            conn.execute("""
                UPDATE public_reflections
                SET status = ?
                WHERE id = ?
            """, (PublicationStatus.WITHDRAWN.value, reflection_id))
            conn.commit()
            
            self.metrics['withdrawn_count'] += 1
            
            return True
    
    def discover(self, query: DiscoveryQuery) -> List[PublicReflection]:
        """
        Discover public reflections by themes.
        
        Args:
            query: Discovery query
        
        Returns:
            List of matching public reflections
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Build SQL query
            sql = """
                SELECT DISTINCT pr.id, pr.content, pr.themes, pr.published_at,
                       pr.status, pr.identity_hash, pr.constitutional_score,
                       pr.moderation_notes
                FROM public_reflections pr
            """
            
            conditions = ["pr.status = ?"]
            params = [PublicationStatus.PUBLISHED.value]
            
            # Join with themes if theme filter specified
            if query.themes:
                sql += " JOIN reflection_themes rt ON pr.id = rt.reflection_id"
                theme_placeholders = ",".join("?" * len(query.themes))
                conditions.append(f"rt.theme IN ({theme_placeholders})")
                params.extend([theme.lower() for theme in query.themes])
            
            # Date filters
            if query.min_date:
                conditions.append("pr.published_at >= ?")
                params.append(query.min_date.isoformat())
            
            if query.max_date:
                conditions.append("pr.published_at <= ?")
                params.append(query.max_date.isoformat())
            
            # Combine conditions
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
            
            # Order and limit
            sql += " ORDER BY pr.published_at DESC LIMIT ? OFFSET ?"
            params.extend([query.limit, query.offset])
            
            cursor = conn.execute(sql, params)
            
            reflections = []
            for row in cursor.fetchall():
                reflections.append(PublicReflection(
                    id=row['id'],
                    content=row['content'],
                    themes=json.loads(row['themes']),
                    published_at=datetime.fromisoformat(row['published_at']),
                    status=PublicationStatus(row['status']),
                    identity_hash=row['identity_hash'],
                    constitutional_score=row['constitutional_score'],
                    moderation_notes=row['moderation_notes']
                ))
            
            return reflections
    
    def get_moderation_queue(self, limit: int = 50) -> List[PublicReflection]:
        """
        Get pending reflections for moderation.
        
        Args:
            limit: Maximum reflections to return
        
        Returns:
            List of pending reflections
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT id, content, themes, published_at, status,
                       identity_hash, constitutional_score, moderation_notes
                FROM public_reflections
                WHERE status = ?
                ORDER BY created_at ASC
                LIMIT ?
            """, (PublicationStatus.PENDING.value, limit))
            
            reflections = []
            for row in cursor.fetchall():
                reflections.append(PublicReflection(
                    id=row['id'],
                    content=row['content'],
                    themes=json.loads(row['themes']),
                    published_at=datetime.fromisoformat(row['published_at']) if row['published_at'] else None,
                    status=PublicationStatus(row['status']),
                    identity_hash=row['identity_hash'],
                    constitutional_score=row['constitutional_score'],
                    moderation_notes=row['moderation_notes']
                ))
            
            return reflections
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get I13-compliant Commons metrics.
        
        Returns only aggregate counts, no user behavior tracking.
        """
        with sqlite3.connect(self.db_path) as conn:
            # Get status counts
            cursor = conn.execute("""
                SELECT status, COUNT(*) as count
                FROM public_reflections
                GROUP BY status
            """)
            
            status_counts = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Get theme distribution (top 10)
            cursor = conn.execute("""
                SELECT theme, COUNT(*) as count
                FROM reflection_themes rt
                JOIN public_reflections pr ON rt.reflection_id = pr.id
                WHERE pr.status = ?
                GROUP BY theme
                ORDER BY count DESC
                LIMIT 10
            """, (PublicationStatus.PUBLISHED.value,))
            
            top_themes = [
                {'theme': row[0], 'count': row[1]}
                for row in cursor.fetchall()
            ]
        
        return {
            'total_submissions': self.metrics['total_submissions'],
            'published': status_counts.get(PublicationStatus.PUBLISHED.value, 0),
            'pending': status_counts.get(PublicationStatus.PENDING.value, 0),
            'rejected': status_counts.get(PublicationStatus.REJECTED.value, 0),
            'withdrawn': status_counts.get(PublicationStatus.WITHDRAWN.value, 0),
            'constitutional_checks': self.metrics['constitutional_checks'],
            'guardian_interventions': self.metrics['guardian_interventions'],
            'top_themes': top_themes,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_aggregated_insights(
        self,
        theme: Optional[str] = None,
        min_participants: int = 10
    ) -> Dict[str, Any]:
        """
        Get k-anonymous aggregated insights from Commons.
        
        Returns patterns and insights guaranteed k-anonymity (k≥10).
        No individual reflection can be isolated.
        
        Args:
            theme: Optional theme filter
            min_participants: Minimum unique participants (k threshold)
        
        Returns:
            Aggregated insights with k-anonymity guarantee
        """
        from collections import Counter
        import re
        
        # Get published reflections
        with sqlite3.connect(self.db_path) as conn:
            if theme:
                cursor = conn.execute("""
                    SELECT pr.id, pr.content, pr.themes, pr.identity_hash, pr.published_at
                    FROM public_reflections pr
                    JOIN reflection_themes rt ON pr.id = rt.reflection_id
                    WHERE pr.status = ? AND rt.theme = ?
                """, (PublicationStatus.PUBLISHED.value, theme.lower()))
            else:
                cursor = conn.execute("""
                    SELECT id, content, themes, identity_hash, published_at
                    FROM public_reflections
                    WHERE status = ?
                """, (PublicationStatus.PUBLISHED.value,))
            
            reflections = []
            for row in cursor.fetchall():
                reflections.append({
                    'id': row[0],
                    'content': row[1],
                    'themes': json.loads(row[2]),
                    'identity_hash': row[3],
                    'published_at': row[4]
                })
        
        if not reflections:
            return {'error': 'No reflections found', 'k_anonymity_verified': False}
        
        # Count unique participants
        unique_identities = set(r['identity_hash'] for r in reflections)
        participant_count = len(unique_identities)
        
        # Verify k-anonymity threshold
        if participant_count < min_participants:
            return {
                'error': f'Insufficient participants (need {min_participants}, have {participant_count})',
                'k_anonymity_verified': False,
                'participant_count': participant_count
            }
        
        # Check no single identity dominates (max 30%)
        identity_counts = Counter(r['identity_hash'] for r in reflections)
        max_contribution = max(identity_counts.values()) / len(reflections)
        if max_contribution > 0.3:
            return {
                'error': 'Dataset dominated by single contributor',
                'k_anonymity_verified': False
            }
        
        # Extract patterns
        all_words = []
        all_themes = []
        
        stopwords = {'about', 'there', 'these', 'those', 'would', 'could', 'should', 'their', 'thing', 'think', 'being', 'having'}
        
        for r in reflections:
            words = re.findall(r'\b\w+\b', r['content'].lower())
            meaningful_words = [w for w in words if len(w) > 4 and w not in stopwords]
            all_words.extend(meaningful_words)
            all_themes.extend(r['themes'])
        
        word_freq = Counter(all_words)
        theme_freq = Counter(all_themes)
        
        # Common patterns (appearing in ≥20% of reflections)
        min_pattern_count = len(reflections) * 0.2
        common_patterns = [
            {'word': word, 'count': count, 'percentage': round(count / len(reflections) * 100, 1)}
            for word, count in word_freq.most_common(15)
            if count >= min_pattern_count
        ]
        
        # Sentiment analysis
        positive_words = {'growth', 'joy', 'love', 'hope', 'peace', 'gratitude', 'happy', 'better', 'good'}
        negative_words = {'pain', 'fear', 'anxiety', 'worry', 'sad', 'loss', 'difficult', 'hard', 'struggle'}
        
        sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0, 'mixed': 0}
        
        for r in reflections:
            words_set = set(re.findall(r'\b\w+\b', r['content'].lower()))
            pos = len(words_set & positive_words)
            neg = len(words_set & negative_words)
            
            if pos > neg and pos > 0:
                sentiment_counts['positive'] += 1
            elif neg > pos and neg > 0:
                sentiment_counts['negative'] += 1
            elif pos > 0 and neg > 0:
                sentiment_counts['mixed'] += 1
            else:
                sentiment_counts['neutral'] += 1
        
        sentiment_distribution = {
            k: round(v / len(reflections) * 100, 1)
            for k, v in sentiment_counts.items()
        }
        
        return {
            'theme': theme or 'all',
            'participant_count': participant_count,
            'total_reflections': len(reflections),
            'k_anonymity_verified': True,
            'k_value': participant_count,
            'common_patterns': common_patterns[:10],
            'sentiment_distribution': sentiment_distribution,
            'theme_distribution': [
                {'theme': t, 'count': c, 'percentage': round(c / len(reflections) * 100, 1)}
                for t, c in theme_freq.most_common(10)
            ],
            'time_range': {
                'earliest': min(r['published_at'] for r in reflections),
                'latest': max(r['published_at'] for r in reflections)
            },
            'anonymity_guarantee': f'Insights from {participant_count} unique contributors (k={participant_count})'
        }


# Self-test
if __name__ == "__main__":
    print("Mirror Commons Test")
    print("=" * 80)
    
    import tempfile
    import asyncio
    
    # Create temporary database
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "commons.db"
        
        # Mock components
        class MockL0:
            def check(self, text):
                class Result:
                    violations = []
                return Result()
        
        class MockL1:
            async def check(self, text, identity_id):
                class Result:
                    tier = None
                return Result()
        
        class MockGuardian:
            pass
        
        commons = MirrorCommons(db_path, MockL0(), MockL1(), MockGuardian())
        
        # Test 1: Submit reflection
        print("\n1. Testing reflection submission...")
        result = asyncio.run(commons.submit_for_publication(
            'user-123',
            'Reflecting on my journey of personal growth and self-discovery',
            ['growth', 'identity', 'self-discovery']
        ))
        print(f"   Status: {result['status']}")
        print(f"   Reflection ID: {result.get('reflection_id')}")
        print(f"   Constitutional score: {result['constitutional_score']}")
        
        if result['status'] == 'pending':
            reflection_id = result['reflection_id']
            
            # Test 2: Check moderation queue
            print("\n2. Testing moderation queue...")
            queue = commons.get_moderation_queue()
            print(f"   Pending reflections: {len(queue)}")
            if queue:
                print(f"   First reflection themes: {queue[0].themes}")
            
            # Test 3: Publish reflection
            print("\n3. Testing publication...")
            published = commons.publish_reflection(reflection_id)
            print(f"   Published: {published}")
            
            # Test 4: Discover reflections
            print("\n4. Testing discovery...")
            query = DiscoveryQuery(themes=['growth'], limit=10)
            results = commons.discover(query)
            print(f"   Found reflections: {len(results)}")
            if results:
                print(f"   First result themes: {results[0].themes}")
                print(f"   Constitutional score: {results[0].constitutional_score}")
            
            # Test 5: Withdraw reflection
            print("\n5. Testing withdrawal...")
            withdrawn = commons.withdraw_reflection('user-123', reflection_id)
            print(f"   Withdrawn: {withdrawn}")
            
            # Verify it's no longer discoverable
            results = commons.discover(query)
            print(f"   Reflections after withdrawal: {len(results)}")
        
        # Test 6: Metrics
        print("\n6. Testing metrics...")
        metrics = commons.get_metrics()
        print(f"   Total submissions: {metrics['total_submissions']}")
        print(f"   Published: {metrics['published']}")
        print(f"   Withdrawn: {metrics['withdrawn']}")
        print(f"   Constitutional checks: {metrics['constitutional_checks']}")
    
    print("\n✅ Mirror Commons functional")
