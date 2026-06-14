"""
Exercise Routes
===============
Exposes individual exercise counters as a REST API with dual modules:
- Live webcam tracking (*_counter_live.py)
- Video file tracking (*_counter.py)

Each exercise has its own module: bicep_curl, pushup, squat, deadlift, pullup
"""

import uuid
import logging
import threading
import time
from typing import Dict, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import cv2
import tempfile

logger = logging.getLogger(__name__)
exercise_bp = APIRouter(prefix="/exercise", tags=["Exercise"])

# Import all counter modules
from services.bicep_curl_counter import BicepCurlCounter
from services.bicep_curl_counter_live import BicepCurlCounterLive
from services.pushup_counter import PushUpCounter
from services.pushup_counter_live import PushUpCounterLive
from services.squat_counter import SquatCounter
from services.squat_counter_live import SquatCounterLive
from services.deadlift_counter import DeadliftCounter
from services.deadlift_counter_live import DeadliftCounterLive
from services.pullup_counter import PullUpCounter
from services.pullup_counter_live import PullUpCounterLive
COUNTER_CLASSES = {
    "bicep_curl": {"video": BicepCurlCounter, "live": BicepCurlCounterLive},
    "pushup": {"video": PushUpCounter, "live": PushUpCounterLive},
    "squat": {"video": SquatCounter, "live": SquatCounterLive},
    "deadlift": {"video": DeadliftCounter, "live": DeadliftCounterLive},
    "pullup": {"video": PullUpCounter, "live": PullUpCounterLive}
}

class StartSessionRequest(BaseModel):
    exercise_type: str  # "bicep_curl", "pushup", "squat", "deadlift", "pullup"
    source: Optional[str] = "0" # "0" for webcam or path/to/video.mp4

class ThreadedCounter:
    """Wraps a counter in a background thread"""
    def __init__(self, exercise_type: str, source: str):
        self.session_id = str(uuid.uuid4())
        self.exercise_type = exercise_type
        self.source = source
        self.counter_instance = None
        self.thread = None
        self.is_running = False
        self.start_time = time.time()

    def start(self):
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = time.time()
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info(f"Started {self.exercise_type} session {self.session_id}")

    def _run(self):
        try:
            counter_class = COUNTER_CLASSES[self.exercise_type]["video"]
            self.counter_instance = counter_class(self.source)
            self.counter_instance.run()
        except Exception as e:
            logger.error(f"Counter error: {e}")
        finally:
            self.is_running = False

    def stop(self):
        self.is_running = False
        # Propagate stop signal into the counter's own loop
        if self.counter_instance and hasattr(self.counter_instance, 'is_running'):
            self.counter_instance.is_running = False
        if self.thread:
            self.thread.join(timeout=3)
        logger.info(f"Stopped session {self.session_id}")

    def get_status(self):
        elapsed = time.time() - self.start_time
        status = {
            "session_id": self.session_id,
            "exercise": self.exercise_type,
            "source_type": "video",
            "source": self.source,
            "duration": round(elapsed, 1),
            "is_running": self.is_running
        }
        if self.counter_instance:
            status.update(self.counter_instance.get_status())
        return status

class LiveExerciseSession:
    """Manages live webcam exercise tracking"""
    def __init__(self, exercise_type: str, source: int = 0):
        self.session_id = str(uuid.uuid4())
        self.exercise_type = exercise_type
        self.source = source
        self.counter_instance = None
        self.thread = None
        self.is_running = False
        self.start_time = time.time()

    def start(self):
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = time.time()
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info(f"Started live {self.exercise_type} session {self.session_id}")

    def _run(self):
        try:
            counter_class = COUNTER_CLASSES[self.exercise_type]["live"]
            self.counter_instance = counter_class(self.source)
            self.counter_instance.run()
        except Exception as e:
            logger.error(f"Live counter error: {e}")
        finally:
            self.is_running = False

    def stop(self):
        self.is_running = False
        # Propagate stop signal into the counter's own loop so the camera releases
        if self.counter_instance and hasattr(self.counter_instance, 'is_running'):
            self.counter_instance.is_running = False
        if self.thread:
            self.thread.join(timeout=3)
        logger.info(f"Stopped live session {self.session_id}")

    def get_status(self):
        elapsed = time.time() - self.start_time
        status = {
            "session_id": self.session_id,
            "exercise": self.exercise_type,
            "source_type": "live",
            "duration": round(elapsed, 1),
            "is_running": self.is_running
        }
        if self.counter_instance:
            status.update(self.counter_instance.get_status())
        return status

# Session tracking
_sessions: Dict[str, ThreadedCounter] = {}
_live_sessions: Dict[str, LiveExerciseSession] = {}

@exercise_bp.get("/exercises")
def list_exercises():
    """Return all supported exercise types."""
    return {
        "supported_exercises": [
            {"type": "bicep_curl", "description": "Bicep Curl"},
            {"type": "pushup", "description": "Push-Up"},
            {"type": "squat", "description": "Squat"},
            {"type": "deadlift", "description": "Deadlift"},
            {"type": "pullup", "description": "Pull-Up"}
        ]
    }

@exercise_bp.post("/start")
def start_session(body: StartSessionRequest):
    """
    Start a new exercise session (live webcam or video file).
    
    Args:
        exercise_type: Type of exercise (bicep_curl, pushup, squat, deadlift, pullup)
        source: "0" for default webcam, or path to video file
    """
    try:
        if body.exercise_type not in COUNTER_CLASSES:
            raise ValueError(f"Unknown exercise type: {body.exercise_type}")

        # Determine if live or video
        is_live = body.source == "0" or (body.source.isdigit() and int(body.source) >= 0)

        if is_live:
            # Live webcam
            source_int = int(body.source) if body.source.isdigit() else 0
            session = LiveExerciseSession(body.exercise_type, source_int)
            session.start()
            _live_sessions[session.session_id] = session
            return session.get_status()
        else:
            # Video file
            if not os.path.exists(body.source):
                raise ValueError(f"Video file not found: {body.source}")
            
            session = ThreadedCounter(body.exercise_type, body.source)
            session.start()
            _sessions[session.session_id] = session
            return session.get_status()

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@exercise_bp.post("/upload_video")
async def upload_video_session(
    exercise_type: str = Form(...),
    video: UploadFile = File(...),
):
    """Save an uploaded exercise video and start a background analysis session for it."""
    try:
        if exercise_type not in COUNTER_CLASSES:
            raise HTTPException(status_code=400, detail=f"Unknown exercise type: {exercise_type}")
        if not video.filename:
            raise HTTPException(status_code=400, detail="A video file must be provided.")

        suffix = os.path.splitext(video.filename)[1] or ".mp4"
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        try:
            with os.fdopen(fd, "wb") as temp_file:
                temp_file.write(await video.read())

            session = ThreadedCounter(exercise_type, temp_path)
            session.start()
            _sessions[session.session_id] = session
            return session.get_status()
        except Exception:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@exercise_bp.get("/status/{session_id}")
def get_status(session_id: str):
    """Get the real-time status of the exercise session."""
    # Check live sessions first
    if session_id in _live_sessions:
        return _live_sessions[session_id].get_status()
    
    # Check video sessions (including completed ones so frontend can read final result)
    if session_id in _sessions:
        return _sessions[session_id].get_status()
    
    raise HTTPException(status_code=404, detail="Session not found")

@exercise_bp.post("/stop/{session_id}")
def stop_session(session_id: str):
    """Stop the exercise session and free resources."""
    # Check live sessions
    if session_id in _live_sessions:
        session = _live_sessions.pop(session_id)
        status = session.get_status()
        session.stop()
        return status
    
    # Check video sessions
    if session_id in _sessions:
        session = _sessions.pop(session_id)
        status = session.get_status()
        session.stop()
        return status
    
    raise HTTPException(status_code=404, detail="Session not found")

@exercise_bp.get("/stream/{session_id}")
def get_stream(session_id: str):
    """Stream video frames as MJPEG for the session"""
    # Get the active session
    session = _live_sessions.get(session_id) or _sessions.get(session_id)
    if not session or not session.is_running:
        raise HTTPException(status_code=404, detail="Session not found or not running")
    
    # Create a generator that yields frames
    def frame_generator():
        while session.is_running:
            try:
                # Get the latest processed frame from counter (with pose skeleton and angles)
                if session.counter_instance and hasattr(session.counter_instance, 'current_frame'):
                    frame = session.counter_instance.current_frame
                    if frame is not None:
                        # Encode frame as JPEG
                        ret, buffer = cv2.imencode('.jpg', frame)
                        if ret:
                            yield (b'--frame\r\n'
                                   b'Content-Type: image/jpeg\r\n'
                                   b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                                   + buffer.tobytes() + b'\r\n')
                
                time.sleep(0.03)  # ~30 FPS
            except Exception as e:
                logger.error(f"Stream error: {e}")
                break
    
    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@exercise_bp.get("/frame/{session_id}")
def get_frame(session_id: str):
    """Get a single frame from the session as JPEG"""
    session = _live_sessions.get(session_id) or _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Get the latest processed frame from counter
        if session.counter_instance and hasattr(session.counter_instance, 'current_frame'):
            frame = session.counter_instance.current_frame
            if frame is not None:
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    return StreamingResponse(
                        iter([buffer.tobytes()]),
                        media_type="image/jpeg"
                    )
        
        raise HTTPException(status_code=503, detail="Frame not yet available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Frame capture error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
