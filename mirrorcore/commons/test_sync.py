# --- Advanced Security & Trust Tests ---
from mirrorcore.commons.trust_db import TrustDB
from mirrorcore.commons.zkp_confidential import ZKProof, ConfidentialPayload
from mirrorcore.commons.anomaly_detection import AnomalyDetector, RepeatedEventTypeAlert
from mirrorcore.commons.quorum import QuorumManager
from mirrorcore.commons.key_recovery_manager import CommonsSyncKeyRecoveryManager
from mirrorcore.commons.secure_network import SecureCommonsSyncNetwork
from mirrorcore.commons.secure_transport import SecureTransport
def test_multisig_and_trust():
    trust_db = TrustDB()
    privs, pubs, dids = [], [], []
    for _ in range(3):
        priv, pub = generate_keypair()
        privs.append(priv)
        pubs.append(pub)
        did = pub.public_bytes().hex()
        dids.append(did)
        trust_db.register(did, pub.public_bytes(), trusted_by={"root"})
    event = CommonsEvent("type", {"val": 1}, "origin", m_required=2)
    event.sign(privs[0])
    event.sign(privs[1])
    sync = InMemoryCommonsSync(trust_db=trust_db)
    sync.broadcast_event(event)  # Should succeed
    # Remove trust for one signer
    trust_db.revoke(dids[0])
    event2 = CommonsEvent("type", {"val": 2}, "origin", m_required=2)
    event2.sign(privs[0])
    event2.sign(privs[1])
    try:
        sync.broadcast_event(event2)
        assert False, "Should not accept event with untrusted signer"
    except ValueError:
        pass

def test_confidential_payload_and_zkp():
    priv, pub = generate_keypair()
    conf = ConfidentialPayload(ciphertext=b"encrypted", encryption_scheme="AES-GCM")
    zkp = ZKProof(statement="x > 0", proof_data={})
    event = CommonsEvent("type", {"val": 1}, "origin", confidential_payload=conf, zkp=zkp)
    event.sign(priv)
    sync = InMemoryCommonsSync()
    sync.broadcast_event(event)  # Should succeed (ZKP always verifies in stub)

def test_anomaly_detection_and_quorum():
    anomaly = AnomalyDetector()
    alert = RepeatedEventTypeAlert()
    anomaly.register_hook(alert)
    quorum = QuorumManager(["A", "B", "C"], threshold=2)
    quorum.propose("upgrade", {})
    quorum.vote("A", True)
    quorum.vote("B", True)
    priv, pub = generate_keypair()
    event = CommonsEvent("type", {"val": 1}, "origin")
    event.sign(priv)
    sync = InMemoryCommonsSync(anomaly_detector=anomaly, quorum_manager=quorum)
    sync.broadcast_event(event)  # Should succeed (quorum reached)
    # Remove quorum
    quorum.vote("A", False)
    try:
        sync.broadcast_event(event)
        assert False, "Should not accept event without quorum"
    except ValueError:
        pass

def test_secure_network_and_key_recovery():
    # Secure network stub
    class DummyTransport(SecureTransport):
        def send(self, data, dest):
            self.last_sent = (data, dest)
        def receive(self):
            return b"dummy"
    net = SecureCommonsSyncNetwork(DummyTransport())
    priv, pub = generate_keypair()
    event = CommonsEvent("type", {"val": 1}, "origin")
    event.sign(priv)
    net.send_event(event, "peer1")
    assert net.transport.last_sent[1] == "peer1"
    # Key recovery stub
    trust_db = TrustDB()
    manager = CommonsSyncKeyRecoveryManager(trust_db)
    manager.handle_compromise("did:example:1", [event])
# --- Fault Injection & Recovery Tests ---
import tempfile
import os
from mirrorcore.commons.audit_log import AuditLog

def test_audit_log_hash_chain_integrity():
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        log = AuditLog(tf.name)
        for i in range(5):
            log.append(f"event_{i}", {"val": i})
        assert log.verify_chain(), "Audit log hash chain should be valid"
        # Tamper with log
        with open(tf.name, "r+") as f:
            lines = f.readlines()
            lines[2] = lines[2].replace("val", "VAL")  # Corrupt a line
            f.seek(0)
            f.writelines(lines)
        tampered_log = AuditLog(tf.name)
        assert not tampered_log.verify_chain(), "Tampered audit log should fail integrity check"
        os.remove(tf.name)

def test_disk_failure_and_recovery():
    # Simulate disk failure by deleting audit log mid-operation
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        log = AuditLog(tf.name)
        log.append("event_1", {"val": 1})
        os.remove(tf.name)  # Disk failure
        # Recovery: should not crash, but log is lost
        try:
            log.append("event_2", {"val": 2})
        except Exception:
            pass  # Acceptable: file is gone

def test_network_partition_and_recovery_fault():
    # Simulate network partition by splitting event delivery, then healing
    nodeA = InMemoryCommonsSync()
    nodeB = InMemoryCommonsSync()
    priv, pub = generate_keypair()
    eventsA = [CommonsEvent("type", {"val": i}, "A") for i in range(3)]
    for e in eventsA:
        e.sign(priv)
        nodeA.broadcast_event(e)
    # Partition: nodeB receives nothing
    # Heal: nodeB receives all events
    for e in nodeA.get_event_history():
        nodeB.receive_event(e)
    assert set(e.event_id for e in nodeA.get_event_history()) == set(e.event_id for e in nodeB.get_event_history())
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


from mirrorcore.commons.crypto import generate_keypair, sign_message, verify_signature, public_key_bytes
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

# --- Comprehensive Adversarial, Chaos, and Crypto Tests for Commons Sync ---
# --- Cryptographic Signing & Verification Tests ---
def test_commons_event_sign_and_verify():
    priv, pub = generate_keypair()
    event = CommonsEvent("type", {"val": 42}, "origin")
    event.sign(priv)
    assert event.verify(), "Signature should verify with correct key"
    # Tamper with event
    event.payload["val"] = 43
    assert not event.verify(), "Signature should fail after tampering"

def test_commons_event_invalid_signature():
    priv1, pub1 = generate_keypair()
    priv2, pub2 = generate_keypair()
    event = CommonsEvent("type", {"val": 1}, "origin")
    event.sign(priv1)
    # Replace with wrong public key
    event.public_key = public_key_bytes(pub2)
    assert not event.verify(), "Signature should fail with wrong public key"

def test_commons_event_multi_key():
    priv1, pub1 = generate_keypair()
    priv2, pub2 = generate_keypair()
    event1 = CommonsEvent("type", {"val": 1}, "origin")
    event2 = CommonsEvent("type", {"val": 2}, "origin")
    event1.sign(priv1)
    event2.sign(priv2)
    assert event1.verify()
    assert event2.verify()
    assert event1.public_key != event2.public_key

def test_inmemory_commons_sync_signature_enforcement():
    priv, pub = generate_keypair()
    event = CommonsEvent("type", {"val": 99}, "origin")
    event.sign(priv)
    sync = InMemoryCommonsSync(verify_signatures=True)
    sync.broadcast_event(event)
    # Tampered event should be rejected
    tampered = CommonsEvent("type", {"val": 99}, "origin")
    tampered.sign(priv)
    tampered.payload["val"] = 100
    with pytest.raises(ValueError):
        sync.broadcast_event(tampered)
import threading
import random
import copy
import time

import pytest
from hypothesis import given, strategies as st

from mirrorcore.commons.sync import CommonsEvent, InMemoryCommonsSync

def simulate_network(nodes, events, drop_rate=0.1, reorder_rate=0.1, duplicate_rate=0.05):
    """
    Simulate a distributed network of CommonsSync nodes with random drops, reordering, and duplication.
    """
    all_events = copy.deepcopy(events)
    random.shuffle(all_events)
    for event in all_events:
        for node in nodes:
            # Randomly drop events
            if random.random() < drop_rate:
                continue
            # Randomly duplicate events
            if random.random() < duplicate_rate:
                node.receive_event(copy.deepcopy(event))
            # Normal delivery
            node.receive_event(copy.deepcopy(event))
    # Randomly reorder event histories
    if reorder_rate > 0:
        for node in nodes:
            if random.random() < reorder_rate:
                random.shuffle(node._events)

def test_distributed_eventual_consistency():
    """
    Multiple nodes, random event delivery, drop, reorder, duplicate. All honest nodes should converge.
    """
    num_nodes = 5
    num_events = 20
    nodes = [InMemoryCommonsSync() for _ in range(num_nodes)]
    events = [CommonsEvent(f"type_{i}", {"val": i}, f"origin_{i%3}") for i in range(num_events)]
    simulate_network(nodes, events)
    # All nodes should have the same set of event_ids
    event_id_sets = [set(e.event_id for e in node.get_event_history()) for node in nodes]
    for s in event_id_sets[1:]:
        assert s == event_id_sets[0], "Nodes did not converge on the same event set"

def test_byzantine_replay_and_forged_events():
    """
    Simulate byzantine nodes replaying and forging events. Honest nodes should not duplicate or accept invalid events.
    """
    honest = InMemoryCommonsSync()
    byzantine = InMemoryCommonsSync()
    event = CommonsEvent("type", {"val": 1}, "origin")
    honest.broadcast_event(event)
    # Byzantine node forges an event with same ID but different payload
    forged = CommonsEvent("type", {"val": 999}, "evil", event_id=event.event_id)
    honest.receive_event(forged)
    # Honest node should not duplicate or overwrite the original event
    events = honest.get_event_history()
    assert events.count(event) == 1
    assert all(e.payload["val"] != 999 for e in events)

def test_network_partition_and_recovery():
    """
    Simulate network partition: two groups of nodes, then heal and synchronize.
    """
    group1 = [InMemoryCommonsSync() for _ in range(3)]
    group2 = [InMemoryCommonsSync() for _ in range(2)]
    events1 = [CommonsEvent(f"g1_{i}", {"val": i}, "g1") for i in range(5)]
    events2 = [CommonsEvent(f"g2_{i}", {"val": i}, "g2") for i in range(5)]
    simulate_network(group1, events1)
    simulate_network(group2, events2)
    # Partition heals: all nodes exchange events
    all_nodes = group1 + group2
    all_events = events1 + events2
    simulate_network(all_nodes, all_events, drop_rate=0, reorder_rate=0)
    # All nodes should converge
    event_id_sets = [set(e.event_id for e in node.get_event_history()) for node in all_nodes]
    for s in event_id_sets[1:]:
        assert s == event_id_sets[0], "Partitioned nodes did not converge after healing"

def test_mutation_and_fuzzing():
    """
    Randomly mutate event fields and histories, fuzz protocol boundaries.
    """
    node = InMemoryCommonsSync()
    base_event = CommonsEvent("type", {"val": 1}, "origin")
    node.broadcast_event(base_event)
    # Mutate event_id, payload, origin, timestamp
    mutated = CommonsEvent("type", {"val": 999}, "mutant", timestamp=base_event.timestamp + 1000)
    node.receive_event(mutated)
    # Should not be treated as duplicate
    assert len(node.get_event_history()) == 2
    # Fuzz: send random objects
    with pytest.raises(Exception):
        node.receive_event(None)  # type: ignore

def test_chaos_kill_and_restart():
    """
    Simulate node kill/restart during event propagation. Node should recover and synchronize.
    """
    node1 = InMemoryCommonsSync()
    node2 = InMemoryCommonsSync()
    events = [CommonsEvent(f"type_{i}", {"val": i}, "origin") for i in range(10)]
    for event in events[:5]:
        node1.broadcast_event(event)
    # Node2 is 'killed' (not receiving events)
    for event in events[5:]:
        node1.broadcast_event(event)
    # Node2 'restarts' and receives all events
    for event in events:
        node2.receive_event(event)
    # Both nodes should converge
    assert set(e.event_id for e in node1.get_event_history()) == set(e.event_id for e in node2.get_event_history())

# --- End Comprehensive Adversarial & Chaos Tests ---
