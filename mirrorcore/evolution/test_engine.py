"""
Tests for EvolutionEngine, EvolutionObserver, and EvolutionCritic.
"""
import pytest
from mirrorcore.evolution.engine import EvolutionEngine, EvolutionEvent, EvolutionObserver, EvolutionCritic

class DummyObserver(EvolutionObserver):
    def observe(self, event):
        if event.event_type == "reflection":
            return {"insight": f"Observed reflection: {event.data.get('text', '')}"}
        return None

class DummyCritic(EvolutionCritic):
    def critique(self, history):
        return {"feedback": f"{len(history)} events processed."}

def test_evolution_engine_observer():
    engine = EvolutionEngine(observers=[DummyObserver()])
    event = EvolutionEvent("reflection", {"text": "test reflection"})
    insights = engine.process_event(event)
    assert insights and "insight" in insights[0]

def test_evolution_engine_critic():
    engine = EvolutionEngine(critics=[DummyCritic()])
    for i in range(3):
        engine.process_event(EvolutionEvent("reflection", {"text": f"r{i}"}))
    feedback = engine.run_critique()
    assert feedback and "feedback" in feedback[0] and "3 events" in feedback[0]["feedback"]
