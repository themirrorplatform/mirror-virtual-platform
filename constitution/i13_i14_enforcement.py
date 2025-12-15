# constitution/i13_i14_enforcement.py
"""
I13 & I14 Enforcement: Telemetry & Research Constraints

I13: Only Constitutional Compliance Telemetry
- Whitelist: constitutional_compliance, response_latency, error_rate
- Forbidden: mood_tracking, behavior_change, goal_achievement, retention_metrics

I14: K-Anonymity for Research (k ≥ 10)
- Timestamp coarsening (nearest hour)
- Feature abstraction (prevent rare combinations)
- Aggregation verification
"""

from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class TelemetryCategory(Enum):
    """Telemetry metric categories"""
    ALLOWED = "allowed"
    FORBIDDEN = "forbidden"


@dataclass
class TelemetryCheck:
    """Result of telemetry validation"""
    allowed: bool
    metric_name: str
    category: TelemetryCategory
    reason: Optional[str] = None


@dataclass
class KAnonymityCheck:
    """Result of k-anonymity validation"""
    passed: bool
    k_value: int
    required_k: int = 10
    violations: List[str] = None
    
    def __post_init__(self):
        if self.violations is None:
            self.violations = []


class I13TelemetryEnforcement:
    """
    I13: Constitutional Compliance Telemetry Only
    
    Whitelist approach - only specific metrics allowed.
    All others are forbidden by default.
    """
    
    # Explicitly allowed metrics
    ALLOWED_METRICS = {
        'constitutional_compliance',
        'response_latency',
        'error_rate',
        'availability',
        'api_response_time',
        'database_query_time',
        'cache_hit_rate',
        'sync_success_rate',
        'export_count',
        'constitutional_violation_count',
        'l0_check_pass_rate',
        'l1_tier1_blocks',
        'l1_tier2_flags',
        'drift_alert_count',
    }
    
    # Explicitly forbidden patterns (examples of what NOT to track)
    FORBIDDEN_PATTERNS = [
        'mood', 'emotion', 'sentiment', 'affect',
        'behavior', 'habit', 'routine', 'pattern',
        'goal', 'achievement', 'progress', 'milestone',
        'retention', 'engagement', 'stickiness', 'churn',
        'frequency', 'duration', 'session_length',
        'theme_evolution', 'identity_change', 'growth',
        'user_satisfaction', 'nps', 'rating',
        'content_type', 'topic_distribution',
    ]
    
    def check_metric(self, metric_name: str) -> TelemetryCheck:
        """
        Check if a telemetry metric is allowed.
        
        Args:
            metric_name: Name of the metric to check
        
        Returns:
            TelemetryCheck with validation result
        """
        metric_lower = metric_name.lower()
        
        # Check whitelist first
        if metric_lower in self.ALLOWED_METRICS:
            return TelemetryCheck(
                allowed=True,
                metric_name=metric_name,
                category=TelemetryCategory.ALLOWED
            )
        
        # Check forbidden patterns
        for forbidden in self.FORBIDDEN_PATTERNS:
            if forbidden in metric_lower:
                return TelemetryCheck(
                    allowed=False,
                    metric_name=metric_name,
                    category=TelemetryCategory.FORBIDDEN,
                    reason=f"Contains forbidden pattern: '{forbidden}'"
                )
        
        # If not explicitly allowed, it's forbidden (whitelist approach)
        return TelemetryCheck(
            allowed=False,
            metric_name=metric_name,
            category=TelemetryCategory.FORBIDDEN,
            reason="Not in allowed metrics whitelist"
        )
    
    def validate_telemetry_batch(
        self, 
        metrics: Dict[str, Any]
    ) -> Dict[str, TelemetryCheck]:
        """
        Validate a batch of telemetry metrics.
        
        Args:
            metrics: Dict of metric_name -> value
        
        Returns:
            Dict of metric_name -> TelemetryCheck
        """
        results = {}
        for metric_name in metrics.keys():
            results[metric_name] = self.check_metric(metric_name)
        return results
    
    def filter_allowed_metrics(
        self, 
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Filter metrics to only allowed ones.
        
        Args:
            metrics: Dict of metric_name -> value
        
        Returns:
            Dict with only allowed metrics
        """
        allowed = {}
        for metric_name, value in metrics.items():
            check = self.check_metric(metric_name)
            if check.allowed:
                allowed[metric_name] = value
        return allowed


class I14KAnonymityEnforcement:
    """
    I14: K-Anonymity for Research (k ≥ 10)
    
    Ensures any research data export has at least 10 identical records
    on quasi-identifiers.
    """
    
    def __init__(self, min_k: int = 10):
        """
        Initialize k-anonymity enforcement.
        
        Args:
            min_k: Minimum k value (default: 10)
        """
        self.min_k = min_k
    
    def coarsen_timestamp(
        self, 
        timestamp: datetime,
        granularity: str = 'hour'
    ) -> datetime:
        """
        Coarsen timestamp to reduce precision.
        
        Args:
            timestamp: Original timestamp
            granularity: 'hour', 'day', or 'week'
        
        Returns:
            Coarsened timestamp
        """
        if granularity == 'hour':
            return timestamp.replace(minute=0, second=0, microsecond=0)
        elif granularity == 'day':
            return timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        elif granularity == 'week':
            # Start of week (Monday)
            days_since_monday = timestamp.weekday()
            week_start = timestamp - timedelta(days=days_since_monday)
            return week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            raise ValueError(f"Invalid granularity: {granularity}")
    
    def abstract_feature(
        self, 
        value: Any, 
        feature_type: str
    ) -> Any:
        """
        Abstract a feature to reduce specificity.
        
        Args:
            value: Feature value
            feature_type: Type of feature ('age', 'location', 'numeric')
        
        Returns:
            Abstracted value
        """
        if feature_type == 'age':
            # Age ranges: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
            if isinstance(value, int):
                if value < 25:
                    return '18-24'
                elif value < 35:
                    return '25-34'
                elif value < 45:
                    return '35-44'
                elif value < 55:
                    return '45-54'
                elif value < 65:
                    return '55-64'
                else:
                    return '65+'
        
        elif feature_type == 'location':
            # Only country, no city/state
            if isinstance(value, str):
                parts = value.split(',')
                return parts[-1].strip()  # Last part is usually country
        
        elif feature_type == 'numeric':
            # Round to nearest 10
            if isinstance(value, (int, float)):
                return round(value / 10) * 10
        
        return value
    
    def check_k_anonymity(
        self,
        records: List[Dict[str, Any]],
        quasi_identifiers: List[str]
    ) -> KAnonymityCheck:
        """
        Check if dataset satisfies k-anonymity.
        
        Args:
            records: List of records to check
            quasi_identifiers: List of field names that are quasi-identifiers
        
        Returns:
            KAnonymityCheck with validation result
        """
        if not records:
            return KAnonymityCheck(
                passed=False,
                k_value=0,
                required_k=self.min_k,
                violations=['No records provided']
            )
        
        # Group records by quasi-identifier combinations
        groups: Dict[tuple, List[Dict]] = {}
        
        for record in records:
            # Create tuple of quasi-identifier values
            qi_values = tuple(
                record.get(qi, None) for qi in quasi_identifiers
            )
            
            if qi_values not in groups:
                groups[qi_values] = []
            groups[qi_values].append(record)
        
        # Find minimum group size
        min_group_size = min(len(group) for group in groups.values())
        
        # Check if all groups meet k threshold
        violations = []
        for qi_values, group in groups.items():
            if len(group) < self.min_k:
                qi_str = ', '.join(f"{qi}={val}" for qi, val in zip(quasi_identifiers, qi_values))
                violations.append(
                    f"Group ({qi_str}) has only {len(group)} records (need {self.min_k})"
                )
        
        return KAnonymityCheck(
            passed=(min_group_size >= self.min_k),
            k_value=min_group_size,
            required_k=self.min_k,
            violations=violations
        )
    
    def prepare_research_export(
        self,
        records: List[Dict[str, Any]],
        quasi_identifiers: List[str],
        feature_types: Optional[Dict[str, str]] = None
    ) -> tuple[List[Dict[str, Any]], KAnonymityCheck]:
        """
        Prepare records for research export with k-anonymity.
        
        Args:
            records: Original records
            quasi_identifiers: Fields that are quasi-identifiers
            feature_types: Optional dict mapping field names to types for abstraction
        
        Returns:
            Tuple of (prepared_records, k_anonymity_check)
        """
        if feature_types is None:
            feature_types = {}
        
        # Process each record
        prepared = []
        for record in records:
            processed = record.copy()
            
            # Coarsen timestamps
            for key, value in processed.items():
                if isinstance(value, datetime):
                    processed[key] = self.coarsen_timestamp(value)
            
            # Abstract features
            for key, feature_type in feature_types.items():
                if key in processed:
                    processed[key] = self.abstract_feature(
                        processed[key], 
                        feature_type
                    )
            
            prepared.append(processed)
        
        # Check k-anonymity
        k_check = self.check_k_anonymity(prepared, quasi_identifiers)
        
        # If k-anonymity not met, return empty list
        if not k_check.passed:
            return [], k_check
        
        return prepared, k_check


# Self-test
if __name__ == "__main__":
    print("I13/I14 Enforcement Test")
    print("=" * 80)
    
    # Test I13
    print("\nI13: Telemetry Enforcement")
    print("-" * 80)
    
    i13 = I13TelemetryEnforcement()
    
    test_metrics = {
        'constitutional_compliance': 0.97,
        'response_latency': 150,
        'mood_tracking': 0.8,  # FORBIDDEN
        'behavior_change': 12,  # FORBIDDEN
        'error_rate': 0.02,
        'user_retention': 0.85,  # FORBIDDEN
    }
    
    print("\nTest metrics:")
    for name, value in test_metrics.items():
        check = i13.check_metric(name)
        status = "✅ ALLOWED" if check.allowed else "❌ FORBIDDEN"
        reason = f" - {check.reason}" if check.reason else ""
        print(f"  {status}: {name}{reason}")
    
    filtered = i13.filter_allowed_metrics(test_metrics)
    print(f"\nFiltered metrics: {list(filtered.keys())}")
    
    # Test I14
    print("\n\nI14: K-Anonymity Enforcement")
    print("-" * 80)
    
    i14 = I14KAnonymityEnforcement(min_k=10)
    
    # Test timestamp coarsening
    now = datetime(2024, 3, 15, 14, 37, 22)
    coarsened = i14.coarsen_timestamp(now, 'hour')
    print(f"\nTimestamp coarsening:")
    print(f"  Original: {now}")
    print(f"  Coarsened: {coarsened}")
    
    # Test feature abstraction
    print(f"\nFeature abstraction:")
    print(f"  Age 28 → {i14.abstract_feature(28, 'age')}")
    print(f"  Age 52 → {i14.abstract_feature(52, 'age')}")
    print(f"  Count 47 → {i14.abstract_feature(47, 'numeric')}")
    
    # Test k-anonymity check (insufficient records)
    print(f"\nK-anonymity check (insufficient):")
    small_dataset = [
        {'age_group': '25-34', 'country': 'US', 'data': 'x'},
        {'age_group': '25-34', 'country': 'US', 'data': 'y'},
        {'age_group': '25-34', 'country': 'US', 'data': 'z'},  # Only 3 records
    ]
    
    k_check = i14.check_k_anonymity(small_dataset, ['age_group', 'country'])
    print(f"  Passed: {k_check.passed}")
    print(f"  K-value: {k_check.k_value} (need {k_check.required_k})")
    
    # Test k-anonymity check (sufficient records)
    print(f"\nK-anonymity check (sufficient):")
    large_dataset = [
        {'age_group': '25-34', 'country': 'US', 'data': f'record_{i}'}
        for i in range(15)
    ]
    
    k_check = i14.check_k_anonymity(large_dataset, ['age_group', 'country'])
    print(f"  Passed: {k_check.passed}")
    print(f"  K-value: {k_check.k_value} (need {k_check.required_k})")
    
    print("\n✅ I13/I14 enforcement functional")
