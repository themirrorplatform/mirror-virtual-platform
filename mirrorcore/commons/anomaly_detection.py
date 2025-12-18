"""
Real-time intrusion detection and anomaly monitoring for Commons Sync.
Pluggable hooks for event anomaly detection and alerting.
"""
from typing import Callable, List

class AnomalyDetector:
    def __init__(self):
        self.hooks: List[Callable] = []

    def register_hook(self, hook: Callable):
        self.hooks.append(hook)

    def analyze_event(self, event) -> None:
        for hook in self.hooks:
            hook(event)

# Example: simple alert on repeated event_type
class RepeatedEventTypeAlert:
    def __init__(self):
        self.seen = set()
    def __call__(self, event):
        key = (event.event_type, event.origin)
        if key in self.seen:
            print(f"[ALERT] Repeated event_type from {event.origin}: {event.event_type}")
        self.seen.add(key)
