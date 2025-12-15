"""
Mirror OS - Main Application Entry Point

Initializes all Mirror systems and starts the application.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirrorx.orchestrator import MirrorXOrchestrator, MirrorXAPI


def initialize_mirror(db_path: str = "mirror.db"):
    """
    Initialize Mirror Virtual Platform.
    
    Args:
        db_path: Path to SQLite database
    
    Returns:
        Initialized orchestrator
    """
    
    print("🪞 Initializing Mirror Virtual Platform...")
    
    # Initialize storage
    print("📦 Connecting to database...")
    storage = SQLiteStorage(db_path)
    
    # Initialize orchestrator
    print("🧠 Initializing MirrorX orchestrator...")
    orchestrator = MirrorXOrchestrator(storage)
    
    # Run health checks
    print("🔍 Running system health checks...")
    
    checks = {
        "Constitutional Monitor": orchestrator.constitutional_monitor is not None,
        "Self-Critic": orchestrator.critic is not None,
        "Conflict Resolver": orchestrator.conflict_resolver is not None,
        "Behavior Log": orchestrator.behavior_log is not None,
        "Integrity Checker": orchestrator.integrity_checker is not None,
        "Learning Exclusion": orchestrator.learning_exclusion is not None,
        "Model Verification": orchestrator.model_verification is not None,
        "Amendment Protocol": orchestrator.amendment_protocol is not None,
        "Encryption System": orchestrator.encryption is not None,
        "Disconnect Proof": orchestrator.disconnect_proof is not None,
        "Multimodal Manager": orchestrator.multimodal is not None
    }
    
    all_healthy = all(checks.values())
    
    for system, healthy in checks.items():
        status = "✅" if healthy else "❌"
        print(f"  {status} {system}")
    
    if not all_healthy:
        print("\n⚠️  Some systems failed health checks!")
        return None
    
    print("\n✨ Mirror Virtual Platform initialized successfully!")
    print("\nConstitutional Principles Active:")
    print("  • Sovereignty: 1.0 (absolute)")
    print("  • Reflection Purity: 0.9 minimum")
    print("  • Anti-Optimization: 0.95 minimum")
    print("  • Safety: 0.9 minimum")
    print("  • Plurality: 1.0 (absolute)")
    
    return orchestrator


def start_api_server(orchestrator: MirrorXOrchestrator, host: str = "0.0.0.0", port: int = 8000):
    """
    Start FastAPI server.
    
    Args:
        orchestrator: Initialized orchestrator
        host: Host to bind to
        port: Port to bind to
    """
    
    print(f"\n🚀 Starting Mirror API server on {host}:{port}...")
    
    api = MirrorXAPI(orchestrator)
    app = api.create_app()
    
    import uvicorn
    uvicorn.run(app, host=host, port=port)


def main():
    """Main entry point"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="Mirror Virtual Platform")
    parser.add_argument(
        "--db",
        default="mirror.db",
        help="Path to SQLite database (default: mirror.db)"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="API server host (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="API server port (default: 8000)"
    )
    parser.add_argument(
        "--no-server",
        action="store_true",
        help="Initialize only, don't start server"
    )
    
    args = parser.parse_args()
    
    # Initialize
    orchestrator = initialize_mirror(args.db)
    
    if orchestrator is None:
        print("❌ Initialization failed")
        sys.exit(1)
    
    # Start server unless disabled
    if not args.no_server:
        try:
            start_api_server(orchestrator, args.host, args.port)
        except KeyboardInterrupt:
            print("\n\n👋 Mirror shutting down gracefully...")
            sys.exit(0)
    else:
        print("\n✅ Mirror initialized (server not started)")


if __name__ == "__main__":
    main()
