# mirrorcore/ui/local_web/app.py
"""
Local Web Interface for MirrorCore

FastAPI server that runs on localhost:8000
No cloud dependencies - pure local operation
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional
import logging

from mirrorcore.config import get_settings
from mirrorcore.storage import LocalDB
from mirrorcore.engine import ReflectionEngine

logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="MirrorCore",
    description="Sovereign Reflection Engine - Local Interface",
    version="1.0.0"
)

# CORS middleware (for local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
settings = get_settings()
db = LocalDB(db_path=settings.get_db_path())
engine = ReflectionEngine(db=db, settings=settings)

# Serve static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the main interface"""
    html_file = static_dir / "index.html"
    
    if not html_file.exists():
        return HTMLResponse(content="""
<!DOCTYPE html>
<html>
<head>
    <title>MirrorCore</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { margin-top: 0; }
        textarea {
            width: 100%;
            min-height: 150px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            font-size: 14px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        }
        button:hover { background: #0056b3; }
        .mirrorback {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            border-radius: 4px;
        }
        .status {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
        }
        .status.loading { background: #fff3cd; color: #856404; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🪞 MirrorCore</h1>
        <p>Sovereign Reflection Engine - Running Locally</p>
        
        <h3>Write a Reflection</h3>
        <textarea id="reflectionText" placeholder="What's on your mind?"></textarea>
        <button onclick="reflect()">Reflect</button>
        
        <div id="status"></div>
        <div id="mirrorback" style="display:none;"></div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3>Recent Reflections</h3>
            <div id="recentReflections"></div>
        </div>
    </div>
    
    <script>
        async function reflect() {
            const text = document.getElementById('reflectionText').value;
            const statusDiv = document.getElementById('status');
            const mirrorbackDiv = document.getElementById('mirrorback');
            
            if (!text.trim()) {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = 'Please write something first.';
                statusDiv.style.display = 'block';
                return;
            }
            
            statusDiv.className = 'status loading';
            statusDiv.innerHTML = 'Reflecting...';
            statusDiv.style.display = 'block';
            mirrorbackDiv.style.display = 'none';
            
            try {
                const response = await fetch('/api/reflect', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({text: text})
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    statusDiv.style.display = 'none';
                    mirrorbackDiv.className = 'mirrorback';
                    mirrorbackDiv.innerHTML = '<h4>Mirrorback:</h4>' + 
                        '<p>' + data.mirrorback.replace(/\\n/g, '<br>') + '</p>';
                    mirrorbackDiv.style.display = 'block';
                    
                    // Clear input
                    document.getElementById('reflectionText').value = '';
                    
                    // Reload recent reflections
                    loadRecentReflections();
                } else {
                    statusDiv.className = 'status error';
                    statusDiv.innerHTML = 'Error: ' + (data.detail || 'Unknown error');
                }
            } catch (error) {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = 'Connection error: ' + error.message;
            }
        }
        
        async function loadRecentReflections() {
            try {
                const response = await fetch('/api/reflections?limit=5');
                const data = await response.json();
                
                const container = document.getElementById('recentReflections');
                
                if (data.reflections && data.reflections.length > 0) {
                    container.innerHTML = data.reflections.map(r => `
                        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                                ${new Date(r.created_at).toLocaleString()}
                            </div>
                            <div style="font-size: 14px;">
                                ${r.content.substring(0, 100)}${r.content.length > 100 ? '...' : ''}
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<p style="color: #666;">No reflections yet. Write your first one above!</p>';
                }
            } catch (error) {
                console.error('Error loading reflections:', error);
            }
        }
        
        // Load recent reflections on page load
        loadRecentReflections();
    </script>
</body>
</html>
        """)
    
    return HTMLResponse(content=html_file.read_text(encoding='utf-8'))


@app.post("/api/reflect")
async def reflect(request: Request):
    """
    Generate mirrorback for reflection text.
    
    This is the core API endpoint.
    """
    try:
        data = await request.json()
        text = data.get("text", "").strip()
        
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
        
        # Generate reflection
        result = await engine.reflect(text=text)
        
        return JSONResponse(content={
            "reflection_id": result['reflection_id'],
            "mirrorback": result['mirrorback'],
            "patterns": result.get('patterns', []),
            "engine_mode": settings.engine_mode
        })
    
    except Exception as e:
        logger.error(f"Reflection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reflections")
async def list_reflections(limit: int = 50):
    """List recent reflections"""
    try:
        reflections = db.list_reflections(limit=limit)
        
        return JSONResponse(content={
            "reflections": reflections,
            "count": len(reflections)
        })
    
    except Exception as e:
        logger.error(f"List reflections error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reflection/{reflection_id}")
async def get_reflection(reflection_id: str):
    """Get specific reflection"""
    reflection = db.get_reflection(reflection_id)
    
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")
    
    return JSONResponse(content=reflection)


@app.get("/api/stats")
async def get_stats():
    """Get database statistics"""
    stats = db.get_stats()
    
    return JSONResponse(content={
        **stats,
        "mode": settings.mirror_mode,
        "engine": settings.engine_mode,
        "sovereign": settings.is_sovereign()
    })


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(content={
        "status": "healthy",
        "version": settings.version,
        "mode": settings.mirror_mode,
        "engine": settings.engine_mode,
        "database": str(db.db_path)
    })


@app.post("/api/feedback")
async def submit_feedback(request: Request):
    """Submit feedback on a mirrorback"""
    try:
        data = await request.json()
        engine_run_id = data.get("engine_run_id")
        rating = data.get("rating")
        flags = data.get("flags", [])
        notes = data.get("notes")
        
        if not engine_run_id:
            raise HTTPException(status_code=400, detail="engine_run_id required")
        
        feedback_id = db.log_user_feedback(
            engine_run_id=engine_run_id,
            rating=rating,
            flags=flags,
            notes=notes
        )
        
        return JSONResponse(content={"feedback_id": feedback_id})
    
    except Exception as e:
        logger.error(f"Feedback error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("MirrorCore local web interface started")
    logger.info(f"Database: {db.db_path}")
    logger.info(f"Mode: {settings.mirror_mode}")
    logger.info(f"Engine: {settings.engine_mode}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("MirrorCore local web interface shutting down")
    db.close()

