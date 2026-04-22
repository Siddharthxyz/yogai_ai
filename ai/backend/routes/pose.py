from fastapi import APIRouter, UploadFile, File, HTTPException
import cv2
import numpy as np

from services.pose_module import PoseDetectorModified

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


@pose_bp.get("/yoga")
def yoga_sessions():
    return []
