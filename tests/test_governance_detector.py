"""
Tests for Violation Detector
============================

Tests the violation detection and reporting system.
"""

import pytest
from datetime import datetime, timedelta

from mirror_os.governance.constitutional_interpreter import (
    ConstitutionalInterpreter,
    ViolationType,
    ViolationSeverity
)
from mirror_os.governance.violation_detector import (
    ViolationDetector,
    Violation,
    ViolationReport,
    ViolationScope
)


@pytest.fixture
def interpreter():
    """Create constitutional interpreter"""
    return ConstitutionalInterpreter()


@pytest.fixture
def detector(interpreter):
    """Create violation detector"""
    return ViolationDetector(interpreter)


class TestViolationDetector:
    """Test violation detection"""
    
    def test_detector_initialization(self, detector):
        """Test detector initializes correctly"""
        assert detector is not None
        assert len(detector.detected_violations) == 0
        assert detector.violation_counter == 0
    
    def test_detect_clean_operation(self, detector):
        """Test clean operation returns None"""
        violation = detector.detect(
            action="calculate_stats",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={},
            metadata={}
        )
        
        assert violation is None
    
    def test_detect_prescriptive_violation(self, detector):
        """Test prescriptive language is detected"""
        violation = detector.detect(
            action="generate_reflection",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should try meditation"},
            metadata={}
        )
        
        assert violation is not None
        assert violation.violation_type == ViolationType.PRESCRIPTIVE
        assert violation.severity == ViolationSeverity.HARD
        assert violation.remediation_required is True
    
    def test_detect_diagnostic_violation(self, detector):
        """Test diagnostic language is detected"""
        violation = detector.detect(
            action="analyze",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "Symptoms of depression detected"},
            metadata={}
        )
        
        assert violation is not None
        assert violation.violation_type == ViolationType.DIAGNOSTIC
        assert violation.severity == ViolationSeverity.CRITICAL
    
    def test_violation_id_generation(self, detector):
        """Test violation IDs are unique and sequential"""
        v1 = detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should do this"},
            metadata={}
        )
        
        v2 = detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You must do that"},
            metadata={}
        )
        
        assert v1.violation_id == "VIO-000001"
        assert v2.violation_id == "VIO-000002"
    
    def test_violation_stored(self, detector):
        """Test violations are stored"""
        initial_count = len(detector.detected_violations)
        
        detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should do this"},
            metadata={}
        )
        
        assert len(detector.detected_violations) == initial_count + 1
    
    def test_scope_determination_local(self, detector):
        """Test local scope determination"""
        violation = detector.detect(
            action="simple_operation",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should try this"},
            metadata={}
        )
        
        assert violation.scope == ViolationScope.IDENTITY
    
    def test_scope_determination_systemic(self, detector):
        """Test systemic scope for many mirrors"""
        violation = detector.detect(
            action="train_model",
            actor="system",
            affected_mirrors=[f"mirror_{i}" for i in range(20)],
            data={},
            metadata={}
        )
        
        assert violation.scope == ViolationScope.SYSTEMIC
    
    def test_auto_remediable_detection(self, detector):
        """Test auto-remediable violations identified"""
        violation = detector.detect(
            action="generate",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should do this"},
            metadata={}
        )
        
        # Prescriptive language is auto-remediable
        assert violation.auto_remediable is True
    
    def test_generate_report(self, detector):
        """Test report generation"""
        # Create some violations
        detector.detect(
            action="test1",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should do this"},
            metadata={}
        )
        
        detector.detect(
            action="test2",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "Symptoms of disorder"},
            metadata={}
        )
        
        report = detector.generate_report()
        
        assert isinstance(report, ViolationReport)
        assert report.total_violations >= 2
        assert len(report.violations_by_type) > 0
        assert len(report.violations_by_severity) > 0
        assert 0.0 <= report.system_health_score <= 1.0
    
    def test_report_time_filtering(self, detector):
        """Test report filters by time period"""
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        
        report = detector.generate_report(
            start_time=yesterday,
            end_time=now
        )
        
        assert report.time_period_start == yesterday
        assert report.time_period_end == now
    
    def test_health_score_calculation(self, detector):
        """Test health score calculation"""
        # Perfect health with no violations
        report1 = detector.generate_report()
        initial_score = report1.system_health_score
        
        # Create critical violation
        detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "Diagnosis: depression"},
            metadata={}
        )
        
        report2 = detector.generate_report()
        
        # Health score should decrease
        assert report2.system_health_score < initial_score
    
    def test_get_violations_by_type(self, detector):
        """Test filtering violations by type"""
        # Create prescriptive violation
        detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should do this"},
            metadata={}
        )
        
        prescriptive_violations = detector.get_violations_by_type(
            ViolationType.PRESCRIPTIVE,
            limit=10
        )
        
        assert len(prescriptive_violations) >= 1
        assert all(v.violation_type == ViolationType.PRESCRIPTIVE 
                  for v in prescriptive_violations)
    
    def test_get_critical_violations(self, detector):
        """Test getting critical violations"""
        # Create critical violation
        detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "Symptoms detected"},
            metadata={}
        )
        
        critical = detector.get_critical_violations(limit=10)
        
        assert len(critical) >= 1
        assert all(v.severity == ViolationSeverity.CRITICAL for v in critical)
    
    def test_get_unresolved_violations(self, detector):
        """Test getting unresolved violations"""
        detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You must do this"},
            metadata={}
        )
        
        unresolved = detector.get_unresolved_violations()
        
        assert len(unresolved) >= 1
        assert all(v.remediation_required for v in unresolved)
    
    def test_mark_violation_resolved(self, detector):
        """Test marking violations as resolved"""
        violation = detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "You should do this"},
            metadata={}
        )
        
        assert violation.remediation_required is True
        
        success = detector.mark_violation_resolved(violation.violation_id)
        
        assert success is True
        assert violation.remediation_required is False
    
    def test_system_health_metrics(self, detector):
        """Test system health metrics"""
        health = detector.get_system_health()
        
        assert "health_score" in health
        assert "total_violations" in health
        assert "recent_violations" in health
        assert "critical_violations" in health
        assert "unresolved_violations" in health
        assert 0.0 <= health["health_score"] <= 1.0
    
    def test_recommendations_generated(self, detector):
        """Test recommendations are generated"""
        # Create multiple similar violations
        for _ in range(3):
            detector.detect(
                action="test",
                actor="system",
                affected_mirrors=["mirror_1"],
                data={"text": "You should try this"},
                metadata={}
            )
        
        report = detector.generate_report()
        
        assert len(report.recommendations) > 0


class TestAlertThresholds:
    """Test automatic alert thresholds"""
    
    def test_critical_violation_triggers_alert(self, detector):
        """Test critical violations trigger alerts"""
        # This would trigger alert in logs
        violation = detector.detect(
            action="test",
            actor="system",
            affected_mirrors=["mirror_1"],
            data={"text": "Diagnosis: condition"},
            metadata={}
        )
        
        assert violation.severity == ViolationSeverity.CRITICAL


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
