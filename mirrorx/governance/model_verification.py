"""
Model Verification System - Track LLM Usage and Detect Model Switching

Verifies:
- Which model generated each reflection
- Model switching patterns
- Model performance by model type
- Compliance with user preferences

Transparency principle: Users should know which AI model they're using.
"""

import json
import uuid
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter, defaultdict


class ModelType(str):
    """Types of models"""
    CLAUDE = "claude"
    GPT4 = "gpt4"
    LLAMA = "llama"
    MISTRAL = "mistral"
    GEMINI = "gemini"
    LOCAL = "local"
    UNKNOWN = "unknown"


class ModelVerificationSystem:
    """
    Tracks and verifies which LLM models are used.
    
    Provides:
    - Model usage tracking per reflection
    - Switch detection
    - Performance analytics by model
    - Audit trail
    """
    
    def __init__(self, storage):
        self.storage = storage
        self._ensure_verification_tables()
    
    def _ensure_verification_tables(self):
        """Create model tracking tables"""
        
        # Model usage log
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS model_usage_log (
                id TEXT PRIMARY KEY,
                reflection_id TEXT NOT NULL,
                identity_id TEXT NOT NULL,
                model_name TEXT NOT NULL,
                model_version TEXT,
                model_provider TEXT,
                model_type TEXT,
                timestamp TEXT NOT NULL,
                token_count INTEGER,
                response_time_ms INTEGER,
                metadata TEXT,  -- JSON
                FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE,
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        # Model switches
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS model_switches (
                id TEXT PRIMARY KEY,
                identity_id TEXT NOT NULL,
                from_model TEXT NOT NULL,
                to_model TEXT NOT NULL,
                switched_at TEXT NOT NULL,
                reason TEXT,  -- 'user_choice', 'automatic', 'fallback', 'error'
                metadata TEXT,  -- JSON
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        # Model preferences (user settings)
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS model_preferences (
                identity_id TEXT PRIMARY KEY,
                preferred_model TEXT NOT NULL,
                fallback_model TEXT,
                auto_switch_enabled INTEGER DEFAULT 0,  -- Boolean
                updated_at TEXT NOT NULL,
                metadata TEXT,  -- JSON
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_model_usage_reflection 
            ON model_usage_log(reflection_id)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_model_usage_identity 
            ON model_usage_log(identity_id)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_model_usage_timestamp 
            ON model_usage_log(timestamp DESC)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_model_switches_identity 
            ON model_switches(identity_id)
        """)
        
        self.storage.conn.commit()
    
    def log_model_usage(
        self,
        reflection_id: str,
        identity_id: str,
        model_name: str,
        model_version: Optional[str] = None,
        model_provider: Optional[str] = None,
        token_count: Optional[int] = None,
        response_time_ms: Optional[int] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Log which model was used for a reflection.
        
        Args:
            reflection_id: Reflection generated
            identity_id: User
            model_name: Model identifier (e.g., "claude-3-5-sonnet")
            model_version: Version string
            model_provider: Provider (anthropic, openai, etc.)
            token_count: Tokens used
            response_time_ms: Response latency
            metadata: Additional info
        
        Returns:
            Log entry ID
        """
        
        log_id = str(uuid.uuid4())
        model_type = self._classify_model_type(model_name)
        
        self.storage.conn.execute("""
            INSERT INTO model_usage_log (
                id, reflection_id, identity_id, model_name, model_version,
                model_provider, model_type, timestamp, token_count,
                response_time_ms, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            reflection_id,
            identity_id,
            model_name,
            model_version,
            model_provider,
            model_type,
            datetime.utcnow().isoformat() + 'Z',
            token_count,
            response_time_ms,
            json.dumps(metadata or {})
        ))
        
        self.storage.conn.commit()
        
        # Check for model switch
        self._check_for_switch(identity_id, model_name)
        
        return log_id
    
    def _classify_model_type(self, model_name: str) -> str:
        """Classify model by name"""
        
        name_lower = model_name.lower()
        
        if 'claude' in name_lower:
            return ModelType.CLAUDE
        elif 'gpt' in name_lower:
            return ModelType.GPT4
        elif 'llama' in name_lower:
            return ModelType.LLAMA
        elif 'mistral' in name_lower:
            return ModelType.MISTRAL
        elif 'gemini' in name_lower:
            return ModelType.GEMINI
        elif 'local' in name_lower or 'ollama' in name_lower:
            return ModelType.LOCAL
        else:
            return ModelType.UNKNOWN
    
    def _check_for_switch(self, identity_id: str, current_model: str):
        """Check if user switched models"""
        
        # Get last used model
        cursor = self.storage.conn.execute("""
            SELECT model_name FROM model_usage_log
            WHERE identity_id = ?
            ORDER BY timestamp DESC
            LIMIT 1 OFFSET 1
        """, (identity_id,))
        
        row = cursor.fetchone()
        if not row:
            return  # First use, no switch
        
        previous_model = row['model_name']
        
        if previous_model != current_model:
            # Log switch
            switch_id = str(uuid.uuid4())
            
            self.storage.conn.execute("""
                INSERT INTO model_switches (
                    id, identity_id, from_model, to_model,
                    switched_at, reason, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                switch_id,
                identity_id,
                previous_model,
                current_model,
                datetime.utcnow().isoformat() + 'Z',
                'user_choice',  # Default, could be inferred
                json.dumps({})
            ))
            
            self.storage.conn.commit()
    
    def get_reflection_model(self, reflection_id: str) -> Optional[Dict]:
        """Get which model generated a reflection"""
        
        cursor = self.storage.conn.execute("""
            SELECT model_name, model_version, model_provider, model_type, timestamp
            FROM model_usage_log
            WHERE reflection_id = ?
        """, (reflection_id,))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        return {
            'model_name': row['model_name'],
            'model_version': row['model_version'],
            'model_provider': row['model_provider'],
            'model_type': row['model_type'],
            'generated_at': row['timestamp']
        }
    
    def get_model_usage_history(
        self,
        identity_id: str,
        days: int = 30,
        limit: int = 100
    ) -> List[Dict]:
        """Get model usage history for a user"""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        cursor = self.storage.conn.execute("""
            SELECT 
                model_name, model_type, timestamp,
                token_count, response_time_ms
            FROM model_usage_log
            WHERE identity_id = ?
            AND timestamp >= ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (
            identity_id,
            start_date.isoformat() + 'Z',
            limit
        ))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'model_name': row['model_name'],
                'model_type': row['model_type'],
                'timestamp': row['timestamp'],
                'token_count': row['token_count'],
                'response_time_ms': row['response_time_ms']
            })
        
        return history
    
    def get_model_statistics(
        self,
        identity_id: Optional[str] = None,
        days: int = 30
    ) -> Dict:
        """
        Get statistics about model usage.
        
        Args:
            identity_id: Specific user (None = all users)
            days: Time period
        
        Returns:
            Usage statistics
        """
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Usage by model type
        query = """
            SELECT model_type, COUNT(*) as count,
                   AVG(token_count) as avg_tokens,
                   AVG(response_time_ms) as avg_response_time
            FROM model_usage_log
            WHERE timestamp >= ?
        """
        params = [start_date.isoformat() + 'Z']
        
        if identity_id:
            query += " AND identity_id = ?"
            params.append(identity_id)
        
        query += " GROUP BY model_type"
        
        cursor = self.storage.conn.execute(query, params)
        
        by_type = {}
        total_uses = 0
        
        for row in cursor.fetchall():
            by_type[row['model_type']] = {
                'count': row['count'],
                'avg_tokens': row['avg_tokens'],
                'avg_response_time_ms': row['avg_response_time']
            }
            total_uses += row['count']
        
        # Get switch count
        query = "SELECT COUNT(*) as switches FROM model_switches WHERE switched_at >= ?"
        params = [start_date.isoformat() + 'Z']
        
        if identity_id:
            query += " AND identity_id = ?"
            params.append(identity_id)
        
        cursor = self.storage.conn.execute(query, params)
        switch_count = cursor.fetchone()['switches']
        
        return {
            'period_days': days,
            'total_uses': total_uses,
            'by_model_type': by_type,
            'switches': switch_count,
            'switch_rate': switch_count / total_uses if total_uses > 0 else 0
        }
    
    def detect_unexpected_switches(
        self,
        identity_id: str,
        threshold: int = 5
    ) -> List[Dict]:
        """
        Detect unusual model switching patterns.
        
        Args:
            identity_id: User to check
            threshold: Switches per day to flag
        
        Returns:
            List of suspicious switch periods
        """
        
        # Get switches in last 30 days
        cursor = self.storage.conn.execute("""
            SELECT switched_at, from_model, to_model, reason
            FROM model_switches
            WHERE identity_id = ?
            AND switched_at >= ?
            ORDER BY switched_at ASC
        """, (
            identity_id,
            (datetime.utcnow() - timedelta(days=30)).isoformat() + 'Z'
        ))
        
        switches = cursor.fetchall()
        
        # Group by day
        by_day = defaultdict(list)
        for switch in switches:
            date = switch['switched_at'][:10]  # YYYY-MM-DD
            by_day[date].append(switch)
        
        # Find days exceeding threshold
        suspicious = []
        for date, day_switches in by_day.items():
            if len(day_switches) >= threshold:
                suspicious.append({
                    'date': date,
                    'switch_count': len(day_switches),
                    'models': list(set([s['from_model'] for s in day_switches] + [s['to_model'] for s in day_switches]))
                })
        
        return suspicious
    
    def set_model_preference(
        self,
        identity_id: str,
        preferred_model: str,
        fallback_model: Optional[str] = None,
        auto_switch_enabled: bool = False
    ):
        """
        Set user's model preferences.
        
        Args:
            identity_id: User
            preferred_model: Primary model to use
            fallback_model: Backup if primary fails
            auto_switch_enabled: Allow automatic switching
        """
        
        self.storage.conn.execute("""
            INSERT OR REPLACE INTO model_preferences (
                identity_id, preferred_model, fallback_model,
                auto_switch_enabled, updated_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            identity_id,
            preferred_model,
            fallback_model,
            1 if auto_switch_enabled else 0,
            datetime.utcnow().isoformat() + 'Z',
            json.dumps({})
        ))
        
        self.storage.conn.commit()
    
    def get_model_preference(self, identity_id: str) -> Optional[Dict]:
        """Get user's model preferences"""
        
        cursor = self.storage.conn.execute("""
            SELECT preferred_model, fallback_model, auto_switch_enabled, updated_at
            FROM model_preferences
            WHERE identity_id = ?
        """, (identity_id,))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        return {
            'preferred_model': row['preferred_model'],
            'fallback_model': row['fallback_model'],
            'auto_switch_enabled': bool(row['auto_switch_enabled']),
            'updated_at': row['updated_at']
        }
    
    def verify_model_compliance(
        self,
        identity_id: str,
        days: int = 7
    ) -> Dict:
        """
        Verify that actual usage matches user preferences.
        
        Args:
            identity_id: User to check
            days: Period to check
        
        Returns:
            Compliance report
        """
        
        # Get preference
        preference = self.get_model_preference(identity_id)
        if not preference:
            return {
                'compliant': True,
                'message': 'No preferences set'
            }
        
        preferred = preference['preferred_model']
        fallback = preference['fallback_model']
        
        # Get actual usage
        start_date = datetime.utcnow() - timedelta(days=days)
        
        cursor = self.storage.conn.execute("""
            SELECT model_name, COUNT(*) as count
            FROM model_usage_log
            WHERE identity_id = ?
            AND timestamp >= ?
            GROUP BY model_name
        """, (
            identity_id,
            start_date.isoformat() + 'Z'
        ))
        
        actual_usage = {row['model_name']: row['count'] for row in cursor.fetchall()}
        
        # Check compliance
        allowed_models = {preferred}
        if fallback:
            allowed_models.add(fallback)
        
        violations = []
        for model, count in actual_usage.items():
            if model not in allowed_models:
                violations.append({
                    'model': model,
                    'usage_count': count
                })
        
        total_uses = sum(actual_usage.values())
        preferred_uses = actual_usage.get(preferred, 0)
        
        return {
            'compliant': len(violations) == 0,
            'preferred_model': preferred,
            'preferred_usage_rate': preferred_uses / total_uses if total_uses > 0 else 0,
            'violations': violations,
            'message': 'All usage matches preferences' if len(violations) == 0 else f'{len(violations)} unauthorized model(s) used'
        }
    
    def get_model_performance_comparison(
        self,
        identity_id: Optional[str] = None,
        days: int = 30
    ) -> Dict:
        """
        Compare performance metrics across models.
        
        Args:
            identity_id: Specific user (None = all)
            days: Period to analyze
        
        Returns:
            Performance comparison
        """
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = """
            SELECT 
                model_type,
                COUNT(*) as usage_count,
                AVG(response_time_ms) as avg_response_time,
                AVG(token_count) as avg_tokens,
                MIN(response_time_ms) as min_response_time,
                MAX(response_time_ms) as max_response_time
            FROM model_usage_log
            WHERE timestamp >= ?
            AND response_time_ms IS NOT NULL
        """
        params = [start_date.isoformat() + 'Z']
        
        if identity_id:
            query += " AND identity_id = ?"
            params.append(identity_id)
        
        query += " GROUP BY model_type"
        
        cursor = self.storage.conn.execute(query, params)
        
        performance = {}
        for row in cursor.fetchall():
            performance[row['model_type']] = {
                'usage_count': row['usage_count'],
                'avg_response_time_ms': row['avg_response_time'],
                'min_response_time_ms': row['min_response_time'],
                'max_response_time_ms': row['max_response_time'],
                'avg_tokens': row['avg_tokens']
            }
        
        return {
            'period_days': days,
            'by_model_type': performance
        }
    
    def export_model_audit_log(
        self,
        output_path: str,
        identity_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ):
        """
        Export complete model usage audit log.
        
        Args:
            output_path: File path for JSON export
            identity_id: Filter by user
            start_date: Start of period
            end_date: End of period
        """
        
        query = "SELECT * FROM model_usage_log WHERE 1=1"
        params = []
        
        if identity_id:
            query += " AND identity_id = ?"
            params.append(identity_id)
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date.isoformat() + 'Z')
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date.isoformat() + 'Z')
        
        query += " ORDER BY timestamp ASC"
        
        cursor = self.storage.conn.execute(query, params)
        
        audit_data = {
            'exported_at': datetime.utcnow().isoformat() + 'Z',
            'filters': {
                'identity_id': identity_id,
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            },
            'entries': []
        }
        
        for row in cursor.fetchall():
            audit_data['entries'].append({
                'id': row['id'],
                'reflection_id': row['reflection_id'],
                'identity_id': row['identity_id'],
                'model_name': row['model_name'],
                'model_version': row['model_version'],
                'model_provider': row['model_provider'],
                'model_type': row['model_type'],
                'timestamp': row['timestamp'],
                'token_count': row['token_count'],
                'response_time_ms': row['response_time_ms'],
                'metadata': json.loads(row['metadata']) if row['metadata'] else {}
            })
        
        with open(output_path, 'w') as f:
            json.dump(audit_data, f, indent=2)
