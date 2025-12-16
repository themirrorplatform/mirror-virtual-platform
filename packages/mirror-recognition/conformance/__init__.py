"""
Mirror Recognition - Conformance Testing Framework

This package provides the canonical test suite for Mirror constitutional compliance.
All implementations must pass this harness to be considered Mirror-conformant.

The harness enforces the 14 axioms that define Mirror as a pattern.
"""

from .harness import ConformanceHarness

__all__ = ["ConformanceHarness"]
