"""
Analytics Dashboard Backend
Differential privacy for aggregate metrics

Provides system-wide analytics while preserving individual privacy.
"""
from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import sqlite3
import hashlib
from decimal import Decimal
import random


@dataclass
class SystemMetrics:
    """Aggregate system health metrics"""
    timestamp: str
    total_instances: int
    active_instances_24h: int
    total_reflections: int
    reflections_today: int
    avg_reflections_per_user: float
    constitutional_violations: int
    violation_rate: float
    total_certifications: int
    certifications_today: int
    guardian_count: int
    worker_count: int


@dataclass
class WorkerPerformance:
    """Worker effectiveness metrics"""
    worker_id: str
    worker_name: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    avg_execution_time_ms: float
    constitutional_violations: int


@dataclass
class GovernanceMetrics:
    """Guardian Council activity"""
    total_proposals: int
    active_proposals: int
    approved_proposals: int
    rejected_proposals: int
    avg_voting_time_hours: float
    guardian_participation_rate: float
    threshold_met_first_vote_pct: float


class DifferentialPrivacy:
    """
    Differential privacy mechanisms for aggregate queries
    
    Adds calibrated noise to protect individual privacy while
    maintaining statistical utility for aggregate analysis.
    """
    
    @staticmethod
    def laplace_mechanism(
        true_value: float,
        sensitivity: float,
        epsilon: float
    ) -> float:
        """
        Add Laplacian noise for differential privacy
        
        Args:
            true_value: True aggregate value
            sensitivity: Query sensitivity (max change from adding/removing one user)
            epsilon: Privacy budget (smaller = more privacy, more noise)
        
        Returns:
            Noisy value that preserves epsilon-differential privacy
        """
        scale = sensitivity / epsilon
        noise = random.laplace(0, scale)
        return true_value + noise
    
    @staticmethod
    def count_with_privacy(
        true_count: int,
        epsilon: float = 0.1
    ) -> int:
        """Count query with differential privacy"""
        # Sensitivity = 1 (adding/removing one record changes count by 1)
        noisy_count = DifferentialPrivacy.laplace_mechanism(
            float(true_count),
            sensitivity=1.0,
            epsilon=epsilon
        )
        return max(0, int(round(noisy_count)))
    
    @staticmethod
    def average_with_privacy(
        true_average: float,
        count: int,
        value_range: tuple,
        epsilon: float = 0.1
    ) -> float:
        """Average query with differential privacy"""
        # Sensitivity = range / count
        min_val, max_val = value_range
        sensitivity = (max_val - min_val) / count if count > 0 else 0
        
        noisy_avg = DifferentialPrivacy.laplace_mechanism(
            true_average,
            sensitivity=sensitivity,
            epsilon=epsilon
        )
        
        return max(min_val, min(max_val, noisy_avg))


class AnalyticsDashboard:
    """Analytics backend with differential privacy"""
    
    def __init__(self, event_log_path: str = "mirror_events.db"):
        self.event_log_path = event_log_path
        self.privacy = DifferentialPrivacy()
    
    def get_system_metrics(
        self,
        with_privacy: bool = True,
        epsilon: float = 0.1
    ) -> SystemMetrics:
        """
        Get system-wide metrics
        
        Args:
            with_privacy: Apply differential privacy
            epsilon: Privacy budget
        
        Returns:
            SystemMetrics with aggregate data
        """
        conn = sqlite3.connect(self.event_log_path)
        cursor = conn.cursor()
        
        # Total instances (unique users)
        cursor.execute("""
        SELECT COUNT(DISTINCT instance_id)
        FROM events
        """)
        total_instances = cursor.fetchone()[0]
        
        # Active instances in last 24 hours
        yesterday = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        cursor.execute("""
        SELECT COUNT(DISTINCT instance_id)
        FROM events
        WHERE timestamp > ?
        """, (yesterday,))
        active_instances_24h = cursor.fetchone()[0]
        
        # Total reflections
        cursor.execute("""
        SELECT COUNT(*)
        FROM events
        WHERE event_type = 'reflection_created'
        """)
        total_reflections = cursor.fetchone()[0]
        
        # Reflections today
        today = datetime.utcnow().date().isoformat()
        cursor.execute("""
        SELECT COUNT(*)
        FROM events
        WHERE event_type = 'reflection_created'
        AND date(timestamp) = date(?)
        """, (today,))
        reflections_today = cursor.fetchone()[0]
        
        # Average reflections per user
        avg_reflections = total_reflections / total_instances if total_instances > 0 else 0
        
        # Constitutional violations (from Safety Worker)
        cursor.execute("""
        SELECT COUNT(*)
        FROM events
        WHERE event_data LIKE '%constitutional_violation%'
        """)
        violations = cursor.fetchone()[0]
        
        violation_rate = violations / total_reflections if total_reflections > 0 else 0
        
        conn.close()
        
        # Apply differential privacy if requested
        if with_privacy:
            total_instances = self.privacy.count_with_privacy(total_instances, epsilon)
            active_instances_24h = self.privacy.count_with_privacy(active_instances_24h, epsilon)
            total_reflections = self.privacy.count_with_privacy(total_reflections, epsilon)
            reflections_today = self.privacy.count_with_privacy(reflections_today, epsilon)
            avg_reflections = self.privacy.average_with_privacy(
                avg_reflections, total_instances, (0, 1000), epsilon
            )
            violations = self.privacy.count_with_privacy(violations, epsilon)
            violation_rate = violations / total_reflections if total_reflections > 0 else 0
        
        return SystemMetrics(
            timestamp=datetime.utcnow().isoformat(),
            total_instances=total_instances,
            active_instances_24h=active_instances_24h,
            total_reflections=total_reflections,
            reflections_today=reflections_today,
            avg_reflections_per_user=avg_reflections,
            constitutional_violations=violations,
            violation_rate=violation_rate,
            total_certifications=0,  # TODO: Query from guardian_service
            certifications_today=0,
            guardian_count=0,  # TODO: Query from multi_guardian
            worker_count=0  # TODO: Query from worker_framework
        )
    
    def get_worker_performance(
        self,
        with_privacy: bool = True,
        epsilon: float = 0.1
    ) -> List[WorkerPerformance]:
        """
        Get performance metrics for all workers
        
        Returns:
            List of WorkerPerformance objects
        """
        # TODO: Query worker execution logs
        # For now, return example data
        
        workers = [
            WorkerPerformance(
                worker_id="worker-safety",
                worker_name="Safety Worker",
                total_executions=1000,
                successful_executions=995,
                failed_executions=5,
                success_rate=0.995,
                avg_execution_time_ms=150.0,
                constitutional_violations=45
            ),
            WorkerPerformance(
                worker_id="worker-pattern",
                worker_name="Pattern Detector",
                total_executions=800,
                successful_executions=790,
                failed_executions=10,
                success_rate=0.9875,
                avg_execution_time_ms=230.0,
                constitutional_violations=0
            )
        ]
        
        # Apply privacy
        if with_privacy:
            for worker in workers:
                worker.total_executions = self.privacy.count_with_privacy(
                    worker.total_executions, epsilon
                )
                worker.successful_executions = self.privacy.count_with_privacy(
                    worker.successful_executions, epsilon
                )
                worker.success_rate = worker.successful_executions / worker.total_executions
        
        return workers
    
    def get_governance_metrics(
        self,
        with_privacy: bool = True,
        epsilon: float = 0.1
    ) -> GovernanceMetrics:
        """Get Guardian Council governance metrics"""
        # TODO: Query from multi_guardian.py
        # For now, return example data
        
        metrics = GovernanceMetrics(
            total_proposals=15,
            active_proposals=3,
            approved_proposals=10,
            rejected_proposals=2,
            avg_voting_time_hours=36.5,
            guardian_participation_rate=0.92,
            threshold_met_first_vote_pct=0.67
        )
        
        if with_privacy:
            metrics.total_proposals = self.privacy.count_with_privacy(
                metrics.total_proposals, epsilon
            )
            metrics.active_proposals = self.privacy.count_with_privacy(
                metrics.active_proposals, epsilon
            )
        
        return metrics
    
    def get_usage_trends(
        self,
        days: int = 30,
        with_privacy: bool = True,
        epsilon: float = 0.1
    ) -> List[Dict[str, Any]]:
        """
        Get daily usage trends
        
        Returns:
            List of daily metrics
        """
        conn = sqlite3.connect(self.event_log_path)
        cursor = conn.cursor()
        
        trends = []
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).date().isoformat()
            
            # Reflections on this day
            cursor.execute("""
            SELECT COUNT(*)
            FROM events
            WHERE event_type = 'reflection_created'
            AND date(timestamp) = date(?)
            """, (date,))
            
            reflections = cursor.fetchone()[0]
            
            # Active users on this day
            cursor.execute("""
            SELECT COUNT(DISTINCT instance_id)
            FROM events
            WHERE date(timestamp) = date(?)
            """, (date,))
            
            active_users = cursor.fetchone()[0]
            
            if with_privacy:
                reflections = self.privacy.count_with_privacy(reflections, epsilon)
                active_users = self.privacy.count_with_privacy(active_users, epsilon)
            
            trends.append({
                "date": date,
                "reflections": reflections,
                "active_users": active_users
            })
        
        conn.close()
        return trends
    
    def get_modality_distribution(
        self,
        with_privacy: bool = True,
        epsilon: float = 0.1
    ) -> Dict[str, int]:
        """Get distribution of reflection modalities"""
        conn = sqlite3.connect(self.event_log_path)
        cursor = conn.cursor()
        
        # Count by modality
        cursor.execute("""
        SELECT 
            json_extract(event_data, '$.modality') as modality,
            COUNT(*) as count
        FROM events
        WHERE event_type = 'reflection_created'
        GROUP BY modality
        """)
        
        distribution = {}
        for row in cursor.fetchall():
            modality = row[0] or "text"
            count = row[1]
            
            if with_privacy:
                count = self.privacy.count_with_privacy(count, epsilon)
            
            distribution[modality] = count
        
        conn.close()
        return distribution
    
    def get_constitutional_compliance(
        self,
        with_privacy: bool = True,
        epsilon: float = 0.1
    ) -> Dict[str, Any]:
        """Get constitutional compliance metrics"""
        conn = sqlite3.connect(self.event_log_path)
        cursor = conn.cursor()
        
        # Total reflections
        cursor.execute("""
        SELECT COUNT(*)
        FROM events
        WHERE event_type = 'reflection_created'
        """)
        total = cursor.fetchone()[0]
        
        # Violations
        cursor.execute("""
        SELECT COUNT(*)
        FROM events
        WHERE event_data LIKE '%constitutional_violation%'
        """)
        violations = cursor.fetchone()[0]
        
        # Violation types (if tracked)
        violation_types = {
            "prescription": 0,
            "normative_judgment": 0,
            "engagement_optimization": 0,
            "hidden_inference": 0
        }
        
        if with_privacy:
            total = self.privacy.count_with_privacy(total, epsilon)
            violations = self.privacy.count_with_privacy(violations, epsilon)
        
        compliance_rate = 1.0 - (violations / total) if total > 0 else 1.0
        
        conn.close()
        
        return {
            "total_reflections": total,
            "constitutional_violations": violations,
            "compliance_rate": compliance_rate,
            "violation_types": violation_types
        }


# Example usage
if __name__ == "__main__":
    dashboard = AnalyticsDashboard()
    
    # System metrics
    metrics = dashboard.get_system_metrics(with_privacy=True, epsilon=0.1)
    print("System Metrics (with differential privacy)")
    print(f"Total instances: {metrics.total_instances}")
    print(f"Active (24h): {metrics.active_instances_24h}")
    print(f"Total reflections: {metrics.total_reflections}")
    print(f"Reflections today: {metrics.reflections_today}")
    print(f"Avg reflections/user: {metrics.avg_reflections_per_user:.2f}")
    print(f"Constitutional violations: {metrics.constitutional_violations}")
    print(f"Violation rate: {metrics.violation_rate:.2%}")
    
    # Worker performance
    print("\nWorker Performance")
    workers = dashboard.get_worker_performance(with_privacy=True)
    for worker in workers:
        print(f"{worker.worker_name}: {worker.success_rate:.2%} success, {worker.avg_execution_time_ms:.0f}ms avg")
    
    # Governance
    governance = dashboard.get_governance_metrics(with_privacy=True)
    print(f"\nGovernance Metrics")
    print(f"Total proposals: {governance.total_proposals}")
    print(f"Approval rate: {governance.approved_proposals / governance.total_proposals:.2%}")
    print(f"Guardian participation: {governance.guardian_participation_rate:.2%}")
    
    # Constitutional compliance
    compliance = dashboard.get_constitutional_compliance(with_privacy=True)
    print(f"\nConstitutional Compliance")
    print(f"Compliance rate: {compliance['compliance_rate']:.2%}")
    print(f"Violations: {compliance['constitutional_violations']}")
    
    # Usage trends
    trends = dashboard.get_usage_trends(days=7, with_privacy=True)
    print(f"\n7-Day Usage Trends")
    for trend in trends[:3]:  # Show last 3 days
        print(f"{trend['date']}: {trend['reflections']} reflections, {trend['active_users']} users")
