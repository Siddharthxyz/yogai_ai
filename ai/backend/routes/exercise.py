"""
Exercise Routes
===============
Exposes the exercise counter as a REST API using background threads for live tracking.

Endpoints:
  1. POST /api/exercise/start   -> Starts a background thread with the webcam
  2. GET  /api/exercise/status  -> Gets current rep count/feedback
  3. POST /api/exercise/stop    -> Stops the camera thread
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.exercise_service import ExerciseService

exercise_bp = APIRouter(prefix="/exercise", tags=["Exercise"])
exercise_service = ExerciseService()

class StartSessionRequest(BaseModel):
    exercise_type: str  # "bicep_curl", "pushup", "squat", "deadlift", "pullup"
    source: Optional[str] = "0" # "0" for webcam or path/to/video.mp4

@exercise_bp.get("/exercises")
def list_exercises():
    """Return all supported exercise types."""
    return {"supported_exercises": exercise_service.list_supported_exercises()}

@exercise_bp.post("/start")
def start_session(body: StartSessionRequest):
    """
    Start a new live exercise session on the server.
    """
    try:
        result = exercise_service.start_session(body.exercise_type, body.source)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@exercise_bp.get("/status/{session_id}")
def get_status(session_id: str):
    """Get the real-time status of the exercise session."""
    result = exercise_service.get_status(session_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@exercise_bp.post("/stop/{session_id}")
def stop_session(session_id: str):
    """Stop the exercise session and free the camera."""
    result = exercise_service.stop_session(session_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
