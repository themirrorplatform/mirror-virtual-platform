"""
Integration Entry Points

Connects all Mirror packages into a unified system.
This module provides the glue between:
- mirror-core (base types)
- mirror-recognition (pattern detection)
- mirror-providers (AI backends)
- mirror-storage (persistence)
- mirror-governance (constitutional evolution)
- mirror-expression (tone adaptation)
- mirror-orchestration (session management)
"""

from typing import Dict, Optional, List, Any
from dataclasses import dataclass

from .config import MirrorPlatformConfig


@dataclass
class PackageInfo:
    """Information about a Mirror package."""
    name: str
    version: str
    description: str
    available: bool = False
    error: Optional[str] = None


def check_package_availability() -> Dict[str, PackageInfo]:
    """Check which Mirror packages are available."""
    packages = {}

    # mirror-core
    try:
        from mirror_core import __version__ as core_version
        packages["mirror-core"] = PackageInfo(
            name="mirror-core",
            version=core_version,
            description="Core types and constitutional foundation",
            available=True,
        )
    except ImportError as e:
        packages["mirror-core"] = PackageInfo(
            name="mirror-core",
            version="unknown",
            description="Core types and constitutional foundation",
            available=False,
            error=str(e),
        )

    # mirror-recognition
    try:
        from mirror_recognition import __version__ as recognition_version
        packages["mirror-recognition"] = PackageInfo(
            name="mirror-recognition",
            version=recognition_version,
            description="Pattern and tension recognition",
            available=True,
        )
    except ImportError as e:
        packages["mirror-recognition"] = PackageInfo(
            name="mirror-recognition",
            version="unknown",
            description="Pattern and tension recognition",
            available=False,
            error=str(e),
        )

    # mirror-providers
    try:
        from mirror_providers import __version__ as providers_version
        packages["mirror-providers"] = PackageInfo(
            name="mirror-providers",
            version=providers_version,
            description="AI provider adapters",
            available=True,
        )
    except ImportError as e:
        packages["mirror-providers"] = PackageInfo(
            name="mirror-providers",
            version="unknown",
            description="AI provider adapters",
            available=False,
            error=str(e),
        )

    # mirror-storage
    try:
        from mirror_storage import __version__ as storage_version
        packages["mirror-storage"] = PackageInfo(
            name="mirror-storage",
            version=storage_version,
            description="Local-first storage with sync",
            available=True,
        )
    except ImportError as e:
        packages["mirror-storage"] = PackageInfo(
            name="mirror-storage",
            version="unknown",
            description="Local-first storage with sync",
            available=False,
            error=str(e),
        )

    # mirror-governance
    try:
        from mirror_governance import __version__ as governance_version
        packages["mirror-governance"] = PackageInfo(
            name="mirror-governance",
            version=governance_version,
            description="Democratic constitution evolution",
            available=True,
        )
    except ImportError as e:
        packages["mirror-governance"] = PackageInfo(
            name="mirror-governance",
            version="unknown",
            description="Democratic constitution evolution",
            available=False,
            error=str(e),
        )

    # mirror-expression
    try:
        from mirror_expression import __version__ as expression_version
        packages["mirror-expression"] = PackageInfo(
            name="mirror-expression",
            version=expression_version,
            description="L3 tone adaptation",
            available=True,
        )
    except ImportError as e:
        packages["mirror-expression"] = PackageInfo(
            name="mirror-expression",
            version="unknown",
            description="L3 tone adaptation",
            available=False,
            error=str(e),
        )

    # mirror-orchestration
    try:
        from mirror_orchestration import __version__ as orchestration_version
        packages["mirror-orchestration"] = PackageInfo(
            name="mirror-orchestration",
            version=orchestration_version,
            description="Session management and pipeline",
            available=True,
        )
    except ImportError as e:
        packages["mirror-orchestration"] = PackageInfo(
            name="mirror-orchestration",
            version="unknown",
            description="Session management and pipeline",
            available=False,
            error=str(e),
        )

    return packages


def get_system_info() -> Dict[str, Any]:
    """Get complete system information."""
    packages = check_package_availability()

    available_count = sum(1 for p in packages.values() if p.available)
    total_count = len(packages)

    return {
        "platform_version": "1.0.0",
        "packages": {
            name: {
                "version": info.version,
                "available": info.available,
                "description": info.description,
                "error": info.error,
            }
            for name, info in packages.items()
        },
        "packages_available": available_count,
        "packages_total": total_count,
        "fully_operational": available_count == total_count,
    }


def print_system_info():
    """Print system information to console."""
    info = get_system_info()

    print("Mirror Platform System Info")
    print("=" * 50)
    print(f"Platform Version: {info['platform_version']}")
    print(f"Packages: {info['packages_available']}/{info['packages_total']} available")
    print()
    print("Package Status:")
    print("-" * 50)

    for name, pkg in info["packages"].items():
        status = "✓" if pkg["available"] else "✗"
        version = pkg["version"] if pkg["available"] else "N/A"
        print(f"  {status} {name} ({version})")
        print(f"      {pkg['description']}")
        if pkg["error"]:
            print(f"      Error: {pkg['error']}")

    print()
    if info["fully_operational"]:
        print("✓ System is fully operational")
    else:
        print("⚠ Some packages are not available")


class IntegratedPipeline:
    """
    Integrated reflection pipeline using all packages.

    This class wires together all the Mirror packages into
    a complete reflection pipeline.
    """

    def __init__(self, config: MirrorPlatformConfig = None):
        self.config = config
        self._initialized = False

    async def initialize(self):
        """Initialize all package connections."""
        packages = check_package_availability()

        # Check minimum requirements
        required = ["mirror-orchestration"]
        for pkg in required:
            if not packages.get(pkg, PackageInfo("", "", "")).available:
                raise RuntimeError(f"Required package not available: {pkg}")

        self._initialized = True

    @property
    def is_initialized(self) -> bool:
        return self._initialized


# Constitutional Axioms - The foundation of Mirror
CONSTITUTIONAL_AXIOMS = {
    1: {
        "name": "Certainty",
        "text": "Mirror does not convince, assert, or claim certainty about the user's psychological state, needs, or experiences.",
        "enforcement": "Block certainty claims in all outputs",
    },
    2: {
        "name": "Sovereignty",
        "text": "The user is the final interpreter of their own experience. Mirror never overrides user interpretation.",
        "enforcement": "Always defer to user's interpretation",
    },
    3: {
        "name": "Manipulation",
        "text": "No dark patterns, persuasion techniques, or manipulative design.",
        "enforcement": "Block manipulation patterns in outputs",
    },
    4: {
        "name": "Diagnosis",
        "text": "Mirror never diagnoses medical or psychological conditions.",
        "enforcement": "Block all diagnostic language",
    },
    5: {
        "name": "Post-Action",
        "text": "Mirror is only activated after explicit user action. Never proactive.",
        "enforcement": "Require user initiation for all actions",
    },
    6: {
        "name": "Necessity",
        "text": "Only minimal necessary analysis. No over-interpretation or excessive depth.",
        "enforcement": "Limit output length and depth",
    },
    7: {
        "name": "Exit Freedom",
        "text": "User can always leave, immediately and unconditionally. Exit is never blocked.",
        "enforcement": "Never block exit, celebrate departures",
    },
    8: {
        "name": "Departure Inference",
        "text": "No inference or judgment from user departure. Leaving is not analyzed.",
        "enforcement": "Do not process exit patterns",
    },
    9: {
        "name": "Advice",
        "text": "Never prescriptive advice. Mirror reflects, not prescribes.",
        "enforcement": "Block prescriptive language",
    },
    10: {
        "name": "Context Collapse",
        "text": "Private context stays private. No cross-context leakage.",
        "enforcement": "Isolate user contexts",
    },
    11: {
        "name": "Certainty-Self",
        "text": "Mirror makes no certainty claims about its own understanding of the user.",
        "enforcement": "Hedge all AI claims",
    },
    12: {
        "name": "Optimization",
        "text": "Mirror is not a tool for self-optimization or productivity improvement.",
        "enforcement": "Block optimization framing",
    },
    13: {
        "name": "Coercion",
        "text": "No pressure tactics, guilt, or emotional manipulation to continue engagement.",
        "enforcement": "Block coercive patterns",
    },
    14: {
        "name": "Capture",
        "text": "No psychological capture or dependency creation. Anti-stickiness is a feature.",
        "enforcement": "Active leave-ability measures",
    },
}


def get_axiom(number: int) -> Optional[Dict[str, str]]:
    """Get information about a specific axiom."""
    return CONSTITUTIONAL_AXIOMS.get(number)


def get_all_axioms() -> Dict[int, Dict[str, str]]:
    """Get all constitutional axioms."""
    return CONSTITUTIONAL_AXIOMS.copy()


def validate_constitutional_compliance(output: str) -> List[Dict[str, Any]]:
    """
    Validate that an output complies with constitutional axioms.

    Returns a list of potential violations.
    """
    violations = []

    # Simple pattern-based checks (full checks in mirror-expression)
    output_lower = output.lower()

    # Axiom 1/11: Certainty
    certainty_patterns = ["you definitely", "you certainly", "i'm certain"]
    for pattern in certainty_patterns:
        if pattern in output_lower:
            violations.append({
                "axiom": 1,
                "pattern": pattern,
                "severity": "high",
            })

    # Axiom 4: Diagnosis
    diagnosis_patterns = ["you have depression", "you suffer from", "diagnosed"]
    for pattern in diagnosis_patterns:
        if pattern in output_lower:
            violations.append({
                "axiom": 4,
                "pattern": pattern,
                "severity": "critical",
            })

    # Axiom 9: Prescriptive
    prescriptive_patterns = ["you should", "you must", "you need to"]
    for pattern in prescriptive_patterns:
        if pattern in output_lower:
            violations.append({
                "axiom": 9,
                "pattern": pattern,
                "severity": "medium",
            })

    # Axiom 14: Capture
    capture_patterns = ["only i understand", "you need me", "don't leave"]
    for pattern in capture_patterns:
        if pattern in output_lower:
            violations.append({
                "axiom": 14,
                "pattern": pattern,
                "severity": "critical",
            })

    return violations
