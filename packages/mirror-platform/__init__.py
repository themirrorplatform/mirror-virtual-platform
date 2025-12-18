"""
Mirror Platform - Complete Integration Layer

This package provides the complete Mirror platform integration:

1. **CLI Interface**: Command-line tool for Mirror interactions
2. **REST API**: HTTP API for web and mobile integrations
3. **Platform Configuration**: Unified configuration management
4. **Integration Layer**: Connects all Mirror packages

Usage (CLI):
    $ mirror start                    # Start interactive session
    $ mirror reflect "your thoughts"  # Quick reflection
    $ mirror status                   # Check system status
    $ mirror config show              # Show configuration

Usage (Python):
    from mirror_platform import Mirror

    mirror = Mirror()
    await mirror.start()

    response = await mirror.reflect("I've been thinking...")
    print(response.text)

    await mirror.stop()

Usage (API):
    # Start the API server
    $ mirror serve --port 8000

    # POST /sessions - Start session
    # POST /sessions/{id}/reflect - Submit reflection
    # DELETE /sessions/{id} - End session

The Mirror platform enforces constitutional constraints at every layer.
All 14 axioms are upheld regardless of which interface is used.
"""

from .config import MirrorPlatformConfig, load_config
from .platform import Mirror, MirrorInstance
from .cli import main as cli_main

__version__ = "1.0.0"
__all__ = [
    "MirrorPlatformConfig",
    "load_config",
    "Mirror",
    "MirrorInstance",
    "cli_main",
]
