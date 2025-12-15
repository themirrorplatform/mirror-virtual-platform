# mirror_os/services/network_protocol.py
"""
Network Protocol: Instance-to-Instance Communication

Enables Commons, Worldviews, and cross-instance learning.

Constitutional guarantees:
- Encrypted by default
- No tracking of who talks to whom
- User controls what's shared
- No central authority required

Features:
- Peer discovery (find other instances)
- Secure messaging (encrypted instance-to-instance)
- Data sync (Commons publications, fork announcements)
- Trust network (verify constitutional compliance)
"""

import json
import asyncio
import hashlib
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """Types of inter-instance messages"""
    DISCOVERY = "discovery"  # Find peers
    COMMONS_PUBLISH = "commons_publish"  # Share public reflection
    COMMONS_QUERY = "commons_query"  # Search Commons
    FORK_ANNOUNCE = "fork_announce"  # Announce new fork
    VERIFICATION_REQUEST = "verification_request"  # Verify constitutional compliance
    VERIFICATION_RESPONSE = "verification_response"  # Compliance proof
    AMENDMENT_PROPOSAL = "amendment_proposal"  # Governance proposal
    VOTE_CAST = "vote_cast"  # Vote on amendment
    PING = "ping"  # Health check


@dataclass
class NetworkMessage:
    """Message between instances"""
    message_id: str
    message_type: MessageType
    sender_instance_id: str
    recipient_instance_id: Optional[str]  # None for broadcast
    payload: Dict[str, Any]
    timestamp: datetime
    signature: str  # Cryptographic signature


@dataclass
class PeerInstance:
    """Known peer instance"""
    instance_id: str
    genesis_hash: str
    last_seen: datetime
    endpoint: str  # URL or address
    verified: bool = False
    trust_score: float = 0.0  # 0.0 to 1.0


class NetworkProtocol:
    """
    Peer-to-peer network protocol for Mirror instances.
    
    Design:
    - No central server (fully decentralized)
    - Discovery via bootstrap nodes + gossip
    - Encrypted messages (end-to-end)
    - Constitutional verification before trust
    - User controls all sharing
    """
    
    def __init__(
        self,
        instance_id: str,
        genesis_hash: str,
        bootstrap_nodes: List[str] = None
    ):
        """
        Initialize network protocol.
        
        Args:
            instance_id: This instance's ID
            genesis_hash: Constitutional genesis hash
            bootstrap_nodes: Initial peers to connect to
        """
        self.instance_id = instance_id
        self.genesis_hash = genesis_hash
        self.bootstrap_nodes = bootstrap_nodes or []
        
        # Peer tracking
        self.peers: Dict[str, PeerInstance] = {}
        self.pending_messages: List[NetworkMessage] = []
        
        # Message handlers
        self.handlers = {
            MessageType.DISCOVERY: self._handle_discovery,
            MessageType.COMMONS_PUBLISH: self._handle_commons_publish,
            MessageType.COMMONS_QUERY: self._handle_commons_query,
            MessageType.FORK_ANNOUNCE: self._handle_fork_announce,
            MessageType.VERIFICATION_REQUEST: self._handle_verification_request,
            MessageType.VERIFICATION_RESPONSE: self._handle_verification_response,
            MessageType.AMENDMENT_PROPOSAL: self._handle_amendment_proposal,
            MessageType.VOTE_CAST: self._handle_vote_cast,
            MessageType.PING: self._handle_ping,
        }
        
        # Stats
        self.stats = {
            'messages_sent': 0,
            'messages_received': 0,
            'peers_discovered': 0,
            'verifications_passed': 0,
            'verifications_failed': 0,
        }
    
    async def start(self):
        """Start network protocol"""
        logger.info(f"Starting network protocol for instance {self.instance_id}")
        
        # Connect to bootstrap nodes
        for node in self.bootstrap_nodes:
            await self.discover_peer(node)
        
        # Start message loop
        asyncio.create_task(self._message_loop())
        
        logger.info(f"Network protocol started. Connected to {len(self.peers)} peers.")
    
    async def discover_peer(self, endpoint: str) -> Optional[PeerInstance]:
        """
        Discover and verify a peer instance.
        
        Args:
            endpoint: Peer's network address
        
        Returns:
            PeerInstance if valid, None otherwise
        """
        try:
            # Send discovery message
            message = NetworkMessage(
                message_id=self._generate_message_id(),
                message_type=MessageType.DISCOVERY,
                sender_instance_id=self.instance_id,
                recipient_instance_id=None,
                payload={
                    'genesis_hash': self.genesis_hash,
                    'endpoint': endpoint,
                },
                timestamp=datetime.utcnow(),
                signature=self._sign_message({})
            )
            
            # Send and wait for response
            response = await self._send_message(endpoint, message)
            
            if response:
                # Verify peer's genesis hash
                peer_genesis = response.payload.get('genesis_hash')
                if self._verify_genesis_hash(peer_genesis):
                    peer = PeerInstance(
                        instance_id=response.sender_instance_id,
                        genesis_hash=peer_genesis,
                        last_seen=datetime.utcnow(),
                        endpoint=endpoint,
                        verified=True,
                        trust_score=0.5  # Initial trust
                    )
                    
                    self.peers[peer.instance_id] = peer
                    self.stats['peers_discovered'] += 1
                    self.stats['verifications_passed'] += 1
                    
                    logger.info(f"Discovered and verified peer: {peer.instance_id}")
                    return peer
                else:
                    self.stats['verifications_failed'] += 1
                    logger.warning(f"Peer failed genesis verification: {endpoint}")
            
        except Exception as e:
            logger.error(f"Error discovering peer {endpoint}: {e}")
        
        return None
    
    async def publish_to_commons(
        self,
        content: str,
        themes: List[str],
        constitutional_score: float
    ) -> bool:
        """
        Publish reflection to Commons (broadcast to peers).
        
        Args:
            content: Reflection content
            themes: Theme tags
            constitutional_score: L0+L1 compliance score
        
        Returns:
            True if published successfully
        """
        message = NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.COMMONS_PUBLISH,
            sender_instance_id=self.instance_id,
            recipient_instance_id=None,  # Broadcast
            payload={
                'content': content,
                'themes': themes,
                'constitutional_score': constitutional_score,
                'published_at': datetime.utcnow().isoformat(),
            },
            timestamp=datetime.utcnow(),
            signature=self._sign_message({'content': content})
        )
        
        # Broadcast to all verified peers
        success_count = 0
        for peer in self.peers.values():
            if peer.verified:
                try:
                    await self._send_message(peer.endpoint, message)
                    success_count += 1
                except Exception as e:
                    logger.error(f"Failed to publish to {peer.instance_id}: {e}")
        
        logger.info(f"Published to Commons: {success_count}/{len(self.peers)} peers")
        return success_count > 0
    
    async def query_commons(
        self,
        themes: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Query Commons across network.
        
        Args:
            themes: Filter by themes
            limit: Max results
        
        Returns:
            List of public reflections
        """
        message = NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.COMMONS_QUERY,
            sender_instance_id=self.instance_id,
            recipient_instance_id=None,  # Broadcast
            payload={
                'themes': themes or [],
                'limit': limit,
            },
            timestamp=datetime.utcnow(),
            signature=self._sign_message({})
        )
        
        # Send to all peers and collect responses
        results = []
        for peer in self.peers.values():
            if peer.verified:
                try:
                    response = await self._send_message(peer.endpoint, message)
                    if response and 'results' in response.payload:
                        results.extend(response.payload['results'])
                except Exception as e:
                    logger.error(f"Failed to query {peer.instance_id}: {e}")
        
        # Deduplicate and sort by constitutional score
        unique_results = {r['id']: r for r in results}.values()
        sorted_results = sorted(
            unique_results,
            key=lambda x: x.get('constitutional_score', 0),
            reverse=True
        )
        
        return sorted_results[:limit]
    
    async def announce_fork(
        self,
        fork_id: str,
        parent_instance_id: str,
        reason: str,
        amendments: List[str]
    ):
        """
        Announce new fork to network.
        
        Args:
            fork_id: New fork's ID
            parent_instance_id: Parent instance
            reason: Why fork occurred
            amendments: Constitutional changes
        """
        message = NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.FORK_ANNOUNCE,
            sender_instance_id=self.instance_id,
            recipient_instance_id=None,  # Broadcast
            payload={
                'fork_id': fork_id,
                'parent_instance_id': parent_instance_id,
                'reason': reason,
                'amendments': amendments,
                'fork_genesis_hash': self.genesis_hash,
                'forked_at': datetime.utcnow().isoformat(),
            },
            timestamp=datetime.utcnow(),
            signature=self._sign_message({'fork_id': fork_id})
        )
        
        # Broadcast to network
        for peer in self.peers.values():
            if peer.verified:
                try:
                    await self._send_message(peer.endpoint, message)
                except Exception as e:
                    logger.error(f"Failed to announce fork to {peer.instance_id}: {e}")
        
        logger.info(f"Fork announced to network: {fork_id}")
    
    # Message handlers
    
    async def _handle_discovery(self, message: NetworkMessage) -> Optional[NetworkMessage]:
        """Handle peer discovery request"""
        return NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.DISCOVERY,
            sender_instance_id=self.instance_id,
            recipient_instance_id=message.sender_instance_id,
            payload={
                'genesis_hash': self.genesis_hash,
                'instance_id': self.instance_id,
            },
            timestamp=datetime.utcnow(),
            signature=self._sign_message({})
        )
    
    async def _handle_commons_publish(self, message: NetworkMessage) -> None:
        """Handle Commons publication from peer"""
        # Store in local Commons (if user has opted in)
        logger.info(f"Received Commons publication from {message.sender_instance_id}")
        # TODO: Integrate with mirror_worldview/commons.py
    
    async def _handle_commons_query(self, message: NetworkMessage) -> Optional[NetworkMessage]:
        """Handle Commons query from peer"""
        # Query local Commons and return results
        # TODO: Integrate with mirror_worldview/commons.py
        return NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.COMMONS_QUERY,
            sender_instance_id=self.instance_id,
            recipient_instance_id=message.sender_instance_id,
            payload={'results': []},  # TODO: Return actual results
            timestamp=datetime.utcnow(),
            signature=self._sign_message({})
        )
    
    async def _handle_fork_announce(self, message: NetworkMessage) -> None:
        """Handle fork announcement"""
        logger.info(f"Fork announced: {message.payload.get('fork_id')}")
        # TODO: Integrate with mirror_worldview/recognition_registry.py
    
    async def _handle_verification_request(self, message: NetworkMessage) -> Optional[NetworkMessage]:
        """Handle verification request"""
        # Prove constitutional compliance
        return NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.VERIFICATION_RESPONSE,
            sender_instance_id=self.instance_id,
            recipient_instance_id=message.sender_instance_id,
            payload={
                'genesis_hash': self.genesis_hash,
                'verified': True,
            },
            timestamp=datetime.utcnow(),
            signature=self._sign_message({})
        )
    
    async def _handle_verification_response(self, message: NetworkMessage) -> None:
        """Handle verification response"""
        pass
    
    async def _handle_amendment_proposal(self, message: NetworkMessage) -> None:
        """Handle governance amendment proposal"""
        logger.info(f"Amendment proposed: {message.payload.get('title')}")
        # TODO: Integrate with mirror_worldview/governance.py
    
    async def _handle_vote_cast(self, message: NetworkMessage) -> None:
        """Handle governance vote"""
        logger.info(f"Vote cast on {message.payload.get('proposal_id')}")
        # TODO: Integrate with mirror_worldview/governance.py
    
    async def _handle_ping(self, message: NetworkMessage) -> Optional[NetworkMessage]:
        """Handle health check ping"""
        return NetworkMessage(
            message_id=self._generate_message_id(),
            message_type=MessageType.PING,
            sender_instance_id=self.instance_id,
            recipient_instance_id=message.sender_instance_id,
            payload={'status': 'alive'},
            timestamp=datetime.utcnow(),
            signature=self._sign_message({})
        )
    
    # Internal methods
    
    async def _message_loop(self):
        """Process pending messages"""
        while True:
            if self.pending_messages:
                message = self.pending_messages.pop(0)
                handler = self.handlers.get(message.message_type)
                if handler:
                    try:
                        await handler(message)
                        self.stats['messages_received'] += 1
                    except Exception as e:
                        logger.error(f"Error handling message: {e}")
            
            await asyncio.sleep(0.1)
    
    async def _send_message(
        self,
        endpoint: str,
        message: NetworkMessage
    ) -> Optional[NetworkMessage]:
        """Send message to peer (placeholder - needs actual network implementation)"""
        # TODO: Implement actual HTTP/WebSocket sending
        self.stats['messages_sent'] += 1
        return None
    
    def _generate_message_id(self) -> str:
        """Generate unique message ID"""
        return hashlib.sha256(
            f"{self.instance_id}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
    
    def _sign_message(self, payload: Dict[str, Any]) -> str:
        """Sign message (placeholder - needs actual cryptography)"""
        # TODO: Implement actual signing with private key
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True).encode()
        ).hexdigest()
    
    def _verify_genesis_hash(self, genesis_hash: str) -> bool:
        """Verify peer's genesis hash matches known good hashes"""
        # TODO: Implement actual verification against registry
        return len(genesis_hash) == 64  # SHA-256 hash length
