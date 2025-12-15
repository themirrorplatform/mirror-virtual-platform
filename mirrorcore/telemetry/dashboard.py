# mirrorcore/telemetry/dashboard.py
"""
Constitutional Compliance Dashboard

Real-time monitoring of constitutional health:
- Violation rates per invariant
- Drift status tracking
- Rewrite success rates
- L0 block frequency
- System integrity metrics
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class ComplianceStatus(Enum):
    """Overall compliance status"""
    HEALTHY = "healthy"  # <1 violation per 1000 checks
    MONITOR = "monitor"  # 1-5 violations per 1000
    WARNING = "warning"  # 5-10 violations per 1000
    CRITICAL = "critical"  # >10 violations per 1000


@dataclass
class InvariantStats:
    """Statistics for a single invariant"""
    invariant_id: str
    name: str
    total_checks: int
    violations: int
    blocks: int
    rewrites: int
    rewrite_success_rate: float
    violation_rate: float  # Per 1000 checks


@dataclass
class ComplianceDashboardData:
    """Complete dashboard data"""
    status: ComplianceStatus
    overall_violation_rate: float
    total_checks_24h: int
    total_violations_24h: int
    total_blocks_24h: int
    total_rewrites_24h: int
    rewrite_success_rate: float
    invariant_stats: List[InvariantStats]
    drift_status: str
    drift_alerts: List[Dict]
    recent_violations: List[Dict]
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "overall_violation_rate": round(self.overall_violation_rate, 2),
            "total_checks_24h": self.total_checks_24h,
            "total_violations_24h": self.total_violations_24h,
            "total_blocks_24h": self.total_blocks_24h,
            "total_rewrites_24h": self.total_rewrites_24h,
            "rewrite_success_rate": round(self.rewrite_success_rate, 2),
            "invariant_stats": [
                {
                    "invariant": s.invariant_id,
                    "name": s.name,
                    "checks": s.total_checks,
                    "violations": s.violations,
                    "blocks": s.blocks,
                    "rewrites": s.rewrites,
                    "rewrite_success": round(s.rewrite_success_rate, 2),
                    "violation_rate": round(s.violation_rate, 2)
                }
                for s in self.invariant_stats
            ],
            "drift_status": self.drift_status,
            "drift_alerts": self.drift_alerts,
            "recent_violations": self.recent_violations,
            "timestamp": self.timestamp.isoformat()
        }


class ConstitutionalDashboard:
    """
    Real-time constitutional compliance monitoring.
    
    Provides visibility into:
    - Per-invariant violation rates
    - System drift detection
    - Rewrite effectiveness
    - Constitutional health trends
    """
    
    INVARIANT_NAMES = {
        "I1": "Non-Prescription",
        "I2": "Identity Locality",
        "I3": "Transparent Uncertainty",
        "I4": "Non-Coercion",
        "I5": "Data Sovereignty",
        "I6": "No Fixed Teleology",
        "I7": "Architectural Honesty",
        "I8": "Objective Transparency",
        "I9": "Anti-Diagnosis",
        "I10": "Non-Complicity",
        "I11": "Historical Integrity",
        "I12": "Training Prohibition",
        "I13": "No Behavioral Optimization",
        "I14": "No Cross-Identity Inference"
    }
    
    def __init__(self, db, drift_monitor):
        """
        Initialize dashboard.
        
        Args:
            db: LocalDB instance for querying stats
            drift_monitor: DriftMonitor instance for drift tracking
        """
        self.db = db
        self.drift_monitor = drift_monitor
        
    def get_dashboard_data(self, hours: int = 24) -> ComplianceDashboardData:
        """
        Get complete dashboard data for specified time window.
        
        Args:
            hours: Time window for statistics (default 24 hours)
            
        Returns:
            ComplianceDashboardData with all metrics
        """
        # Get drift monitor stats
        drift_stats = self.drift_monitor.get_stats()
        drift_metrics = self.drift_monitor.get_metrics(window_hours=hours)
        
        # Get per-invariant stats from database
        invariant_stats = self._get_invariant_stats(hours)
        
        # Calculate totals
        total_checks = sum(s.total_checks for s in invariant_stats)
        total_violations = sum(s.violations for s in invariant_stats)
        total_blocks = sum(s.blocks for s in invariant_stats)
        total_rewrites = sum(s.rewrites for s in invariant_stats)
        
        # Calculate rates
        overall_rate = (total_violations / total_checks * 1000) if total_checks > 0 else 0.0
        rewrite_success = (
            sum(s.rewrites * s.rewrite_success_rate for s in invariant_stats) / total_rewrites
            if total_rewrites > 0 else 0.0
        )
        
        # Determine overall status
        if overall_rate < 1.0:
            status = ComplianceStatus.HEALTHY
        elif overall_rate < 5.0:
            status = ComplianceStatus.MONITOR
        elif overall_rate < 10.0:
            status = ComplianceStatus.WARNING
        else:
            status = ComplianceStatus.CRITICAL
        
        # Get recent violations for detail view
        recent_violations = self._get_recent_violations(limit=10)
        
        # Get active drift alerts
        drift_alerts = [
            alert for alert in drift_stats.get('alerts', [])
            if not alert.get('acknowledged', False)
        ]
        
        return ComplianceDashboardData(
            status=status,
            overall_violation_rate=overall_rate,
            total_checks_24h=total_checks,
            total_violations_24h=total_violations,
            total_blocks_24h=total_blocks,
            total_rewrites_24h=total_rewrites,
            rewrite_success_rate=rewrite_success,
            invariant_stats=invariant_stats,
            drift_status=drift_metrics.status.value,
            drift_alerts=drift_alerts,
            recent_violations=recent_violations,
            timestamp=datetime.utcnow()
        )
    
    def _get_invariant_stats(self, hours: int) -> List[InvariantStats]:
        """
        Get per-invariant statistics from database.
        
        Queries engine_runs table for constitutional_flags data.
        """
        stats = []
        
        # Get all engine runs in time window
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        # Query database for runs with constitutional data
        runs = self.db.execute("""
            SELECT constitutional_flags
            FROM engine_runs
            WHERE created_at >= ?
            ORDER BY created_at DESC
        """, (cutoff.isoformat(),)).fetchall()
        
        # Aggregate by invariant
        invariant_data = {
            invariant_id: {
                'checks': 0,
                'violations': 0,
                'blocks': 0,
                'rewrites': 0,
                'rewrite_successes': 0
            }
            for invariant_id in self.INVARIANT_NAMES.keys()
        }
        
        for (flags_json,) in runs:
            if not flags_json:
                continue
                
            import json
            try:
                flags = json.loads(flags_json) if isinstance(flags_json, str) else flags_json
            except:
                continue
            
            # Count by invariant
            for invariant_id in self.INVARIANT_NAMES.keys():
                invariant_data[invariant_id]['checks'] += 1
                
                # Check if this invariant was violated
                violations = flags.get('violations', [])
                for violation in violations:
                    if violation.startswith(f"{invariant_id}:"):
                        invariant_data[invariant_id]['violations'] += 1
                        break
                
                # Check if blocked
                if flags.get('l0_blocked') and any(v.startswith(f"{invariant_id}:") for v in violations):
                    invariant_data[invariant_id]['blocks'] += 1
                
                # Check if rewritten
                if flags.get('l0_rewritten'):
                    original_violations = flags.get('original_violations', [])
                    if any(v.startswith(f"{invariant_id}:") for v in original_violations):
                        invariant_data[invariant_id]['rewrites'] += 1
                        # Success if no longer violated
                        if not any(v.startswith(f"{invariant_id}:") for v in violations):
                            invariant_data[invariant_id]['rewrite_successes'] += 1
        
        # Build InvariantStats objects
        for invariant_id, data in invariant_data.items():
            rewrites = data['rewrites']
            rewrite_success_rate = (
                data['rewrite_successes'] / rewrites if rewrites > 0 else 0.0
            )
            checks = data['checks']
            violation_rate = (data['violations'] / checks * 1000) if checks > 0 else 0.0
            
            stats.append(InvariantStats(
                invariant_id=invariant_id,
                name=self.INVARIANT_NAMES[invariant_id],
                total_checks=checks,
                violations=data['violations'],
                blocks=data['blocks'],
                rewrites=rewrites,
                rewrite_success_rate=rewrite_success_rate,
                violation_rate=violation_rate
            ))
        
        return stats
    
    def _get_recent_violations(self, limit: int = 10) -> List[Dict]:
        """Get recent violations with details"""
        violations = []
        
        runs = self.db.execute("""
            SELECT 
                id,
                reflection_id,
                constitutional_flags,
                created_at
            FROM engine_runs
            WHERE json_extract(constitutional_flags, '$.violations') IS NOT NULL
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        
        import json
        for run_id, reflection_id, flags_json, created_at in runs:
            try:
                flags = json.loads(flags_json) if isinstance(flags_json, str) else flags_json
                violation_list = flags.get('violations', [])
                
                if violation_list:
                    violations.append({
                        'run_id': run_id,
                        'reflection_id': reflection_id,
                        'violations': violation_list[:3],  # First 3
                        'severity': flags.get('severity', 'unknown'),
                        'blocked': flags.get('l0_blocked', False),
                        'timestamp': created_at
                    })
            except:
                continue
        
        return violations
    
    def get_health_summary(self) -> Dict[str, Any]:
        """
        Get quick health check summary.
        
        Returns:
            Dict with overall health indicators
        """
        dashboard = self.get_dashboard_data(hours=24)
        
        return {
            'status': dashboard.status.value,
            'violation_rate_24h': dashboard.overall_violation_rate,
            'drift_status': dashboard.drift_status,
            'active_alerts': len(dashboard.drift_alerts),
            'blocks_24h': dashboard.total_blocks_24h,
            'rewrite_success_rate': dashboard.rewrite_success_rate,
            'timestamp': dashboard.timestamp.isoformat()
        }
