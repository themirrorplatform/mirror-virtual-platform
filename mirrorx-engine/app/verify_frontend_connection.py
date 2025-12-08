#!/usr/bin/env python3
"""
VERIFY FRONTEND CONNECTION FILES

This script checks that all frontend connection files are properly created and in the right locations.
Run this to validate your setup before starting development.

Usage: python verify_frontend_connection.py
"""

import os
import sys
from pathlib import Path

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def check(condition, message):
    """Print status of a check"""
    if condition:
        print(f"{GREEN}✓{RESET} {message}")
        return True
    else:
        print(f"{RED}✗{RESET} {message}")
        return False

def section(title):
    """Print a section header"""
    print(f"\n{BLUE}═══ {title} ═══{RESET}\n")

# Main verification
def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  MIRRORX FRONTEND CONNECTION - VERIFICATION{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    root_dir = Path.cwd()
    frontend_dir = root_dir / "mirrorx-frontend"
    
    all_good = True
    
    # =========================================================================
    # BACKEND FILES
    # =========================================================================
    
    section("Backend Files (Python)")
    
    backend_files = {
        "schemas.py": "Request/response models",
        "api_routes.py": "FastAPI route handlers",
    }
    
    for filename, description in backend_files.items():
        filepath = root_dir / filename
        found = filepath.exists()
        all_good &= check(found, f"{filename:<20} - {description}")
        
        if found:
            with open(filepath) as f:
                lines = len(f.readlines())
            print(f"               Lines: {lines}")
    
    # Check main.py has been updated
    section("Backend Integration")
    
    main_py = root_dir / "main.py"
    if main_py.exists():
        with open(main_py) as f:
            content = f.read()
        
        has_imports = "from api_routes import create_app" in content
        has_creation = "create_app(" in content
        
        check(has_imports, "main.py imports create_app")
        check(has_creation, "main.py calls create_app()")
        
        if not (has_imports and has_creation):
            print(f"{YELLOW}⚠{RESET} Please update main.py to use create_app()")
            all_good = False
    
    # =========================================================================
    # FRONTEND FILES
    # =========================================================================
    
    section("Frontend Files (TypeScript/React)")
    
    frontend_files = {
        "src/types/mirrorx.ts": "TypeScript type definitions",
        "src/hooks/useMirrorAPI.ts": "React API hooks",
        "src/components/MirrorXComponents.tsx": "React components",
        "src/components/MirrorXComponents.module.css": "Component styling",
    }
    
    for filepath, description in frontend_files.items():
        fullpath = frontend_dir / filepath
        found = fullpath.exists()
        all_good &= check(found, f"{filepath:<40} - {description}")
        
        if found:
            with open(fullpath) as f:
                lines = len(f.readlines())
            print(f"               Lines: {lines}")
    
    # =========================================================================
    # ENVIRONMENT FILES
    # =========================================================================
    
    section("Environment Configuration")
    
    env_files = {
        ".env": "Backend environment",
        "mirrorx-frontend/.env.local": "Frontend environment",
    }
    
    for filepath, description in env_files.items():
        fullpath = root_dir / filepath
        found = fullpath.exists()
        
        if found:
            check(True, f"{filepath:<35} - {description}")
            with open(fullpath) as f:
                content = f.read()
            print(f"               Vars: {len([l for l in content.split(chr(10)) if '=' in l and not l.startswith('#')])}")
        else:
            check(False, f"{filepath:<35} - {description}")
            if ".env" in filepath:
                print(f"               {YELLOW}→ Copy .env.example to .env and fill in keys{RESET}")
            else:
                print(f"               {YELLOW}→ Create this file with VITE_MIRRORX_API_BASE={RESET}")
            all_good = False
    
    # =========================================================================
    # DOCUMENTATION
    # =========================================================================
    
    section("Documentation Files")
    
    docs = {
        "FRONTEND_INTEGRATION.md": "Integration guide",
        "QUICK_START_FRONTEND.md": "Quick start snippets",
        "README_FRONTEND.md": "Complete overview",
        "FRONTEND_CONNECTION_MANIFEST.py": "File reference",
        "deploy.sh": "Deployment automation",
    }
    
    for filepath, description in docs.items():
        fullpath = root_dir / filepath
        found = fullpath.exists()
        check(found, f"{filepath:<40} - {description}")
    
    # =========================================================================
    # DEPENDENCIES
    # =========================================================================
    
    section("Dependencies")
    
    # Check Python dependencies
    try:
        import fastapi
        check(True, "FastAPI - Backend framework")
    except ImportError:
        check(False, "FastAPI - Backend framework")
        all_good = False
    
    try:
        import pydantic
        check(True, "Pydantic - Data validation")
    except ImportError:
        check(False, "Pydantic - Data validation")
        all_good = False
    
    # Check Node dependencies
    frontend_package_json = frontend_dir / "package.json"
    if frontend_package_json.exists():
        check(True, "package.json - Frontend dependencies listed")
    else:
        check(False, "package.json - Frontend dependencies listed")
    
    # =========================================================================
    # ENDPOINTS
    # =========================================================================
    
    section("API Endpoints (from api_routes.py)")
    
    api_routes = root_dir / "api_routes.py"
    if api_routes.exists():
        with open(api_routes) as f:
            content = f.read()
        
        endpoints = [
            ("POST /mirrorback", "mirrorback_endpoint"),
            ("GET /api/health", "health_check"),
            ("GET /api/profile/me", "get_profile_me"),
            ("GET /api/threads", "get_threads"),
            ("GET /api/threads/{thread_id}", "get_thread"),
            ("GET /api/threads/{thread_id}/reflections", "get_thread_reflections"),
            ("GET /api/reflections/{reflection_id}", "get_reflection"),
        ]
        
        for endpoint, function in endpoints:
            found = function in content
            check(found, f"{endpoint:<45} ✓" if found else f"{endpoint:<45} ✗")
    
    # =========================================================================
    # HOOKS
    # =========================================================================
    
    section("React Hooks (from useMirrorAPI.ts)")
    
    hooks_file = frontend_dir / "src/hooks/useMirrorAPI.ts"
    if hooks_file.exists():
        with open(hooks_file) as f:
            content = f.read()
        
        hooks = [
            "useMirrorback",
            "useMirrorProfile",
            "useMirrorThreads",
            "useMirrorThread",
            "useMirrorReflection",
            "useMirrorHealth",
            "useReflectionThread",
        ]
        
        for hook in hooks:
            found = f"export function {hook}" in content
            check(found, f"{hook:<30} ✓" if found else f"{hook:<30} ✗")
    
    # =========================================================================
    # COMPONENTS
    # =========================================================================
    
    section("React Components (from MirrorXComponents.tsx)")
    
    components_file = frontend_dir / "src/components/MirrorXComponents.tsx"
    if components_file.exists():
        with open(components_file) as f:
            content = f.read()
        
        components = [
            "ReflectScreen",
            "ThreadListView",
            "ProfileCard",
            "HealthIndicator",
            "MirrorXApp",
        ]
        
        for component in components:
            found = f"export const {component}" in content
            check(found, f"{component:<30} ✓" if found else f"{component:<30} ✗")
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    
    section("Summary")
    
    if all_good:
        print(f"{GREEN}{'='*60}{RESET}")
        print(f"{GREEN}✓ ALL CHECKS PASSED - READY TO USE!{RESET}")
        print(f"{GREEN}{'='*60}{RESET}\n")
        
        print(f"{BLUE}Next steps:{RESET}")
        print(f"  1. Fill in .env with your API keys")
        print(f"  2. Start backend:  python -m uvicorn main:app --reload")
        print(f"  3. Start frontend: cd mirrorx-frontend && npm run dev")
        print(f"  4. Open browser:   http://localhost:5173")
        print(f"  5. Test by sending a reflection\n")
        
        return 0
    else:
        print(f"{RED}{'='*60}{RESET}")
        print(f"{RED}✗ SOME CHECKS FAILED - SEE ABOVE{RESET}")
        print(f"{RED}{'='*60}{RESET}\n")
        
        print(f"{YELLOW}Please ensure:{RESET}")
        print(f"  • All backend files are copied to project root")
        print(f"  • All frontend files are in correct locations")
        print(f"  • main.py is updated to use create_app()")
        print(f"  • Environment files are created (.env, .env.local)")
        print(f"  • Dependencies are installed\n")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
