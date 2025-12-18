"""
Property-based, adversarial, and chaos tests for Commons Sync distributed scenarios.
"""
import pytest
from hypothesis import given, strategies as st
from mirrorcore.commons.sync import CommonsEvent, InMemoryCommonsSync

@given(st.text(), st.dictionaries(st.text(), st.integers()), st.text())
def test_broadcast_and_receive_event(event_type, payload, origin):
    sync = InMemoryCommonsSync()
    event = CommonsEvent(event_type, payload, origin)
    sync.broadcast_event(event)
    assert event in sync.get_event_history()
    # Simulate receiving the same event again (should not duplicate)
    sync.receive_event(event)
    assert sync.get_event_history().count(event) == 1

@given(st.lists(st.tuples(st.text(), st.dictionaries(st.text(), st.integers()), st.text()), min_size=1, max_size=10))
def test_no_duplicate_events(event_tuples):
    sync = InMemoryCommonsSync()
    events = [CommonsEvent(t, p, o) for t, p, o in event_tuples]
    for event in events:
        sync.broadcast_event(event)
        sync.receive_event(event)
    event_ids = [e.event_id for e in sync.get_event_history()]
    assert len(event_ids) == len(set(event_ids))

# TODO: Add adversarial and chaos tests for distributed scenarios
