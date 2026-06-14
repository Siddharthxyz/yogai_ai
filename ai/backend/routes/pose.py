from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import cv2
import numpy as np
import os
import tempfile

from services.pose_module import PoseDetectorModified
from services.yoga_service import LiveYogaTracker, live_yoga_sessions, process_yoga_video
from services.recipe_service import RecipeService
from pydantic import BaseModel

class YogaRecommendRequest(BaseModel):
    context: str
    session_accuracy: float = 0.0   # 0-100 from last session
    last_pose: str = ""             # e.g. "tree", "warrior"
    hold_time: float = 0.0          # seconds held in last session
    target_pose: str = ""
    previous_recommendation: str = ""

pose_bp = APIRouter()
detector = PoseDetectorModified()


@pose_bp.post("/detect")
async def handle_detect(image: UploadFile = File(...)):
    if not image.filename:
        raise HTTPException(status_code=400, detail="An image file must be posted as form field 'image'.")

    contents = await image.read()
    np_img = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Unable to decode the uploaded image.")

    frame = detector.findPose(frame, draw=True)
    landmarks = detector.findPosition(frame, draw=False)

    _, buffer = cv2.imencode(".jpg", frame)
    accuracy = min(100, max(0, len(landmarks) * 3)) if landmarks else 0

    return {
        "accuracy": accuracy,
        "landmarks": landmarks,
        "image": buffer.tobytes().hex(),
    }


@pose_bp.get("/yoga/status")
def yoga_status():
    return "Yoga detection backend running"


@pose_bp.post("/yoga/start_live")
def start_live_yoga(payload: dict):
    pose_type = payload.get("pose_type", "tree")
    source = payload.get("source", "0")
    
    tracker = LiveYogaTracker(pose_type=pose_type, source=source)
    live_yoga_sessions[tracker.session_id] = tracker
    tracker.start()
    
    return {"status": "started", "session_id": tracker.session_id, "pose_type": pose_type}


@pose_bp.get("/yoga/status_live/{session_id}")
def status_live_yoga(session_id: str):
    tracker = live_yoga_sessions.get(session_id)
    if not tracker:
        raise HTTPException(status_code=404, detail="Session not found")
    return tracker.get_status()


@pose_bp.post("/yoga/stop_live/{session_id}")
def stop_live_yoga(session_id: str):
    tracker = live_yoga_sessions.get(session_id)
    if not tracker:
        raise HTTPException(status_code=404, detail="Session not found")
    tracker.stop()
    del live_yoga_sessions[session_id]
    return {"status": "stopped", "session_id": session_id}


@pose_bp.post("/yoga/recommend")
def recommend_yoga(req: YogaRecommendRequest):
    rs = RecipeService()
    
    if req.target_pose:
        # User selected a specific pose from the 6 and clicked AI Recommend
        pose_name = req.target_pose.replace('_', ' ').title()
        prompt = (
            f"You are an expert AI Yoga Coach. The user wants to learn more about '{pose_name}'. "
            f"Based on their profile ({req.context}), give 3 clear, step-by-step instructions on how to perform "
            f"'{pose_name}' correctly. Explain briefly why it is good for them right now. Keep it under 120 words. "
            f"Be warm and motivating."
        )
    else:
        # Build a rich, accuracy-aware prompt
        accuracy_note = ""
        if req.last_pose and req.session_accuracy > 0:
            if req.session_accuracy >= 80:
                accuracy_note = (
                    f"In their last session they practiced the {req.last_pose.replace('_', ' ').title()} pose "
                    f"with excellent accuracy ({req.session_accuracy:.0f}%) and held it for {req.hold_time:.0f}s. "
                    "They are ready for a more advanced challenge."
                )
            elif req.session_accuracy >= 50:
                accuracy_note = (
                    f"In their last session they practiced the {req.last_pose.replace('_', ' ').title()} pose "
                    f"with moderate accuracy ({req.session_accuracy:.0f}%) and held it for {req.hold_time:.0f}s. "
                    "Recommend a pose that addresses weak points or consolidates this pose."
                )
            else:
                accuracy_note = (
                    f"In their last session they struggled with the {req.last_pose.replace('_', ' ').title()} pose "
                    f"(only {req.session_accuracy:.0f}% accuracy, {req.hold_time:.0f}s hold). "
                    "Recommend a simpler, foundational pose to build strength and balance."
                )

        core_poses = ["Tree Pose", "Warrior II", "Downward Dog", "Mountain Pose", "Cobra Pose", "Plank Pose"]

        prompt = (
            "You are an expert AI Yoga Coach. Based on the user profile and recent session performance, "
            "recommend exactly ONE specific yoga pose. You can recommend ANY yoga pose in the world that suits the user's current level. "
            f"CRITICAL INSTRUCTION: You MUST pick a DIFFERENT pose from what they did last time or what was recently recommended. "
            f"Do not recommend '{req.last_pose}' or anything mentioned in the previous recommendation. "
            "Explain briefly why this unique pose is ideal for them right now, and provide 3 clear step-by-step instructions on how "
            "to perform it correctly. Keep it under 120 words. Be warm and motivating.\n\n"
            f"User Profile: {req.context}\n"
            f"{accuracy_note}\n"
            f"Previous Recommendation: {req.previous_recommendation}\n"
            "Recommendation:"
        )

    result = rs.query_groq(prompt)
    return {"recommendation": result}

@pose_bp.post("/yoga/upload_video")
async def upload_yoga_video(pose_type: str = Form(...), video: UploadFile = File(...)):
    if not video.filename:
        raise HTTPException(status_code=400, detail="A video file must be provided.")
        
    try:
        ext = os.path.splitext(video.filename)[1]
        if not ext:
            ext = ".mp4"
            
        fd, temp_path = tempfile.mkstemp(suffix=ext)
        with os.fdopen(fd, 'wb') as f:
            content = await video.read()
            f.write(content)
            
        tracker = LiveYogaTracker(pose_type=pose_type, source=temp_path)
        
        # Monkey-patch stop to clean up the temp file
        original_stop = tracker.stop
        def new_stop():
            original_stop()
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
        tracker.stop = new_stop
        
        live_yoga_sessions[tracker.session_id] = tracker
        tracker.start()
        
        return {"status": "started", "session_id": tracker.session_id, "pose_type": pose_type}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@pose_bp.get("/yoga")
def yoga_sessions():
    return []
