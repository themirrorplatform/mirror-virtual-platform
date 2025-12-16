"""
Mirror Conformance Test Runner

Command-line tool for testing Mirror implementations.

Usage:
    python runner.py                    # Show spec summary
    python runner.py test <impl_path>   # Test an implementation
    python runner.py verify <attestation_file>  # Verify attestation

Examples:
    python runner.py
    python runner.py test ../mirror-core
    python runner.py verify attestation.json
"""

import sys
import argparse
from pathlib import Path
from typing import Optional
import json

from .harness import ConformanceHarness, ConformanceReport


def show_spec_summary(harness: ConformanceHarness):
    """Show summary of the specification."""
    print()
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "MIRROR CONFORMANCE SPECIFICATION" + " " * 26 + "║")
    print("╚" + "═" * 78 + "╝")
    print()
    
    print(f"📋 AXIOMS: {len(harness.axioms)}")
    print()
    
    # Group by category
    by_category = {}
    for axiom in harness.axioms:
        if axiom.category not in by_category:
            by_category[axiom.category] = []
        by_category[axiom.category].append(axiom)
    
    for category, axioms in by_category.items():
        print(f"  {category.upper().replace('_', ' ')}")
        for axiom in axioms:
            severity_icon = "🔴" if axiom.severity == "fatal" else "🟡"
            print(f"    {severity_icon} {axiom.id}: {axiom.name}")
            print(f"       {axiom.description.strip().split(chr(10))[0]}")
        print()
    
    print(f"⚔️  ADVERSARIAL CASES: {len(harness.adversarial_cases)}")
    print()
    
    # Count by category
    adv_by_category = {}
    for case in harness.adversarial_cases:
        adv_by_category[case.category] = adv_by_category.get(case.category, 0) + 1
    
    for category, count in sorted(adv_by_category.items()):
        print(f"    {category}: {count} attacks")
    print()
    
    print("─" * 80)
    print()
    print("📝 NEXT STEPS:")
    print()
    print("  1. Implement packages/mirror-core/")
    print("  2. Run: python runner.py test ../mirror-core")
    print("  3. Fix violations until all tests pass")
    print("  4. Receive Mirror Certified attestation")
    print()
    print("─" * 80)
    print()


def test_implementation(harness: ConformanceHarness, impl_path: str):
    """Test a Mirror implementation."""
    print()
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 25 + "MIRROR CONFORMANCE TEST" + " " * 30 + "║")
    print("╚" + "═" * 78 + "╝")
    print()
    
    print(f"Testing implementation: {impl_path}")
    print()
    
    # Try to load implementation
    impl_path_obj = Path(impl_path)
    if not impl_path_obj.exists():
        print(f"❌ ERROR: Path not found: {impl_path}")
        print()
        print("Expected: Path to mirror-core implementation")
        print("Example: ../mirror-core")
        return 1
    
    # Try to import implementation
    try:
        sys.path.insert(0, str(impl_path_obj.resolve()))
        from mirror_core import MirrorEngine
        
        implementation = MirrorEngine()
        print("✓ Implementation loaded")
        print()
    
    except ImportError as e:
        print(f"❌ ERROR: Could not import MirrorEngine")
        print(f"   {e}")
        print()
        print("Expected: mirror-core package with MirrorEngine class")
        print()
        print("⚠️  IMPLEMENTATION NOT FOUND")
        print()
        print("This is expected at this stage. The tests define what to build.")
        print()
        return 1
    
    # Run tests
    print("Running conformance tests...")
    print()
    
    report = harness.test(implementation)
    
    # Show report
    print(report)
    
    # Save report
    report_file = Path("conformance_report.json")
    with open(report_file, "w") as f:
        json.dump({
            "passed": report.passed,
            "timestamp": report.timestamp.isoformat(),
            "tests_run": report.tests_run,
            "tests_passed": report.tests_passed,
            "tests_failed": report.tests_failed,
            "axioms_tested": report.axioms_tested,
            "violations": report.violations,
            "attestation": report.attestation
        }, f, indent=2)
    
    print(f"Report saved: {report_file}")
    print()
    
    if report.passed:
        # Save attestation
        attestation_file = Path("mirror_certified.json")
        with open(attestation_file, "w") as f:
            f.write(report.attestation)
        
        print("═" * 80)
        print()
        print("  ✓  MIRROR CERTIFIED")
        print()
        print(f"     Attestation: {attestation_file}")
        print(f"     Verify: python runner.py verify {attestation_file}")
        print()
        print("═" * 80)
        print()
        return 0
    
    else:
        print("═" * 80)
        print()
        print("  ✗  CONFORMANCE FAILED")
        print()
        print(f"     {report.tests_failed} violations detected")
        print(f"     Review: {report_file}")
        print()
        print("═" * 80)
        print()
        return 1


def verify_attestation(attestation_path: str):
    """Verify a Mirror Certified attestation."""
    print()
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 22 + "MIRROR ATTESTATION VERIFICATION" + " " * 25 + "║")
    print("╚" + "═" * 78 + "╝")
    print()
    
    attestation_file = Path(attestation_path)
    if not attestation_file.exists():
        print(f"❌ ERROR: Attestation not found: {attestation_path}")
        return 1
    
    with open(attestation_file) as f:
        attestation = json.load(f)
    
    print("Attestation:")
    print()
    for key, value in attestation.items():
        if key == "axioms_tested":
            print(f"  {key}: {len(value)} axioms")
        elif key == "merkle_root":
            print(f"  {key}: {value[:16]}...")
        elif key == "signature":
            print(f"  {key}: {value[:16]}...")
        else:
            print(f"  {key}: {value}")
    print()
    
    # TODO: Cryptographic verification
    print("⚠️  Cryptographic verification not implemented yet")
    print("    (signature verification requires public key infrastructure)")
    print()
    
    print("─" * 80)
    print()
    print("To verify manually:")
    print(f"  1. Check timestamp: {attestation.get('timestamp')}")
    print(f"  2. Verify tests_passed == tests_run: {attestation.get('tests_passed')} == {attestation.get('tests_run')}")
    print(f"  3. Check merkle_root matches test results")
    print(f"  4. Verify signature (when PKI is implemented)")
    print()
    
    return 0


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Mirror Conformance Test Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python runner.py                          Show specification summary
  python runner.py test ../mirror-core      Test an implementation
  python runner.py verify attestation.json  Verify attestation

For more information: https://mirror.so/docs/conformance
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Test command
    test_parser = subparsers.add_parser("test", help="Test a Mirror implementation")
    test_parser.add_argument("impl_path", help="Path to implementation (e.g., ../mirror-core)")
    
    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify attestation")
    verify_parser.add_argument("attestation", help="Path to attestation file")
    
    args = parser.parse_args()
    
    harness = ConformanceHarness()
    
    if args.command == "test":
        return test_implementation(harness, args.impl_path)
    
    elif args.command == "verify":
        return verify_attestation(args.attestation)
    
    else:
        # No command - show summary
        show_spec_summary(harness)
        return 0


if __name__ == "__main__":
    sys.exit(main())
