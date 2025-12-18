"""
Distributed consensus/quorum for critical actions in Commons Sync.
Require quorum for protocol upgrades, key rotations, or event acceptance.
"""
from typing import List, Dict, Any

class QuorumManager:
    def __init__(self, node_ids: List[str], threshold: int):
        self.node_ids = node_ids
        self.threshold = threshold
        self.votes: Dict[str, Any] = {}

    def propose(self, action: str, data: Any):
        self.votes = {nid: None for nid in self.node_ids}
        self.action = action
        self.data = data

    def vote(self, node_id: str, approve: bool):
        if node_id in self.votes:
            self.votes[node_id] = approve

    def has_quorum(self) -> bool:
        return list(self.votes.values()).count(True) >= self.threshold

    def result(self) -> bool:
        if not self.has_quorum():
            return False
        return all(v is True for v in self.votes.values() if v is not None)
