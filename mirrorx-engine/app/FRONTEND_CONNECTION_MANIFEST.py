#!/usr/bin/env python3
"""
FRONTEND CONNECTION - COMPLETE FILE MANIFEST
=============================================

All files created to connect the React frontend to the MirrorX backend.
Use this as a reference for where everything goes and what it does.

Total: 8 files (backend) + 4 files (frontend) + 2 documentation files
"""

# =============================================================================
# BACKEND FILES (main API, schemas, routes)
# =============================================================================

BACKEND_FILES = {
    "schemas.py": {
        "location": "c:/Users/ilyad/OneDrive/Desktop/mirrorx-api/",
        "purpose": "Pydantic request/response models for all API endpoints",
        "key_classes": [
            "MirrorbackRequest",           # POST /mirrorback input
            "MirrorbackResponse",          # POST /mirrorback output
            "ProfileResponse",             # GET /api/profile/me
            "ThreadsResponse",             # GET /api/threads
            "ThreadReflectionsResponse",   # GET /api/threads/{id}/reflections
            "HealthResponse",              # GET /api/health
        ],
        "lines": 200,
        "imports": ["pydantic", "datetime"],
    },
    "api_routes.py": {
        "location": "c:/Users/ilyad/OneDrive/Desktop/mirrorx-api/",
        "purpose": "FastAPI route handlers for all frontend endpoints",
        "endpoints": [
            "POST /mirrorback",
            "GET /api/health",
            "GET /api/profile/me",
            "GET /api/threads",
            "GET /api/threads/{thread_id}",
            "GET /api/threads/{thread_id}/reflections",
            "GET /api/reflections/{reflection_id}",
        ],
        "key_functions": [
            "create_app(orchestrator, db)",    # Factory function
            "get_current_user()",              # Dependency
            "mirrorback()",                    # Main endpoint
            "get_profile_me()",
            "get_threads()",
            "get_thread_reflections()",
        ],
        "lines": 450,
        "imports": ["fastapi", "schemas", "database", "orchestrator"],
        "note": "Pass orchestrator and db instances to create_app()",
    },
}

# =============================================================================
# FRONTEND FILES (React, TypeScript, hooks)
# =============================================================================

FRONTEND_FILES = {
    "src/types/mirrorx.ts": {
        "location": "mirrorx-frontend/",
        "purpose": "TypeScript type definitions matching backend schemas",
        "key_types": [
            "TensionSummary",
            "LoopMarker",
            "EvolutionSignal",
            "MirrorbackRequest",
            "MirrorbackResponse",
            "ProfileResponse",
            "ThreadSummary",
            "ReflectionSummary",
            "HealthResponse",
        ],
        "lines": 150,
    },
    "src/hooks/useMirrorAPI.ts": {
        "location": "mirrorx-frontend/",
        "purpose": "React hooks for calling backend API",
        "key_hooks": [
            "useMirrorback(userId)",          # Send single reflection
            "useMirrorProfile(userId)",       # Fetch user profile
            "useMirrorThreads(userId)",       # Get all threads
            "useMirrorThread(userId, threadId)", # Get single thread
            "useMirrorReflection(userId, id)", # Get single reflection
            "useMirrorHealth()",              # Check system health
            "useReflectionThread(userId, threadId)", # Build thread with reflections
        ],
        "lines": 550,
        "imports": ["react", "types/mirrorx"],
        "api_base": "import.meta.env.VITE_MIRRORX_API_BASE ?? http://localhost:8000",
    },
    "src/components/MirrorXComponents.tsx": {
        "location": "mirrorx-frontend/",
        "purpose": "React components using the API hooks",
        "key_components": [
            "ReflectScreen",           # Main reflection interface
            "ThreadListView",          # Show past threads
            "ProfileCard",             # Display user profile
            "HealthIndicator",         # System status
            "MirrorXApp",             # Complete app layout
        ],
        "lines": 400,
        "imports": ["react", "hooks/useMirrorAPI", "types/mirrorx"],
    },
    "src/components/MirrorXComponents.module.css": {
        "location": "mirrorx-frontend/",
        "purpose": "Complete styling for MirrorX components",
        "sections": [
            ".reflect_screen",
            ".thread_list",
            ".profile_card",
            ".health_indicator",
            ".mirrorx_app",
        ],
        "lines": 650,
    },
}

# =============================================================================
# DOCUMENTATION & GUIDE FILES
# =============================================================================

DOCS_FILES = {
    "FRONTEND_INTEGRATION.md": {
        "location": "c:/Users/ilyad/OneDrive/Desktop/mirrorx-api/",
        "sections": [
            "Step 1: Update main.py",
            "Step 2: Environment variables",
            "Step 3: Frontend setup",
            "Step 4: Orchestrator integration",
            "Step 5: Testing checklist",
            "Step 6: Deployment",
            "Step 7: Troubleshooting",
            "Step 8: Authentication",
            "API response examples",
        ],
        "lines": 450,
    },
    "QUICK_START_FRONTEND.md": {
        "location": "c:/Users/ilyad/OneDrive/Desktop/mirrorx-api/",
        "sections": [
            "Backend main.py",
            "Frontend .env.local",
            "Frontend main.tsx",
            "Verification steps",
            "API usage examples (curl)",
            "React hook examples",
            "Troubleshooting",
            "Next steps",
        ],
        "lines": 350,
    },
}

# =============================================================================
# DIRECTORY STRUCTURE
# =============================================================================

DIRECTORY_TREE = """
mirrorx-api/
├── schemas.py (NEW)
├── api_routes.py (NEW)
├── main.py (MODIFY to use create_app)
├── orchestrator.py (OPTIONAL: integrate local models)
├── FRONTEND_INTEGRATION.md (NEW)
├── QUICK_START_FRONTEND.md (NEW)
└── mirrorx-frontend/
    └── src/
        ├── types/
        │   └── mirrorx.ts (NEW)
        ├── hooks/
        │   └── useMirrorAPI.ts (NEW)
        ├── components/
        │   ├── MirrorXComponents.tsx (NEW)
        │   ├── MirrorXComponents.module.css (NEW)
        │   └── ... existing components
        ├── main.tsx (MODIFY)
        └── ... existing files
"""

# =============================================================================
# API ENDPOINTS QUICK REFERENCE
# =============================================================================

API_ENDPOINTS = {
    "POST /mirrorback": {
        "description": "Send reflection, get mirrorback",
        "auth": "X-User-Id header",
        "request_body": "MirrorbackRequest",
        "response": "MirrorbackResponse",
        "example_hook": "const { sendReflection, loading } = useMirrorback(userId)",
    },
    "GET /api/health": {
        "description": "Check system health",
        "auth": "None",
        "response": "HealthResponse",
        "example_hook": "const { health } = useMirrorHealth()",
    },
    "GET /api/profile/me": {
        "description": "Get current user's profile",
        "auth": "X-User-Id header",
        "response": "ProfileResponse",
        "example_hook": "const { profile } = useMirrorProfile(userId)",
    },
    "GET /api/threads": {
        "description": "List all conversation threads",
        "auth": "X-User-Id header",
        "response": "ThreadsResponse",
        "example_hook": "const { threads } = useMirrorThreads(userId)",
    },
    "GET /api/threads/{thread_id}": {
        "description": "Get specific thread details",
        "auth": "X-User-Id header",
        "response": "ThreadSummary",
    },
    "GET /api/threads/{thread_id}/reflections": {
        "description": "Get all reflections in thread",
        "auth": "X-User-Id header",
        "response": "ThreadReflectionsResponse",
        "example_hook": "const { thread, reflections } = useMirrorThread(userId, threadId)",
    },
    "GET /api/reflections/{reflection_id}": {
        "description": "Get single reflection",
        "auth": "X-User-Id header",
        "response": "ReflectionSummary",
        "example_hook": "const { reflection } = useMirrorReflection(userId, id)",
    },
}

# =============================================================================
# INTEGRATION CHECKLIST
# =============================================================================

INTEGRATION_CHECKLIST = """
BACKEND SETUP:
□ Copy schemas.py to project root
□ Copy api_routes.py to project root
□ Update main.py to call: app = create_app(orchestrator, db)
□ Set FRONTEND_ORIGIN in .env
□ Test: curl http://localhost:8000/api/health

FRONTEND SETUP:
□ Create src/types/mirrorx.ts
□ Create src/hooks/useMirrorAPI.ts
□ Create src/components/MirrorXComponents.tsx
□ Create src/components/MirrorXComponents.module.css
□ Update src/main.tsx to use MirrorXApp component
□ Create .env.local with VITE_MIRRORX_API_BASE

ENVIRONMENT:
□ .env (backend):
  - FRONTEND_ORIGIN=http://localhost:5173
  - SUPABASE_URL=...
  - SUPABASE_KEY=...
  - API keys for providers

□ .env.local (frontend):
  - VITE_MIRRORX_API_BASE=http://localhost:8000

TESTING:
□ Start backend: python -m uvicorn main:app --reload
□ Start frontend: npm run dev
□ Test reflection endpoint
□ Test profile endpoint
□ Test threads endpoint
□ Test offline mode (if local models available)
□ Test error handling
□ Check CORS headers

OPTIONAL:
□ Add authentication (JWT)
□ Add data persistence
□ Add streaming responses
□ Add real-time updates (WebSocket)
"""

# =============================================================================
# KEY ARCHITECTURAL DECISIONS
# =============================================================================

ARCHITECTURE_NOTES = """
1. FACTORY PATTERN
   - create_app(orchestrator, db) returns configured FastAPI instance
   - Allows dependency injection and testing
   - No global state in api_routes.py

2. DEPENDENCY INJECTION
   - User ID passed via X-User-Id header
   - Orchestrator passed to create_app()
   - Database passed to create_app()
   - Enables testing with mock dependencies

3. ASYNC/AWAIT THROUGHOUT
   - All hooks use async functions
   - All FastAPI endpoints are async
   - No blocking I/O
   - Compatible with concurrent requests

4. ERROR HANDLING
   - Standard HTTP status codes
   - JSON error responses with detail field
   - Frontend displays error messages gracefully
   - Detailed logging on backend

5. TYPE SAFETY
   - Backend: Pydantic models validate all requests/responses
   - Frontend: TypeScript types match backend schemas
   - Editor autocomplete for all API data

6. OFFLINE SUPPORT
   - X-Offline header and offline_only flag
   - Routes to local models when available
   - Graceful degradation if all providers fail
   - Fallback to MirrorbackLite

7. SCALABILITY
   - Stateless design (can run multiple instances)
   - Database handles persistence
   - Provider abstraction allows multiple backends
   - Configuration-driven behavior
"""

# =============================================================================
# COMMON TASKS & CODE SNIPPETS
# =============================================================================

COMMON_TASKS = {
    "Add a new endpoint": """
        1. Add request/response models to schemas.py
        2. Add handler function to api_routes.py
        3. Add TypeScript type to src/types/mirrorx.ts
        4. Add React hook to src/hooks/useMirrorAPI.ts
        5. Add component or update existing to use hook
    """,
    
    "Add authentication": """
        1. Update get_current_user() in api_routes.py to decode JWT
        2. Update frontend hooks to send Authorization header
        3. Add auth middleware to FastAPI app
        4. Update CORS to allow Authorization header
    """,
    
    "Add real-time updates": """
        1. Add WebSocket endpoint to api_routes.py
        2. Create useWebSocket hook in frontend
        3. Update components to subscribe to updates
        4. Use server-sent events or WebSocket for streaming
    """,
    
    "Test offline mode": """
        1. Check local models are available: curl /api/health
        2. Send with X-Offline: 1 header or offline_only=true
        3. Should use local providers from local/router.py
        4. Verify in logs
    """,
}

# =============================================================================
# FILE MANIFEST FUNCTIONS
# =============================================================================

def print_file_manifest():
    """Print a complete file manifest"""
    print("\n=== BACKEND FILES ===\n")
    for filename, details in BACKEND_FILES.items():
        print(f"📄 {filename}")
        print(f"   Location: {details['location']}")
        print(f"   Purpose: {details['purpose']}")
        print(f"   Lines: {details['lines']}")
        if 'key_classes' in details:
            print(f"   Key classes: {', '.join(details['key_classes'][:3])}...")
        print()
    
    print("\n=== FRONTEND FILES ===\n")
    for filename, details in FRONTEND_FILES.items():
        print(f"📄 {filename}")
        print(f"   Location: {details['location']}")
        print(f"   Purpose: {details['purpose']}")
        print(f"   Lines: {details['lines']}")
        if 'key_hooks' in details:
            print(f"   Key hooks: {', '.join(details['key_hooks'][:3])}...")
        print()
    
    print("\n=== DOCUMENTATION ===\n")
    for filename, details in DOCS_FILES.items():
        print(f"📖 {filename}")
        print(f"   Location: {details['location']}")
        print(f"   Sections: {len(details['sections'])}")
        print(f"   Lines: {details['lines']}")
        print()

def print_directory_tree():
    """Print directory structure"""
    print(DIRECTORY_TREE)

def print_checklist():
    """Print integration checklist"""
    print(INTEGRATION_CHECKLIST)

if __name__ == "__main__":
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║     MIRRORX FRONTEND CONNECTION - FILE MANIFEST                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print_file_manifest()
    print("\n" + "="*70 + "\n")
    print_directory_tree()
    print("\n" + "="*70 + "\n")
    print_checklist()
    print("\n" + "="*70 + "\n")
    print(ARCHITECTURE_NOTES)
