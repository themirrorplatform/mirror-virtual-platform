# constitution/genesis.py
"""
Genesis Hash Verification

The immutable anchor point of The Mirror's constitution.
Hash: 97aa1848fe4b7b8b13cd30cb2e9f72c1c7c05c56bbd1d478685fef3c0cbe4075

This hash is the SHA-256 of the canonical constitution text.
Any change to L0 invariants produces a different hash = different system.

If hash doesn't match:
- System enters Bootstrap Mode
- All constitutional enforcement paused
- User shown warning: "Constitutional integrity uncertain"
- Governance process initiated to verify legitimacy
"""

import hashlib
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime
from dataclasses import dataclass


# The Genesis Hash - immutable, defines what "The Mirror" is
GENESIS_HASH = "97aa1848fe4b7b8b13cd30cb2e9f72c1c7c05c56bbd1d478685fef3c0cbe4075"

# Temporal anchor - when this hash was first established
GENESIS_TIMESTAMP = "2025-01-13T00:00:00Z"


@dataclass
class GenesisVerification:
    """Result of genesis hash verification"""
    valid: bool
    expected_hash: str
    actual_hash: str
    constitution_path: str
    timestamp: str
    error: Optional[str] = None


class GenesisVerifier:
    """
    Verifies constitutional integrity via genesis hash.
    
    This is the trust anchor - if this fails, constitutional 
    enforcement cannot be trusted.
    """
    
    def __init__(self, constitution_path: Optional[Path] = None):
        """
        Initialize verifier.
        
        Args:
            constitution_path: Path to INVARIANTS.md. If None, uses default.
        """
        if constitution_path is None:
            # Default: look in same directory as this file
            constitution_path = Path(__file__).parent / "INVARIANTS.md"
        
        self.constitution_path = constitution_path
    
    def verify(self) -> GenesisVerification:
        """
        Verify constitution matches genesis hash.
        
        Returns:
            GenesisVerification with result
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Check file exists
        if not self.constitution_path.exists():
            return GenesisVerification(
                valid=False,
                expected_hash=GENESIS_HASH,
                actual_hash="",
                constitution_path=str(self.constitution_path),
                timestamp=timestamp,
                error=f"Constitution file not found: {self.constitution_path}"
            )
        
        # Read and hash constitution
        try:
            with open(self.constitution_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            actual_hash = self._compute_hash(content)
            
            # Compare
            valid = actual_hash == GENESIS_HASH
            
            return GenesisVerification(
                valid=valid,
                expected_hash=GENESIS_HASH,
                actual_hash=actual_hash,
                constitution_path=str(self.constitution_path),
                timestamp=timestamp,
                error=None if valid else "Hash mismatch - constitution modified or corrupted"
            )
        
        except Exception as e:
            return GenesisVerification(
                valid=False,
                expected_hash=GENESIS_HASH,
                actual_hash="",
                constitution_path=str(self.constitution_path),
                timestamp=timestamp,
                error=f"Error reading constitution: {str(e)}"
            )
    
    def _compute_hash(self, content: str) -> str:
        """
        Compute SHA-256 hash of content.
        
        Normalizes line endings and trailing whitespace to prevent
        spurious mismatches due to git autocrlf or editor settings.
        """
        # Normalize line endings to LF
        normalized = content.replace('\r\n', '\n')
        
        # Compute hash
        return hashlib.sha256(normalized.encode('utf-8')).hexdigest()
    
    def verify_or_enter_bootstrap(self) -> Tuple[bool, str]:
        """
        Verify genesis hash, enter bootstrap mode if invalid.
        
        Returns:
            (valid, message) - valid=True if hash matches, message for logging
        """
        result = self.verify()
        
        if result.valid:
            return True, f"Constitutional integrity verified (genesis hash: {result.actual_hash[:16]}...)"
        else:
            return False, self._format_bootstrap_warning(result)
    
    def _format_bootstrap_warning(self, result: GenesisVerification) -> str:
        """Format warning message for bootstrap mode"""
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║                       ⚠️  BOOTSTRAP MODE ACTIVE  ⚠️                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

Constitutional integrity verification FAILED.

Expected genesis hash: {result.expected_hash}
Actual hash:          {result.actual_hash or 'NONE'}

Error: {result.error}

This means one of:
1. Constitution file modified (L0 invariants changed)
2. File corrupted or tampered with
3. Wrong version loaded
4. First-time setup incomplete

CONSEQUENCES:
- All L0 enforcement PAUSED
- System cannot claim to be "The Mirror"
- Recognition Registry queries will fail
- Constitutional guarantees VOID

If you modified L0 invariants intentionally:
- This creates a FORK (new system, not The Mirror)
- You must generate new genesis hash
- Cannot claim Recognition Registry membership

If this is unintentional:
- Restore original constitution from trusted source
- Verify file integrity
- Re-run verification

Bootstrap mode allows operation but WITHOUT constitutional guarantees.
Proceed with caution.
"""


def verify_genesis_on_startup() -> bool:
    """
    Convenience function for startup verification.
    
    Returns:
        True if valid, False if bootstrap mode
    """
    verifier = GenesisVerifier()
    valid, message = verifier.verify_or_enter_bootstrap()
    
    print(message)
    
    return valid


# Self-test
if __name__ == "__main__":
    print("Genesis Hash Verification")
    print("=" * 80)
    print(f"Expected: {GENESIS_HASH}")
    print(f"Genesis timestamp: {GENESIS_TIMESTAMP}")
    print()
    
    verifier = GenesisVerifier()
    result = verifier.verify()
    
    print(f"Constitution path: {result.constitution_path}")
    print(f"Actual hash:      {result.actual_hash}")
    print(f"Valid:            {result.valid}")
    
    if result.error:
        print(f"Error:            {result.error}")
    
    if not result.valid:
        print()
        print(verifier._format_bootstrap_warning(result))
