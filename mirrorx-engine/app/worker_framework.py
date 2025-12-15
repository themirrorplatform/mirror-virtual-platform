"""
Worker Framework for Mirror
Registration, sandbox execution, proposal validation

Workers are isolated code units that:
1. Receive inputs via CapabilityContract
2. Execute in sandbox (no network, limited filesystem)
3. Return proposals (never direct writes)
4. Get validated against constitution
"""
import json
import subprocess
import tempfile
import os
import sys
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
import secrets

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'mirrorx-engine', 'app'))
from capability_contract import CapabilityContract, CapabilityResponse, CapabilityValidator
from canonical_signing import Ed25519Signer, Ed25519Verifier


class WorkerStatus(str, Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class WorkerManifest:
    """Worker registration manifest"""
    def __init__(
        self,
        worker_id: str,
        name: str,
        description: str,
        version: str,
        code: str,  # Python code
        entrypoint: str,  # Function name to call
        required_permissions: List[str],
        input_schema: Dict[str, Any],
        output_schema: Dict[str, Any],
        author: str,
        signature: Optional[str] = None,
        status: WorkerStatus = WorkerStatus.PROPOSED
    ):
        self.worker_id = worker_id
        self.name = name
        self.description = description
        self.version = version
        self.code = code
        self.entrypoint = entrypoint
        self.required_permissions = required_permissions
        self.input_schema = input_schema
        self.output_schema = output_schema
        self.author = author
        self.signature = signature
        self.status = status
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "worker_id": self.worker_id,
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "code": self.code,
            "entrypoint": self.entrypoint,
            "required_permissions": self.required_permissions,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "author": self.author,
            "status": self.status.value
        }


class SandboxExecutor:
    """Execute worker code in isolated sandbox"""
    
    def __init__(self, timeout_seconds: int = 30):
        self.timeout_seconds = timeout_seconds
    
    def execute(
        self,
        code: str,
        entrypoint: str,
        input_data: Dict[str, Any],
        allowed_imports: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Execute worker code in sandbox
        
        Returns:
            Dict with 'result' or 'error'
        """
        # Create isolated environment
        sandbox_code = self._build_sandbox_code(
            code=code,
            entrypoint=entrypoint,
            input_data=input_data,
            allowed_imports=allowed_imports or ['json', 'datetime', 'typing']
        )
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.py',
            delete=False
        ) as f:
            f.write(sandbox_code)
            temp_path = f.name
        
        try:
            # Execute in isolated process
            result = subprocess.run(
                [sys.executable, temp_path],
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
                env={'PYTHONPATH': ''}  # Minimal environment
            )
            
            if result.returncode != 0:
                return {
                    'error': f"Execution failed: {result.stderr}",
                    'exit_code': result.returncode
                }
            
            # Parse output
            try:
                output = json.loads(result.stdout)
                return {'result': output}
            except json.JSONDecodeError:
                return {'error': f"Invalid JSON output: {result.stdout}"}
        
        except subprocess.TimeoutExpired:
            return {'error': f"Execution timeout ({self.timeout_seconds}s)"}
        
        except Exception as e:
            return {'error': f"Execution error: {str(e)}"}
        
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def _build_sandbox_code(
        self,
        code: str,
        entrypoint: str,
        input_data: Dict[str, Any],
        allowed_imports: List[str]
    ) -> str:
        """Build sandboxed Python code"""
        # Import whitelist
        import_section = "\n".join(f"import {imp}" for imp in allowed_imports)
        
        # Serialize input
        input_json = json.dumps(input_data)
        
        # Build complete code
        sandbox = f"""
{import_section}

# Worker code
{code}

# Execute
if __name__ == '__main__':
    try:
        input_data = {input_json}
        result = {entrypoint}(input_data)
        print(json.dumps({{"result": result}}))
    except Exception as e:
        print(json.dumps({{"error": str(e)}}))
"""
        return sandbox


class WorkerRegistry:
    """Registry of approved workers"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize worker registry database"""
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS workers (
                worker_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                version TEXT NOT NULL,
                code TEXT NOT NULL,
                entrypoint TEXT NOT NULL,
                required_permissions TEXT,  -- JSON array
                input_schema TEXT,  -- JSON
                output_schema TEXT,  -- JSON
                author TEXT NOT NULL,
                signature TEXT,
                status TEXT NOT NULL DEFAULT 'proposed',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                approved_at TEXT,
                approved_by TEXT
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_workers_author ON workers(author)")
        
        conn.commit()
        conn.close()
    
    def register(self, manifest: WorkerManifest) -> str:
        """Register worker (initially as PROPOSED)"""
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO workers
            (worker_id, name, description, version, code, entrypoint, 
             required_permissions, input_schema, output_schema, author, signature, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            manifest.worker_id,
            manifest.name,
            manifest.description,
            manifest.version,
            manifest.code,
            manifest.entrypoint,
            json.dumps(manifest.required_permissions),
            json.dumps(manifest.input_schema),
            json.dumps(manifest.output_schema),
            manifest.author,
            manifest.signature,
            manifest.status.value
        ))
        
        conn.commit()
        conn.close()
        
        return manifest.worker_id
    
    def approve(self, worker_id: str, approved_by: str):
        """Approve worker for use"""
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE workers
            SET status = ?, approved_at = ?, approved_by = ?
            WHERE worker_id = ?
        """, (
            WorkerStatus.APPROVED.value,
            datetime.utcnow().isoformat(),
            approved_by,
            worker_id
        ))
        
        conn.commit()
        conn.close()
    
    def get_worker(self, worker_id: str) -> Optional[WorkerManifest]:
        """Get worker by ID"""
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT worker_id, name, description, version, code, entrypoint,
                   required_permissions, input_schema, output_schema, author, signature, status
            FROM workers
            WHERE worker_id = ?
        """, (worker_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return WorkerManifest(
            worker_id=row[0],
            name=row[1],
            description=row[2],
            version=row[3],
            code=row[4],
            entrypoint=row[5],
            required_permissions=json.loads(row[6]),
            input_schema=json.loads(row[7]),
            output_schema=json.loads(row[8]),
            author=row[9],
            signature=row[10],
            status=WorkerStatus(row[11])
        )
    
    def list_workers(self, status: Optional[WorkerStatus] = None) -> List[WorkerManifest]:
        """List workers with optional status filter"""
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT worker_id, name, description, version, code, entrypoint,
                       required_permissions, input_schema, output_schema, author, signature, status
                FROM workers
                WHERE status = ?
                ORDER BY created_at DESC
            """, (status.value,))
        else:
            cursor.execute("""
                SELECT worker_id, name, description, version, code, entrypoint,
                       required_permissions, input_schema, output_schema, author, signature, status
                FROM workers
                ORDER BY created_at DESC
            """)
        
        rows = cursor.fetchall()
        conn.close()
        
        workers = []
        for row in rows:
            worker = WorkerManifest(
                worker_id=row[0],
                name=row[1],
                description=row[2],
                version=row[3],
                code=row[4],
                entrypoint=row[5],
                required_permissions=json.loads(row[6]),
                input_schema=json.loads(row[7]),
                output_schema=json.loads(row[8]),
                author=row[9],
                signature=row[10],
                status=WorkerStatus(row[11])
            )
            workers.append(worker)
        
        return workers


class SafetyWorker:
    """
    Built-in safety worker - validates all proposals against constitution
    This is the FIRST worker, always active
    """
    
    CONSTITUTIONAL_VIOLATIONS = {
        "prescription": [
            "you should", "you need to", "you must", "you ought to",
            "i recommend", "i suggest you", "my advice", "the right thing"
        ],
        "normative": [
            "that's good", "that's bad", "you're right", "you're wrong",
            "healthy", "unhealthy", "productive", "unproductive"
        ],
        "engagement_bait": [
            "keep me updated", "let me know", "i'm curious", "can't wait",
            "looking forward", "check back"
        ],
        "hidden_inference": [
            "it seems like", "this suggests", "deep down", "the real issue",
            "what's really happening"
        ]
    }
    
    @staticmethod
    def validate_proposal(proposal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate proposal against constitution
        
        Returns:
            {
                "valid": bool,
                "violations": List[str],
                "reason": str
            }
        """
        violations = []
        
        # Extract text content from proposal
        content = str(proposal).lower()
        
        # Check each violation category
        for category, patterns in SafetyWorker.CONSTITUTIONAL_VIOLATIONS.items():
            for pattern in patterns:
                if pattern in content:
                    violations.append(f"{category}: '{pattern}'")
        
        # Check for direct database writes (forbidden)
        if any(word in content for word in ['insert', 'update', 'delete', 'drop']):
            violations.append("direct_database_write: SQL operations detected")
        
        # Check for bypass attempts
        if any(word in content for word in ['bypass', 'skip_validation', 'override']):
            violations.append("bypass_attempt: Trying to circumvent validation")
        
        if violations:
            return {
                "valid": False,
                "violations": violations,
                "reason": f"Constitutional violations detected: {', '.join(violations)}"
            }
        
        return {
            "valid": True,
            "violations": [],
            "reason": "Proposal passes constitutional checks"
        }


# Example worker: Pattern Detector
PATTERN_DETECTOR_WORKER = WorkerManifest(
    worker_id="worker_pattern_detector_v1",
    name="Pattern Detector",
    description="Detects recurring patterns in user reflections",
    version="1.0.0",
    code="""
def detect_patterns(input_data):
    \"\"\"Detect patterns in reflections\"\"\"
    reflections = input_data.get('reflections', [])
    
    # Simple pattern detection: word frequency
    word_counts = {}
    for reflection in reflections:
        content = reflection.get('content', '').lower()
        words = content.split()
        for word in words:
            if len(word) > 4:  # Skip short words
                word_counts[word] = word_counts.get(word, 0) + 1
    
    # Find patterns (words appearing in multiple reflections)
    patterns = []
    for word, count in word_counts.items():
        if count >= 3:  # Appears at least 3 times
            patterns.append({
                'pattern': word,
                'frequency': count,
                'type': 'recurring_word'
            })
    
    return {
        'patterns': sorted(patterns, key=lambda x: x['frequency'], reverse=True)[:10],
        'total_reflections': len(reflections)
    }
""",
    entrypoint="detect_patterns",
    required_permissions=["read_public_patterns"],
    input_schema={
        "type": "object",
        "properties": {
            "reflections": {
                "type": "array",
                "items": {"type": "object"}
            }
        }
    },
    output_schema={
        "type": "object",
        "properties": {
            "patterns": {"type": "array"},
            "total_reflections": {"type": "integer"}
        }
    },
    author="mirror_core",
    status=WorkerStatus.APPROVED
)


# Example usage
if __name__ == "__main__":
    # Setup worker registry
    registry = WorkerRegistry("workers.db")
    
    # Register pattern detector
    worker_id = registry.register(PATTERN_DETECTOR_WORKER)
    print(f"Registered worker: {worker_id}")
    
    # Approve it
    registry.approve(worker_id, "guardian")
    
    # Execute in sandbox
    executor = SandboxExecutor(timeout_seconds=10)
    
    result = executor.execute(
        code=PATTERN_DETECTOR_WORKER.code,
        entrypoint=PATTERN_DETECTOR_WORKER.entrypoint,
        input_data={
            "reflections": [
                {"content": "I keep procrastinating on my book"},
                {"content": "Procrastinating again today"},
                {"content": "Why do I keep procrastinating?"}
            ]
        }
    )
    
    print(f"Execution result: {json.dumps(result, indent=2)}")
    
    # Validate with safety worker
    if 'result' in result:
        safety_check = SafetyWorker.validate_proposal(result['result'])
        print(f"Safety check: {safety_check}")
