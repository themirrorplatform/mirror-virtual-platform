"""
Constitutional Enforcement Layer

L0AxiomChecker: Enforces I2, I7, I13 invariants on all LLM outputs
"""

from .l0_checker import L0AxiomChecker, L0CheckResult, ViolationType

__all__ = [
    'L0AxiomChecker',
    'L0CheckResult',
    'ViolationType'
]
