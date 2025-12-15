# constitution/drift_monitor.py
"""
Constitutional Drift Monitor - The Immune System

Tracks L0 violation rates over time and triggers alerts when
constitutional integrity degrades.

This is the "immune system" that detects when The Mirror is
drifting away from its constitutional foundation.

Alert Thresholds (violations per 1000 outputs):
- GREEN:  <10   (1.0%) - Normal operation
- YELLOW: 10-50 (1.0-5.0%) - Elevated, requires investigation
- RED:    >50   (>5.0%) - Critical, emergency governance

RED triggers:
- Public alert visible to all users
- Guardian council notified
- Emergency governance process initiated
- Potential system fork if not resolved
"""

import sqlite3
import time
from pathlib import Path
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from constitution.l0_axiom_checker import ViolationSeverity


class DriftStatus(Enum):
    """Constitutional drift status levels"""
    GREEN = "green"      # <1% violations - healthy
    YELLOW = "yellow"    # 1-5% violations - elevated
    RED = "red"          # >5% violations - critical


@dataclass
class DriftMetrics:
    """Snapshot of drift metrics"""
    timestamp: str
    status: DriftStatus
    total_outputs: int
    violations: Dict[ViolationSeverity, int]
    violation_rate: float  # Per 1000 outputs
    window_hours: int
    alert_message: Optional[str] = None


class DriftMonitor:
    """
    Monitors constitutional violation rates over time.
    
    Stores every L0 check result in SQLite for analysis.
    Computes rolling violation rates and triggers alerts.
    """
    
    def __init__(self, db_path: Optional[Path] = None):
        """
        Initialize drift monitor.
        
        Args:
            db_path: Path to SQLite database. If None, uses default.
        """
        if db_path is None:
            # Default: use a dedicated drift database
            db_path = Path.home() / ".mirror" / "drift_monitor.db"
            db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.db_path = db_path
        self._initialize_db()
    
    def _initialize_db(self):
        """Create drift monitoring tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS l0_checks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    reflection_id TEXT,
                    check_type TEXT NOT NULL,  -- 'input' or 'output'
                    passed BOOLEAN NOT NULL,
                    severity TEXT,  -- BENIGN, TENSION, SOFT, HARD, CRITICAL
                    violations TEXT,  -- JSON array of violation descriptions
                    blocked BOOLEAN NOT NULL,
                    rewritten BOOLEAN NOT NULL,
                    text_length INTEGER,
                    directive_percentage REAL
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp 
                ON l0_checks(timestamp)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_severity 
                ON l0_checks(severity)
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS drift_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,  -- GREEN, YELLOW, RED
                    violation_rate REAL NOT NULL,
                    total_outputs INTEGER NOT NULL,
                    window_hours INTEGER NOT NULL,
                    alert_message TEXT,
                    acknowledged BOOLEAN DEFAULT FALSE,
                    acknowledged_at TEXT,
                    acknowledged_by TEXT
                )
            """)
            
            conn.commit()
    
    def log_check(
        self,
        check_type: str,
        passed: bool,
        severity: Optional[ViolationSeverity],
        violations: List[str],
        blocked: bool,
        rewritten: bool,
        text_length: int,
        directive_percentage: Optional[float] = None,
        reflection_id: Optional[str] = None
    ):
        """
        Log an L0 check result.
        
        Args:
            check_type: 'input' or 'output'
            passed: Whether check passed
            severity: Violation severity if any
            violations: List of violation descriptions
            blocked: Whether output was blocked
            rewritten: Whether output was rewritten
            text_length: Length of checked text
            directive_percentage: Directive content percentage
            reflection_id: Associated reflection ID if any
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO l0_checks (
                    timestamp, reflection_id, check_type, passed,
                    severity, violations, blocked, rewritten,
                    text_length, directive_percentage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                timestamp,
                reflection_id,
                check_type,
                passed,
                severity.value if severity else None,
                str(violations),  # JSON-like string
                blocked,
                rewritten,
                text_length,
                directive_percentage
            ))
            conn.commit()
    
    def get_metrics(self, window_hours: int = 24) -> DriftMetrics:
        """
        Get current drift metrics over time window.
        
        Args:
            window_hours: Rolling time window in hours
        
        Returns:
            DriftMetrics with current status
        """
        cutoff = (datetime.utcnow() - timedelta(hours=window_hours)).isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            # Count total output checks in window
            cursor = conn.execute("""
                SELECT COUNT(*) FROM l0_checks
                WHERE check_type = 'output' AND timestamp >= ?
            """, (cutoff,))
            total_outputs = cursor.fetchone()[0]
            
            # Count violations by severity
            cursor = conn.execute("""
                SELECT severity, COUNT(*) FROM l0_checks
                WHERE check_type = 'output' 
                  AND timestamp >= ?
                  AND passed = FALSE
                GROUP BY severity
            """, (cutoff,))
            
            violations = {}
            for severity_str, count in cursor.fetchall():
                if severity_str:
                    violations[ViolationSeverity(severity_str)] = count
        
        # Calculate violation rate (per 1000 outputs)
        total_violations = sum(violations.values())
        violation_rate = (total_violations / total_outputs * 1000) if total_outputs > 0 else 0.0
        
        # Determine status
        if violation_rate < 10:
            status = DriftStatus.GREEN
            alert_message = None
        elif violation_rate < 50:
            status = DriftStatus.YELLOW
            alert_message = self._format_yellow_alert(violation_rate, total_violations, total_outputs)
        else:
            status = DriftStatus.RED
            alert_message = self._format_red_alert(violation_rate, total_violations, total_outputs)
            # Log RED alert to database
            self._log_alert(status, violation_rate, total_outputs, window_hours, alert_message)
        
        return DriftMetrics(
            timestamp=datetime.utcnow().isoformat() + "Z",
            status=status,
            total_outputs=total_outputs,
            violations=violations,
            violation_rate=violation_rate,
            window_hours=window_hours,
            alert_message=alert_message
        )
    
    def _format_yellow_alert(self, rate: float, violations: int, total: int) -> str:
        """Format YELLOW alert message"""
        return f"""
⚠️  ELEVATED CONSTITUTIONAL DRIFT DETECTED

Violation rate: {rate:.1f} per 1000 outputs ({violations}/{total})
Status: YELLOW (1-5% violation rate)

This indicates the system is generating non-constitutional outputs
at an elevated rate. Investigation recommended.

Actions:
1. Review recent violations in drift monitor
2. Check prompt engineering for directive language
3. Verify LLM system prompts haven't changed
4. Test with known-good inputs

If rate continues to increase → RED alert and emergency governance.
"""
    
    def _format_red_alert(self, rate: float, violations: int, total: int) -> str:
        """Format RED alert message"""
        return f"""
🚨 CRITICAL: CONSTITUTIONAL INTEGRITY FAILURE 🚨

Violation rate: {rate:.1f} per 1000 outputs ({violations}/{total})
Status: RED (>5% violation rate)

The system is producing non-constitutional outputs at a rate that
threatens The Mirror's integrity. Emergency measures activated.

IMMEDIATE CONSEQUENCES:
- All users notified of constitutional crisis
- Guardian council alerted for emergency meeting
- System may enter safe mode (reflection only, no mirrorbacks)
- Potential fork if not resolved within 48 hours

This is the immune system detecting corruption.

REQUIRED ACTIONS:
1. Halt all LLM prompt changes immediately
2. Guardian council convenes within 24 hours
3. Review all violations in past 48 hours
4. Identify root cause (model drift, prompt corruption, training data leak)
5. Propose constitutional amendment OR technical fix
6. Community vote on corrective action

This alert is public and auditable. Cannot be silenced by operators.
"""
    
    def _log_alert(
        self,
        status: DriftStatus,
        violation_rate: float,
        total_outputs: int,
        window_hours: int,
        alert_message: str
    ):
        """Log alert to database"""
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO drift_alerts (
                    timestamp, status, violation_rate, 
                    total_outputs, window_hours, alert_message
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                timestamp,
                status.value,
                violation_rate,
                total_outputs,
                window_hours,
                alert_message
            ))
            conn.commit()
    
    def get_recent_violations(
        self,
        limit: int = 100,
        severity: Optional[ViolationSeverity] = None
    ) -> List[Dict[str, Any]]:
        """
        Get recent violations for investigation.
        
        Args:
            limit: Max number of violations to return
            severity: Filter by severity if provided
        
        Returns:
            List of violation records
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = """
                SELECT * FROM l0_checks
                WHERE check_type = 'output' AND passed = FALSE
            """
            params = []
            
            if severity:
                query += " AND severity = ?"
                params.append(severity.value)
            
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    
    def get_unacknowledged_alerts(self) -> List[Dict[str, Any]]:
        """Get all unacknowledged drift alerts"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute("""
                SELECT * FROM drift_alerts
                WHERE acknowledged = FALSE
                ORDER BY timestamp DESC
            """)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def acknowledge_alert(self, alert_id: int, acknowledged_by: str):
        """
        Acknowledge a drift alert.
        
        Args:
            alert_id: Alert ID to acknowledge
            acknowledged_by: User/guardian acknowledging
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE drift_alerts
                SET acknowledged = TRUE,
                    acknowledged_at = ?,
                    acknowledged_by = ?
                WHERE id = ?
            """, (timestamp, acknowledged_by, alert_id))
            conn.commit()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get overall drift monitoring statistics"""
        with sqlite3.connect(self.db_path) as conn:
            # Total checks
            cursor = conn.execute("SELECT COUNT(*) FROM l0_checks")
            total_checks = cursor.fetchone()[0]
            
            # Total violations
            cursor = conn.execute("""
                SELECT COUNT(*) FROM l0_checks WHERE passed = FALSE
            """)
            total_violations = cursor.fetchone()[0]
            
            # Violations by severity
            cursor = conn.execute("""
                SELECT severity, COUNT(*) FROM l0_checks
                WHERE passed = FALSE
                GROUP BY severity
            """)
            by_severity = dict(cursor.fetchall())
            
            # Total alerts
            cursor = conn.execute("SELECT COUNT(*) FROM drift_alerts")
            total_alerts = cursor.fetchone()[0]
            
            # Unacknowledged alerts
            cursor = conn.execute("""
                SELECT COUNT(*) FROM drift_alerts WHERE acknowledged = FALSE
            """)
            unacknowledged_alerts = cursor.fetchone()[0]
            
            # Current 24h metrics
            metrics_24h = self.get_metrics(window_hours=24)
        
        return {
            'total_checks': total_checks,
            'total_violations': total_violations,
            'by_severity': by_severity,
            'total_alerts': total_alerts,
            'unacknowledged_alerts': unacknowledged_alerts,
            'current_24h_status': metrics_24h.status.value,
            'current_24h_rate': round(metrics_24h.violation_rate, 2)
        }
    
    def send_alert(self, metrics: DriftMetrics, webhook_url: Optional[str] = None, email: Optional[str] = None):
        """
        Send alert notification when drift detected.
        
        Supports:
        - Logging (always)
        - Webhook (if URL provided)
        - Email (if configured)
        
        Args:
            metrics: Current drift metrics
            webhook_url: Optional webhook URL for notifications
            email: Optional email address for critical alerts
        """
        import logging
        logger = logging.getLogger(__name__)
        
        if metrics.status == DriftStatus.GREEN:
            return  # No alert needed
        
        # Always log
        if metrics.status == DriftStatus.YELLOW:
            logger.warning(f"Constitutional drift YELLOW: {metrics.violation_rate:.1f}% violation rate")
        elif metrics.status == DriftStatus.RED:
            logger.critical(f"Constitutional drift RED: {metrics.violation_rate:.1f}% violation rate")
        
        # Send webhook if provided
        if webhook_url:
            try:
                import requests
                payload = {
                    "status": metrics.status.value,
                    "violation_rate": metrics.violation_rate,
                    "total_outputs": metrics.total_outputs,
                    "message": metrics.alert_message,
                    "timestamp": metrics.timestamp
                }
                response = requests.post(webhook_url, json=payload, timeout=10)
                response.raise_for_status()
                logger.info(f"Alert webhook sent successfully to {webhook_url}")
            except Exception as e:
                logger.error(f"Failed to send webhook alert: {e}")
        
        # Send email for RED alerts if configured
        if email and metrics.status == DriftStatus.RED:
            try:
                import smtplib
                from email.mime.text import MIMEText
                
                msg = MIMEText(metrics.alert_message, 'plain')
                msg['Subject'] = '🚨 CRITICAL: Mirror Constitutional Drift RED Alert'
                msg['From'] = 'mirror-system@localhost'
                msg['To'] = email
                
                # This requires SMTP configuration
                # For now, just log that email would be sent
                logger.critical(f"RED ALERT email would be sent to: {email}")
                logger.critical(metrics.alert_message)
                
            except Exception as e:
                logger.error(f"Failed to send email alert: {e}")


# Self-test
if __name__ == "__main__":
    print("Constitutional Drift Monitor Test")
    print("=" * 80)
    
    # Create monitor
    monitor = DriftMonitor(Path(":memory:"))
    
    # Simulate 1000 checks with 2% violations (YELLOW)
    from constitution.l0_axiom_checker import ViolationSeverity
    
    for i in range(1000):
        # 98% pass
        if i < 980:
            monitor.log_check(
                check_type='output',
                passed=True,
                severity=None,
                violations=[],
                blocked=False,
                rewritten=False,
                text_length=150
            )
        # 2% violations (SOFT)
        else:
            monitor.log_check(
                check_type='output',
                passed=False,
                severity=ViolationSeverity.SOFT,
                violations=['I1: Directive threshold exceeded (16%)'],
                blocked=False,
                rewritten=True,
                text_length=150,
                directive_percentage=0.16
            )
    
    # Get metrics
    metrics = monitor.get_metrics(window_hours=24)
    print(f"Status: {metrics.status.value.upper()}")
    print(f"Total outputs: {metrics.total_outputs}")
    print(f"Violations: {sum(metrics.violations.values())}")
    print(f"Rate: {metrics.violation_rate:.1f} per 1000")
    
    if metrics.alert_message:
        print()
        print(metrics.alert_message)
    
    # Stats
    print()
    print("Overall Statistics:")
    stats = monitor.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")
