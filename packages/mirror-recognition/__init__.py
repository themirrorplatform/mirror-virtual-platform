"""
Mirror Recognition Package

Constitutional conformance testing for Mirror implementations.
"""

from .conformance import ConformanceHarness, run_conformance_tests

__version__ = "1.0.0"
__all__ = ["ConformanceHarness", "run_conformance_tests"]
