"""
YogAI Backend — Main Entry Point (Extended)
============================================
Registered routers:
  /api/chat, /api/recipe, /api/recipes, /api/upload  → chat.py  (RecipeMaker)
  /api/detect, /api/yoga                              → pose.py  (Yoga AI)
  /api/exercise                                       → exercise.py (Exercise Counter)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.chat import chat_bp
from routes.pose import pose_bp
from routes.exercise import exercise_bp

app = FastAPI(
    title="YogAI Backend",
    description="AI-powered Yoga Pose Monitor, Recipe Assistant, and Exercise Counter.",
    version="2.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(chat_bp, prefix="/api")        # recipe + chat + upload
app.include_router(pose_bp, prefix="/api")        # yoga pose detection
app.include_router(exercise_bp, prefix="/api")    # exercise counter


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/status")
def status():
    return {
        "status": "ok",
        "version": "2.0.0",
        "services": ["chat", "pose", "exercise", "upload"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
