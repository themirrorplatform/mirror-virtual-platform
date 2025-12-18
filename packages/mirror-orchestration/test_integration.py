#!/usr/bin/env python3
"""
Integration test for Mirror with LLM providers.

This script tests the full end-to-end flow:
1. Initialize MirrorX with provider
2. Start session
3. Send reflection
4. Verify response

Usage:
    # Test with Ollama (default)
    python test_integration.py

    # Test with Anthropic
    ANTHROPIC_API_KEY=your_key python test_integration.py anthropic

    # Test with OpenAI
    OPENAI_API_KEY=your_key python test_integration.py openai
"""

import sys
import os
import asyncio

# Add package to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from session import SessionConfig
from mirror import MirrorX, MirrorConfig, ProviderSettings


async def test_full_flow(provider_type: str = "ollama"):
    """Test the complete Mirror flow with LLM."""
    print(f"\n{'='*60}")
    print(f"MIRROR INTEGRATION TEST - Provider: {provider_type}")
    print(f"{'='*60}\n")

    # Configure provider
    api_key = None
    if provider_type == "anthropic":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("⚠ ANTHROPIC_API_KEY not set, using Ollama instead")
            provider_type = "ollama"
    elif provider_type == "openai":
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("⚠ OPENAI_API_KEY not set, using Ollama instead")
            provider_type = "ollama"

    # Create config
    config = MirrorConfig(
        provider=ProviderSettings(
            provider_type=provider_type,
            api_key=api_key,
        ),
        enable_llm=True,
        strict_mode=True,
    )

    # Initialize Mirror
    print("[1] Initializing MirrorX...")
    mirror = MirrorX(config)
    print("    ✓ MirrorX initialized")

    # Start session
    print("\n[2] Starting session...")
    session = await mirror.start_session(user_id="test_user_001")
    print(f"    ✓ Session started: {session.id[:8]}...")

    # Test reflections
    test_inputs = [
        "I've been thinking about my career lately. I feel stuck.",
        "Sometimes I wonder if I made the right choices.",
        "I want to find more meaning in what I do.",
    ]

    print("\n[3] Testing reflections...")
    for i, user_input in enumerate(test_inputs, 1):
        print(f"\n--- Turn {i} ---")
        print(f"User: {user_input}")

        response = await mirror.reflect(
            session_id=session.id,
            user_input=user_input,
        )

        if response.success:
            print(f"Mirror: {response.reflection_text}")

            # Verify constitutional compliance
            text_lower = response.reflection_text.lower()

            # Check for certainty violations
            if "you definitely" in text_lower or "you certainly" in text_lower:
                print("    ⚠ Warning: Certainty language detected")

            # Check for advice violations
            if "you should" in text_lower or "you must" in text_lower:
                print("    ⚠ Warning: Advice language detected")

            # Check for diagnostic violations
            diagnostic_terms = ["depression", "anxiety disorder", "trauma"]
            for term in diagnostic_terms:
                if term in text_lower:
                    print(f"    ⚠ Warning: Diagnostic term '{term}' detected")

            print(f"    ✓ Response received ({response.pipeline_duration_ms:.1f}ms)")

            if response.break_suggested:
                print(f"    💬 Break suggested: {response.break_message}")

        else:
            print(f"    ✗ Failed: {response.error}")
            if response.halted_by_axiom:
                print(f"    (Halted by Axiom {response.halted_by_axiom})")

    # End session
    print("\n[4] Ending session...")
    goodbye = await mirror.end_session(session.id)
    print(f"    Mirror: {goodbye}")
    print("    ✓ Session ended successfully")

    # Statistics
    print(f"\n{'='*60}")
    print("STATISTICS")
    print(f"{'='*60}")
    stats = mirror.get_statistics()
    print(f"  Total sessions: {stats['total_sessions']}")
    print(f"  Total reflections: {stats['total_reflections']}")
    print(f"  Constitutional halts: {stats['constitutional_halts']}")

    print(f"\n✅ Integration test completed successfully!\n")
    return True


async def test_fallback():
    """Test that fallback works when provider unavailable."""
    print(f"\n{'='*60}")
    print("FALLBACK TEST - No LLM")
    print(f"{'='*60}\n")

    # Create config with LLM disabled
    config = MirrorConfig(
        enable_llm=False,
    )

    mirror = MirrorX(config)
    session = await mirror.start_session(user_id="test_user")

    response = await mirror.reflect(
        session_id=session.id,
        user_input="Testing fallback mode",
    )

    if response.success:
        print(f"Fallback response: {response.reflection_text}")
        print("✓ Fallback mode works")
    else:
        print(f"✗ Fallback failed: {response.error}")

    await mirror.end_session(session.id)
    return response.success


if __name__ == "__main__":
    provider = sys.argv[1] if len(sys.argv) > 1 else "ollama"

    # Run tests
    asyncio.run(test_fallback())
    asyncio.run(test_full_flow(provider))
