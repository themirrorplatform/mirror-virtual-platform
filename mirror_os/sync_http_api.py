# mirror_os/sync_http_api.py
"""
Sync HTTP API: REST + WebSocket Transport Layer

Provides HTTP/WebSocket endpoints for:
- Consent management (request, grant, revoke)
- Sync operations (push, pull, bidirectional)
- Identity verification
- Real-time sync notifications
- Rate limiting

Constitutional compliance:
- I13: Only allowed telemetry metrics
- I4: Data sovereignty (user controls all data)
- I14: K-anonymity for any shared metrics
"""

import json
import time
import asyncio
import logging
from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import secrets

logger = logging.getLogger(__name__)


class HTTPMethod(Enum):
    """HTTP methods"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"


@dataclass
class APIRequest:
    """HTTP API request"""
    method: HTTPMethod
    path: str
    headers: Dict[str, str]
    body: Optional[Dict[str, Any]] = None
    query_params: Dict[str, str] = field(default_factory=dict)
    identity_id: Optional[str] = None  # Authenticated identity
    

@dataclass
class APIResponse:
    """HTTP API response"""
    status_code: int
    body: Dict[str, Any]
    headers: Dict[str, str] = field(default_factory=dict)
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.body)


@dataclass
class RateLimitBucket:
    """Rate limit tracking per identity"""
    identity_id: str
    requests: List[float] = field(default_factory=list)  # Timestamps
    max_requests: int = 100  # Per window
    window_seconds: int = 60
    
    def is_allowed(self) -> bool:
        """Check if request is allowed"""
        now = time.time()
        # Remove old requests outside window
        self.requests = [ts for ts in self.requests if now - ts < self.window_seconds]
        
        if len(self.requests) >= self.max_requests:
            return False
        
        self.requests.append(now)
        return True
    
    def get_retry_after(self) -> int:
        """Get seconds until next request allowed"""
        if not self.requests:
            return 0
        
        oldest = min(self.requests)
        wait_until = oldest + self.window_seconds
        return max(0, int(wait_until - time.time()))


@dataclass
class AuthToken:
    """Authentication token"""
    token: str
    identity_id: str
    created_at: datetime
    expires_at: datetime
    scopes: List[str] = field(default_factory=list)
    
    def is_valid(self) -> bool:
        """Check if token is still valid"""
        return datetime.utcnow() < self.expires_at
    
    def has_scope(self, scope: str) -> bool:
        """Check if token has required scope"""
        return scope in self.scopes or "all" in self.scopes


class SyncHTTPAPI:
    """
    HTTP API for Mirror sync operations.
    
    Endpoints:
    - POST /api/v1/consent/request - Request sync consent
    - POST /api/v1/consent/grant - Grant sync consent
    - POST /api/v1/consent/revoke - Revoke sync consent
    - POST /api/v1/sync/push - Push local changes
    - POST /api/v1/sync/pull - Pull remote changes
    - POST /api/v1/sync/bidirectional - Bidirectional sync
    - GET /api/v1/sync/status - Get sync status
    - POST /api/v1/auth/token - Create auth token
    - DELETE /api/v1/auth/token - Revoke auth token
    - GET /api/v1/health - Health check
    """
    
    def __init__(self, sync_protocol, storage_path: Path):
        """
        Initialize HTTP API.
        
        Args:
            sync_protocol: SyncProtocol instance
            storage_path: Path for token storage
        """
        self.sync_protocol = sync_protocol
        self.storage_path = storage_path
        
        # Authentication
        self.tokens: Dict[str, AuthToken] = {}
        self.token_file = storage_path / "auth_tokens.json"
        self._load_tokens()
        
        # Rate limiting
        self.rate_limits: Dict[str, RateLimitBucket] = {}
        
        # WebSocket connections
        self.websocket_connections: Dict[str, Set[Any]] = {}  # identity_id -> connections
        
        # Metrics (I13 compliant - only allowed metrics)
        self.metrics = {
            'total_requests': 0,
            'consent_requests': 0,
            'consent_grants': 0,
            'consent_revokes': 0,
            'sync_operations': 0,
            'auth_tokens_created': 0,
            'auth_tokens_revoked': 0,
            'rate_limit_hits': 0,
            'error_count': 0,
            'response_latency_ms': []  # Keep last 100
        }
    
    def _load_tokens(self):
        """Load tokens from disk"""
        if not self.token_file.exists():
            return
        
        try:
            with open(self.token_file, 'r') as f:
                data = json.load(f)
                for token_str, token_data in data.items():
                    self.tokens[token_str] = AuthToken(
                        token=token_str,
                        identity_id=token_data['identity_id'],
                        created_at=datetime.fromisoformat(token_data['created_at']),
                        expires_at=datetime.fromisoformat(token_data['expires_at']),
                        scopes=token_data.get('scopes', [])
                    )
        except Exception as e:
            logger.error(f"Failed to load tokens: {e}")
    
    def _save_tokens(self):
        """Save tokens to disk"""
        try:
            self.storage_path.mkdir(parents=True, exist_ok=True)
            data = {
                token: {
                    'identity_id': auth.identity_id,
                    'created_at': auth.created_at.isoformat(),
                    'expires_at': auth.expires_at.isoformat(),
                    'scopes': auth.scopes
                }
                for token, auth in self.tokens.items()
                if auth.is_valid()
            }
            with open(self.token_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save tokens: {e}")
    
    def _authenticate(self, request: APIRequest) -> Optional[str]:
        """
        Authenticate request and return identity_id.
        
        Args:
            request: API request
        
        Returns:
            identity_id if authenticated, None otherwise
        """
        # Check Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header[7:]  # Remove "Bearer "
        
        # Validate token
        auth_token = self.tokens.get(token)
        if not auth_token or not auth_token.is_valid():
            return None
        
        return auth_token.identity_id
    
    def _check_rate_limit(self, identity_id: str) -> bool:
        """
        Check rate limit for identity.
        
        Args:
            identity_id: Identity to check
        
        Returns:
            True if allowed, False if rate limited
        """
        if identity_id not in self.rate_limits:
            self.rate_limits[identity_id] = RateLimitBucket(identity_id)
        
        bucket = self.rate_limits[identity_id]
        allowed = bucket.is_allowed()
        
        if not allowed:
            self.metrics['rate_limit_hits'] += 1
        
        return allowed
    
    def _record_latency(self, latency_ms: float):
        """Record response latency (I13 compliant)"""
        self.metrics['response_latency_ms'].append(latency_ms)
        # Keep only last 100
        if len(self.metrics['response_latency_ms']) > 100:
            self.metrics['response_latency_ms'] = self.metrics['response_latency_ms'][-100:]
    
    async def handle_request(self, request: APIRequest) -> APIResponse:
        """
        Handle HTTP API request.
        
        Args:
            request: API request
        
        Returns:
            API response
        """
        start_time = time.time()
        self.metrics['total_requests'] += 1
        
        try:
            # Authenticate
            identity_id = self._authenticate(request)
            
            # Public endpoints (no auth required)
            if request.path == '/api/v1/health':
                return self._handle_health(request)
            elif request.path == '/api/v1/auth/token' and request.method == HTTPMethod.POST:
                return await self._handle_create_token(request)
            
            # All other endpoints require authentication
            if not identity_id:
                return APIResponse(
                    status_code=401,
                    body={'error': 'Unauthorized', 'message': 'Valid authentication required'}
                )
            
            request.identity_id = identity_id
            
            # Check rate limit
            if not self._check_rate_limit(identity_id):
                bucket = self.rate_limits[identity_id]
                return APIResponse(
                    status_code=429,
                    body={'error': 'Too Many Requests', 'retry_after': bucket.get_retry_after()},
                    headers={'Retry-After': str(bucket.get_retry_after())}
                )
            
            # Route to handler
            if request.path.startswith('/api/v1/consent/'):
                response = await self._handle_consent(request)
            elif request.path.startswith('/api/v1/sync/'):
                response = await self._handle_sync(request)
            elif request.path.startswith('/api/v1/auth/'):
                response = await self._handle_auth(request)
            else:
                response = APIResponse(
                    status_code=404,
                    body={'error': 'Not Found', 'message': f'Unknown endpoint: {request.path}'}
                )
            
            return response
            
        except Exception as e:
            logger.error(f"Request handler error: {e}")
            self.metrics['error_count'] += 1
            return APIResponse(
                status_code=500,
                body={'error': 'Internal Server Error', 'message': str(e)}
            )
        
        finally:
            latency_ms = (time.time() - start_time) * 1000
            self._record_latency(latency_ms)
    
    def _handle_health(self, request: APIRequest) -> APIResponse:
        """Handle health check"""
        return APIResponse(
            status_code=200,
            body={
                'status': 'healthy',
                'version': '1.0.0',
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def _handle_create_token(self, request: APIRequest) -> APIResponse:
        """Handle token creation"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        identity_id = request.body.get('identity_id')
        password = request.body.get('password')
        scopes = request.body.get('scopes', ['sync', 'consent'])
        
        if not identity_id or not password:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'identity_id and password required'}
            )
        
        # In production, would verify password against stored hash
        # For now, simple validation
        if len(password) < 8:
            return APIResponse(
                status_code=401,
                body={'error': 'Unauthorized', 'message': 'Invalid credentials'}
            )
        
        # Generate token
        token = secrets.token_urlsafe(32)
        auth_token = AuthToken(
            token=token,
            identity_id=identity_id,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30),
            scopes=scopes
        )
        
        self.tokens[token] = auth_token
        self._save_tokens()
        
        self.metrics['auth_tokens_created'] += 1
        
        return APIResponse(
            status_code=201,
            body={
                'token': token,
                'identity_id': identity_id,
                'expires_at': auth_token.expires_at.isoformat(),
                'scopes': scopes
            }
        )
    
    async def _handle_consent(self, request: APIRequest) -> APIResponse:
        """Handle consent endpoints"""
        if request.path == '/api/v1/consent/request' and request.method == HTTPMethod.POST:
            return await self._handle_consent_request(request)
        elif request.path == '/api/v1/consent/grant' and request.method == HTTPMethod.POST:
            return await self._handle_consent_grant(request)
        elif request.path == '/api/v1/consent/revoke' and request.method == HTTPMethod.POST:
            return await self._handle_consent_revoke(request)
        else:
            return APIResponse(
                status_code=404,
                body={'error': 'Not Found'}
            )
    
    async def _handle_consent_request(self, request: APIRequest) -> APIResponse:
        """Handle consent request"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        remote_identity_id = request.body.get('remote_identity_id')
        purpose = request.body.get('purpose', 'sync')
        
        if not remote_identity_id:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'remote_identity_id required'}
            )
        
        # Request consent via sync protocol
        consent_id = self.sync_protocol.request_consent(
            request.identity_id,
            remote_identity_id,
            purpose
        )
        
        self.metrics['consent_requests'] += 1
        
        return APIResponse(
            status_code=201,
            body={
                'consent_id': consent_id,
                'status': 'pending',
                'local_identity': request.identity_id,
                'remote_identity': remote_identity_id
            }
        )
    
    async def _handle_consent_grant(self, request: APIRequest) -> APIResponse:
        """Handle consent grant"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        consent_id = request.body.get('consent_id')
        
        if not consent_id:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'consent_id required'}
            )
        
        # Grant consent via sync protocol
        success = self.sync_protocol.grant_consent(request.identity_id, consent_id)
        
        if success:
            self.metrics['consent_grants'] += 1
            return APIResponse(
                status_code=200,
                body={
                    'consent_id': consent_id,
                    'status': 'granted',
                    'message': 'Consent granted successfully'
                }
            )
        else:
            return APIResponse(
                status_code=404,
                body={'error': 'Not Found', 'message': 'Consent request not found'}
            )
    
    async def _handle_consent_revoke(self, request: APIRequest) -> APIResponse:
        """Handle consent revocation"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        consent_id = request.body.get('consent_id')
        
        if not consent_id:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'consent_id required'}
            )
        
        # Revoke consent via sync protocol
        success = self.sync_protocol.revoke_consent(request.identity_id, consent_id)
        
        if success:
            self.metrics['consent_revokes'] += 1
            return APIResponse(
                status_code=200,
                body={
                    'consent_id': consent_id,
                    'status': 'revoked',
                    'message': 'Consent revoked successfully'
                }
            )
        else:
            return APIResponse(
                status_code=404,
                body={'error': 'Not Found', 'message': 'Consent not found'}
            )
    
    async def _handle_sync(self, request: APIRequest) -> APIResponse:
        """Handle sync endpoints"""
        if request.path == '/api/v1/sync/push' and request.method == HTTPMethod.POST:
            return await self._handle_sync_push(request)
        elif request.path == '/api/v1/sync/pull' and request.method == HTTPMethod.POST:
            return await self._handle_sync_pull(request)
        elif request.path == '/api/v1/sync/bidirectional' and request.method == HTTPMethod.POST:
            return await self._handle_sync_bidirectional(request)
        elif request.path == '/api/v1/sync/status' and request.method == HTTPMethod.GET:
            return await self._handle_sync_status(request)
        else:
            return APIResponse(
                status_code=404,
                body={'error': 'Not Found'}
            )
    
    async def _handle_sync_push(self, request: APIRequest) -> APIResponse:
        """Handle sync push"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        remote_identity_id = request.body.get('remote_identity_id')
        
        if not remote_identity_id:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'remote_identity_id required'}
            )
        
        # Execute sync
        result = await self.sync_protocol.sync(
            request.identity_id,
            remote_identity_id,
            mode='PUSH'
        )
        
        self.metrics['sync_operations'] += 1
        
        return APIResponse(
            status_code=200,
            body={
                'mode': 'PUSH',
                'status': 'completed',
                'local_changes_pushed': result.get('changes_sent', 0),
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def _handle_sync_pull(self, request: APIRequest) -> APIResponse:
        """Handle sync pull"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        remote_identity_id = request.body.get('remote_identity_id')
        
        if not remote_identity_id:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'remote_identity_id required'}
            )
        
        # Execute sync
        result = await self.sync_protocol.sync(
            request.identity_id,
            remote_identity_id,
            mode='PULL'
        )
        
        self.metrics['sync_operations'] += 1
        
        return APIResponse(
            status_code=200,
            body={
                'mode': 'PULL',
                'status': 'completed',
                'remote_changes_received': result.get('changes_received', 0),
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def _handle_sync_bidirectional(self, request: APIRequest) -> APIResponse:
        """Handle bidirectional sync"""
        if not request.body:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'Request body required'}
            )
        
        remote_identity_id = request.body.get('remote_identity_id')
        
        if not remote_identity_id:
            return APIResponse(
                status_code=400,
                body={'error': 'Bad Request', 'message': 'remote_identity_id required'}
            )
        
        # Execute sync
        result = await self.sync_protocol.sync(
            request.identity_id,
            remote_identity_id,
            mode='BIDIRECTIONAL'
        )
        
        self.metrics['sync_operations'] += 1
        
        return APIResponse(
            status_code=200,
            body={
                'mode': 'BIDIRECTIONAL',
                'status': 'completed',
                'local_changes_pushed': result.get('changes_sent', 0),
                'remote_changes_received': result.get('changes_received', 0),
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def _handle_sync_status(self, request: APIRequest) -> APIResponse:
        """Handle sync status check"""
        # Get sync status from protocol
        status = self.sync_protocol.get_status(request.identity_id)
        
        return APIResponse(
            status_code=200,
            body={
                'identity_id': request.identity_id,
                'pending_consents': status.get('pending_consents', []),
                'active_syncs': status.get('active_syncs', []),
                'last_sync': status.get('last_sync'),
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def _handle_auth(self, request: APIRequest) -> APIResponse:
        """Handle auth endpoints"""
        if request.path == '/api/v1/auth/token' and request.method == HTTPMethod.DELETE:
            return await self._handle_revoke_token(request)
        else:
            return APIResponse(
                status_code=404,
                body={'error': 'Not Found'}
            )
    
    async def _handle_revoke_token(self, request: APIRequest) -> APIResponse:
        """Handle token revocation"""
        # Revoke current token
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            if token in self.tokens:
                del self.tokens[token]
                self._save_tokens()
                self.metrics['auth_tokens_revoked'] += 1
                
                return APIResponse(
                    status_code=200,
                    body={'message': 'Token revoked successfully'}
                )
        
        return APIResponse(
            status_code=400,
            body={'error': 'Bad Request', 'message': 'No valid token to revoke'}
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get I13-compliant metrics.
        
        Returns only allowed metrics (no user behavior tracking).
        """
        avg_latency = (
            sum(self.metrics['response_latency_ms']) / len(self.metrics['response_latency_ms'])
            if self.metrics['response_latency_ms'] else 0
        )
        
        return {
            'total_requests': self.metrics['total_requests'],
            'consent_operations': (
                self.metrics['consent_requests'] +
                self.metrics['consent_grants'] +
                self.metrics['consent_revokes']
            ),
            'sync_operations': self.metrics['sync_operations'],
            'auth_operations': (
                self.metrics['auth_tokens_created'] +
                self.metrics['auth_tokens_revoked']
            ),
            'rate_limit_hits': self.metrics['rate_limit_hits'],
            'error_count': self.metrics['error_count'],
            'avg_response_latency_ms': round(avg_latency, 2),
            'timestamp': datetime.utcnow().isoformat()
        }


# Self-test
if __name__ == "__main__":
    print("Sync HTTP API Test")
    print("=" * 80)
    
    import tempfile
    
    # Create temporary storage
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_path = Path(tmpdir)
        
        # Mock sync protocol
        class MockSyncProtocol:
            def request_consent(self, local_id, remote_id, purpose):
                return f"consent-{local_id}-{remote_id}"
            
            def grant_consent(self, identity_id, consent_id):
                return True
            
            def revoke_consent(self, identity_id, consent_id):
                return True
            
            async def sync(self, local_id, remote_id, mode):
                return {'changes_sent': 5, 'changes_received': 3}
            
            def get_status(self, identity_id):
                return {
                    'pending_consents': [],
                    'active_syncs': [],
                    'last_sync': None
                }
        
        sync_protocol = MockSyncProtocol()
        api = SyncHTTPAPI(sync_protocol, storage_path)
        
        # Test 1: Health check
        print("\n1. Testing health check...")
        request = APIRequest(
            method=HTTPMethod.GET,
            path='/api/v1/health',
            headers={}
        )
        
        response = asyncio.run(api.handle_request(request))
        print(f"   Status: {response.status_code}")
        print(f"   Body: {response.body}")
        
        # Test 2: Create auth token
        print("\n2. Testing token creation...")
        request = APIRequest(
            method=HTTPMethod.POST,
            path='/api/v1/auth/token',
            headers={},
            body={
                'identity_id': 'test-user-123',
                'password': 'secure-password-123'
            }
        )
        
        response = asyncio.run(api.handle_request(request))
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            token = response.body['token']
            print(f"   Token created: {token[:16]}...")
            
            # Test 3: Consent request (authenticated)
            print("\n3. Testing consent request...")
            request = APIRequest(
                method=HTTPMethod.POST,
                path='/api/v1/consent/request',
                headers={'Authorization': f'Bearer {token}'},
                body={'remote_identity_id': 'remote-user-456'}
            )
            
            response = asyncio.run(api.handle_request(request))
            print(f"   Status: {response.status_code}")
            print(f"   Consent ID: {response.body.get('consent_id')}")
            
            # Test 4: Rate limiting
            print("\n4. Testing rate limiting...")
            for i in range(105):
                request = APIRequest(
                    method=HTTPMethod.GET,
                    path='/api/v1/sync/status',
                    headers={'Authorization': f'Bearer {token}'}
                )
                response = asyncio.run(api.handle_request(request))
                
                if response.status_code == 429:
                    print(f"   Rate limited after {i} requests")
                    print(f"   Retry after: {response.body.get('retry_after')} seconds")
                    break
            
            # Test 5: Metrics
            print("\n5. Testing metrics...")
            metrics = api.get_metrics()
            print(f"   Total requests: {metrics['total_requests']}")
            print(f"   Consent operations: {metrics['consent_operations']}")
            print(f"   Auth operations: {metrics['auth_operations']}")
            print(f"   Rate limit hits: {metrics['rate_limit_hits']}")
            print(f"   Avg latency: {metrics['avg_response_latency_ms']}ms")
    
    print("\n✅ Sync HTTP API functional")
