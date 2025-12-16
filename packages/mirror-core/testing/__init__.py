"""
Mirror Testing Module

This module provides the conformance test harness for Mirror implementations.
Any system claiming to be "The Mirror" must pass all tests in this harness.

The harness tests:
1. All 15 L0 axioms (I1-I15)
2. The invocation contract (post-action only)
3. Leave-ability compliance
4. Audit integrity
5. Governance constraints
"""

from .harness import (
    ConformanceHarness,
    ConformanceResult,
    run_conformance_tests,
)
from .fixtures import (
    CANONICAL_TEST_CASES,
    generate_adversarial_inputs,
)

__all__ = [
    "ConformanceHarness",
    "ConformanceResult",
    "run_conformance_tests",
    "CANONICAL_TEST_CASES",
    "generate_adversarial_inputs",
]
