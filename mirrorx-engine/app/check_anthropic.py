from dotenv import load_dotenv
import os
import sys
import traceback

load_dotenv()
print("ANTHROPIC_API_KEY set:", bool(os.getenv("ANTHROPIC_API_KEY")))

try:
    from mirrorcore import generate_mirrorback, anthropic_client
except Exception:
    print("Failed to import mirrorcore:")
    traceback.print_exc()
    sys.exit(2)

print("Anthropic client configured:", anthropic_client is not None)

try:
    ctx = {
        "recent_reflections": [],
        "active_beliefs": [],
        "held_tensions": [],
        "recurring_themes": [],
        "user_tone": "neutral",
    }
    print("Calling generate_mirrorback (this may call the Anthropic API)...")
    out = generate_mirrorback("This is a short test reflection to validate the API key.", ctx, strict=False)
    print("--- GENERATE SUCCESS ---")
    print(out)
    sys.exit(0)
except Exception:
    print("--- GENERATE FAILED ---")
    traceback.print_exc()
    sys.exit(1)
