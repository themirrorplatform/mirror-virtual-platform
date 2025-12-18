"""
Automated protocol fuzzing for Commons Sync events and API boundaries.
Intended for CI integration. Generates random, malformed, and edge-case events.
"""
import pytest
import random
import string
from mirrorcore.commons.sync import CommonsEvent, InMemoryCommonsSync
from mirrorcore.commons.crypto import generate_keypair

def random_string(n=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=n))

def fuzz_event():
    # Randomly omit or corrupt fields
    fields = {
        "event_type": random.choice([random_string(), None, 123, ""]),
        "payload": random.choice([{random_string(): random.randint(0, 100)}, None, "notadict"]),
        "origin": random.choice([random_string(), "", None]),
        "timestamp": random.choice([None, random.uniform(1, 1e10)]),
        "event_id": random.choice([None, random_string(), 123]),
    }
    priv, pub = generate_keypair()
    event = CommonsEvent(
        event_type=fields["event_type"],
        payload=fields["payload"],
        origin=fields["origin"],
        timestamp=fields["timestamp"],
        event_id=fields["event_id"]
    )
    try:
        event.sign(priv)
    except Exception:
        pass
    return event

def test_fuzz_commons_sync():
    sync = InMemoryCommonsSync()
    for _ in range(100):
        event = fuzz_event()
        try:
            sync.broadcast_event(event)
        except Exception:
            pass  # Acceptable: fuzzed event may fail
