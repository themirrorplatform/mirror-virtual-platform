"""
Run Mirror API Server

Usage:
    cd c:\Users\ilyad\mirror-virtual-platform
    set PYTHONPATH=c:\Users\ilyad\mirror-virtual-platform
    python mirror_api/run_server.py
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

if __name__ == "__main__":
    import uvicorn
    from mirror_api.main import app
    
    print("=" * 60)
    print("Mirror Core API Server")
    print("=" * 60)
    print(f"Project root: {project_root}")
    print("Starting server on http://0.0.0.0:8000")
    print("Press CTRL+C to stop")
    print("=" * 60)
    print()
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
