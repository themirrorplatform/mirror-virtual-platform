"""
Base Axiom Classes

Defines the interface that all axiom checkers must implement.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass
import re


@dataclass
class Axiom:
    """
    Metadata about an axiom.
    
    This describes what the axiom is, not how to check it.
    """
    id: str
    name: str
    category: str  # "core", "mirror_specific", "interaction", "system"
    severity: str  # "fatal" (all axioms are fatal)
    description: str


class AxiomChecker(ABC):
    """
    Base class for all axiom checkers.
    
    Each axiom checker is responsible for validating that a request
    or response complies with one specific axiom.
    
    Axiom checkers are:
    - Pure logic (no I/O)
    - Stateless (no side effects)
    - Fail-closed (violations block processing)
    - Composable (can be combined)
    """
    
    def __init__(self):
        self.axiom = self.get_axiom()
    
    @abstractmethod
    def get_axiom(self) -> Axiom:
        """Return metadata about this axiom."""
        pass
    
    @abstractmethod
    def check_request(self, request: 'MirrorRequest') -> List['AxiomViolation']:
        """
        Check if a request violates this axiom.
        
        Returns:
            List of violations (empty if compliant)
        """
        pass
    
    @abstractmethod
    def check_response(
        self,
        request: 'MirrorRequest',
        response: 'MirrorResponse'
    ) -> List['AxiomViolation']:
        """
        Check if a response violates this axiom.
        
        The request is provided for context (e.g., to check if the
        response is appropriate given what the user asked).
        
        Returns:
            List of violations (empty if compliant)
        """
        pass
    
    # Helper methods for common patterns
    
    def _contains_any(self, text: str, patterns: List[str], case_sensitive: bool = False) -> Optional[str]:
        """
        Check if text contains any of the given patterns.
        
        Returns:
            The first matching pattern, or None if no match
        """
        if not case_sensitive:
            text = text.lower()
            patterns = [p.lower() for p in patterns]
        
        for pattern in patterns:
            if pattern in text:
                return pattern
        return None
    
    def _matches_regex(self, text: str, pattern: str, flags: int = 0) -> Optional[re.Match]:
        """
        Check if text matches a regex pattern.
        
        Returns:
            Match object if found, None otherwise
        """
        return re.search(pattern, text, flags)
    
    def _create_violation(
        self,
        reason: str,
        evidence: Optional[str] = None
    ) -> 'AxiomViolation':
        """
        Create a violation for this axiom.
        
        This is a convenience method that fills in the axiom metadata.
        """
        from protocol.types import AxiomViolation
        
        return AxiomViolation(
            axiom_id=self.axiom.id,
            axiom_name=self.axiom.name,
            severity=self.axiom.severity,
            reason=reason,
            evidence=evidence
        )
