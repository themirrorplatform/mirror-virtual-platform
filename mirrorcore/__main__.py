# mirrorcore/__main__.py
"""
MirrorCore entry point - allows `python -m mirrorcore`

This is the sovereign installation that works completely offline.
"""

import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

logger = logging.getLogger(__name__)


def main():
    """Main entry point for MirrorCore"""
    
    try:
        from mirrorcore.config import get_settings
        from mirrorcore.storage import LocalDB
        
        settings = get_settings()
        
        # Validate configuration
        issues = settings.validate_config()
        if issues:
            logger.warning("Configuration issues found:")
            for issue in issues:
                logger.warning(f"  - {issue}")
        
        # Initialize database
        logger.info("Initializing MirrorCore...")
        db = LocalDB(db_path=settings.get_db_path())
        
        # Print startup banner
        print("=" * 70)
        print("🪞 MirrorCore - Sovereign Reflection Engine")
        print("=" * 70)
        print(f"Version:       {settings.version}")
        print(f"Mode:          {settings.mirror_mode}")
        print(f"Engine:        {settings.engine_mode}")
        print(f"Database:      {db.db_path}")
        print(f"Sync:          {'enabled' if settings.sync_enabled else 'disabled'}")
        print()
        
        # Show sovereignty status
        if settings.is_sovereign():
            print("✅ Running in FULLY SOVEREIGN mode")
            print("   All data local, no cloud dependencies, you own everything.")
        else:
            print("⚠️  Running with cloud features enabled")
            if settings.sync_enabled:
                print(f"   Syncing to: {settings.sync_hub_url}")
            if settings.engine_mode == "remote_llm":
                print("   Using remote LLM (your API key)")
        
        print()
        
        # Show database stats
        stats = db.get_stats()
        print("Database Statistics:")
        print(f"  Identities:   {stats['identities']}")
        print(f"  Reflections:  {stats['reflections']}")
        print(f"  Tensions:     {stats['tensions']}")
        print(f"  Sessions:     {stats['sessions']}")
        print()
        
        print("=" * 70)
        print()
        print("✨ Starting local web interface...")
        print("📍 http://localhost:8000")
        print()
        print("Press Ctrl+C to stop")
        print()
        
        # Start web interface
        try:
            import uvicorn
            from mirrorcore.ui.local_web.app import app
            
            uvicorn.run(
                app,
                host="127.0.0.1",
                port=8000,
                log_level="info"
            )
        except ImportError:
            logger.error("uvicorn not installed. Install with: pip install uvicorn[standard]")
            logger.info("You can still use MirrorCore as a library:")
            logger.info("  from mirrorcore import Mirror")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n\n🪞 MirrorCore stopped. Your reflections are safe.")
        sys.exit(0)
    
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
