"""
Property-based and adversarial tests for EvolutionEngine.
"""
from hypothesis import given, strategies as st
from mirrorcore.evolution.engine import EvolutionEngine, EvolutionEvent, EvolutionObserver, EvolutionCritic

class CountingObserver(EvolutionObserver):
    def __init__(self):
        self.count = 0
    def observe(self, event):
        self.count += 1
        return {"count": self.count}

class PatternCritic(EvolutionCritic):
    def critique(self, history):
        patterns = [e.data.get("patterns", []) for e in history]
        flat = [p for sub in patterns for p in sub]
        if len(flat) > 5:
            return {"feedback": "Pattern overload"}
        return {"feedback": "OK"}

@given(st.lists(st.text(), min_size=1, max_size=10))
def test_evolution_engine_property(patterns):
    engine = EvolutionEngine(observers=[CountingObserver()], critics=[PatternCritic()])
    for i, p in enumerate(patterns):
        event = EvolutionEvent("reflection", {"patterns": [p]})
        engine.process_event(event)
    feedback = engine.run_critique()
    assert feedback
    assert isinstance(feedback[0]["feedback"], str)

@given(st.lists(st.dictionaries(keys=st.text(), values=st.text()), min_size=1, max_size=5))
def test_evolution_engine_adversarial(event_datas):
    engine = EvolutionEngine(observers=[CountingObserver()], critics=[PatternCritic()])
    for data in event_datas:
        event = EvolutionEvent("reflection", data)
        engine.process_event(event)
    feedback = engine.run_critique()
    assert feedback
    assert isinstance(feedback[0]["feedback"], str)
