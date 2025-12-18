"""
Protocols for distributed, adversarial, collective, and federated learning in Commons Sync.
"""
from typing import Any, Dict, Protocol

class AdversarialLearningProtocol(Protocol):
    def submit_challenge(self, event: Dict[str, Any]) -> None:
        ...
    def resolve_challenge(self, event: Dict[str, Any]) -> None:
        ...

class CollectiveLearningProtocol(Protocol):
    def propose_update(self, event: Dict[str, Any]) -> None:
        ...
    def reach_consensus(self, event: Dict[str, Any]) -> None:
        ...

class FederatedLearningProtocol(Protocol):
    def submit_local_update(self, event: Dict[str, Any]) -> None:
        ...
    def aggregate_updates(self, events: list) -> None:
        ...
