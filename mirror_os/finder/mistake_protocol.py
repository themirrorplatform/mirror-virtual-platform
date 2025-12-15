"""
Mistake Protocol: Learning from Finder errors

NOT optimization for comfort. Learns delivery parameters, not content preferences.

Mistake types:
1. Consent violation (HIGH weight)
2. Timing mismatch (MEDIUM weight)
3. Corruption risk (HIGH weight)
4. Bandwidth overload (MEDIUM weight)
5. Discomfort (ZERO weight - never penalized)
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, List, Dict
from datetime import datetime
import json
from pathlib import Path


class MistakeType(Enum):
    """Types of routing mistakes"""
    CONSENT_VIOLATION = "consent_violation"  # Shown something explicitly blocked
    TIMING_MISMATCH = "timing_mismatch"  # Wrong moment (just woke up, in crisis, etc.)
    CORRUPTION_RISK = "corruption_risk"  # Manipulative/coercive candidate
    BANDWIDTH_OVERLOAD = "bandwidth_overload"  # Too many doors at once
    DISCOMFORT = "discomfort"  # User reported discomfort (ZERO weight)


# Mistake weights (how much to adjust for each type)
MISTAKE_WEIGHTS = {
    MistakeType.CONSENT_VIOLATION: 1.0,  # Maximum correction
    MistakeType.TIMING_MISMATCH: 0.5,
    MistakeType.CORRUPTION_RISK: 1.0,
    MistakeType.BANDWIDTH_OVERLOAD: 0.4,
    MistakeType.DISCOMFORT: 0.0,  # Never adjust based on discomfort
}


@dataclass
class MistakeReport:
    """User report of a Finder mistake"""
    mistake_type: MistakeType
    node_id: str  # Which candidate caused issue
    context: str  # User's explanation
    reported_at: datetime = field(default_factory=datetime.utcnow)
    correction_applied: bool = False


class MistakeProtocol:
    """
    Learn from Finder mistakes without drifting to comfort.
    
    Constitutional rule: Discomfort is NOT negative signal.
    Only learn delivery parameters (when, how), not content preferences.
    """
    
    def __init__(self, user_id: str, storage_path: Path):
        self.user_id = user_id
        self.storage_path = storage_path
        self.reports: List[MistakeReport] = []
        
        # Learned parameters (NOT content preferences)
        self.blocked_nodes: set = set()  # Consent violations
        self.timing_preferences: Dict = {}  # When user is open
        self.bandwidth_limit: int = 3  # Max doors per session
        
        self._load()
    
    def report_mistake(self, mistake_type: MistakeType, node_id: str,
                      context: str) -> None:
        """
        User reports a Finder mistake.
        
        System learns ONLY:
        - Consent (which nodes to block)
        - Timing (when to show doors)
        - Bandwidth (how many doors)
        
        System NEVER learns:
        - Content preferences (what ideas to avoid)
        - Comfort optimization (how to reduce discomfort)
        """
        report = MistakeReport(
            mistake_type=mistake_type,
            node_id=node_id,
            context=context
        )
        
        self.reports.append(report)
        
        # Apply corrections based on mistake type
        weight = MISTAKE_WEIGHTS[mistake_type]
        
        if weight > 0:
            self._apply_correction(report, weight)
            report.correction_applied = True
        
        self._save()
    
    def _apply_correction(self, report: MistakeReport, weight: float) -> None:
        """
        Apply correction based on mistake type.
        
        HIGH weight → strong correction
        ZERO weight → no correction (discomfort)
        """
        if report.mistake_type == MistakeType.CONSENT_VIOLATION:
            # Block this node permanently
            self.blocked_nodes.add(report.node_id)
        
        elif report.mistake_type == MistakeType.TIMING_MISMATCH:
            # Learn timing preferences (simplified)
            hour = report.reported_at.hour
            if hour not in self.timing_preferences:
                self.timing_preferences[hour] = {'bad_timing_count': 0}
            self.timing_preferences[hour]['bad_timing_count'] += 1
        
        elif report.mistake_type == MistakeType.CORRUPTION_RISK:
            # Block this node permanently + flag for Commons
            self.blocked_nodes.add(report.node_id)
            # TODO: Report to Commons for community review
        
        elif report.mistake_type == MistakeType.BANDWIDTH_OVERLOAD:
            # Reduce max doors
            self.bandwidth_limit = max(1, self.bandwidth_limit - 1)
        
        elif report.mistake_type == MistakeType.DISCOMFORT:
            # NO CORRECTION - discomfort is not negative signal
            pass
    
    def is_blocked(self, node_id: str) -> bool:
        """Check if node is blocked due to past mistakes"""
        return node_id in self.blocked_nodes
    
    def get_bandwidth_limit(self) -> int:
        """Current max doors per session"""
        return self.bandwidth_limit
    
    def get_mistake_summary(self) -> Dict:
        """Summary for user inspection"""
        return {
            'total_reports': len(self.reports),
            'by_type': {
                mistake_type.value: sum(1 for r in self.reports 
                                       if r.mistake_type == mistake_type)
                for mistake_type in MistakeType
            },
            'blocked_nodes': len(self.blocked_nodes),
            'bandwidth_limit': self.bandwidth_limit,
            'timing_preferences': self.timing_preferences,
        }
    
    def _load(self):
        """Load mistake history from storage"""
        mistakes_file = self.storage_path / f"mistakes_{self.user_id}.json"
        if mistakes_file.exists():
            with open(mistakes_file, 'r') as f:
                data = json.load(f)
                self.blocked_nodes = set(data.get('blocked_nodes', []))
                self.timing_preferences = data.get('timing_preferences', {})
                self.bandwidth_limit = data.get('bandwidth_limit', 3)
                # TODO: Load reports list
    
    def _save(self):
        """Save mistake history to storage"""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        mistakes_file = self.storage_path / f"mistakes_{self.user_id}.json"
        
        data = {
            'user_id': self.user_id,
            'blocked_nodes': list(self.blocked_nodes),
            'timing_preferences': self.timing_preferences,
            'bandwidth_limit': self.bandwidth_limit,
            'report_count': len(self.reports),
            'updated_at': datetime.utcnow().isoformat(),
        }
        
        with open(mistakes_file, 'w') as f:
            json.dump(data, f, indent=2)


# Fix missing import
from dataclasses import field
