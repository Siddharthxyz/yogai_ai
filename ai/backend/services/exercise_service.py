"""
Exercise Service (Video File Version)
========================================
Provides exercise tracking from video files stored on the server.
Each exercise counter runs on a separate video file source.

Supported exercises: bicep_curl, pushup, squat, deadlift, pullup
"""

import uuid
import logging
import threading
import time
from typing import Dict
import cv2
import numpy as np

from services.pose_module import PoseDetectorModified

logger = logging.getLogger(__name__)

class VideoExerciseTracker:
    """Tracks exercises from a video file (MP4, AVI, etc.)"""
    
    def __init__(self, exercise_type: str, video_path: str):
        self.session_id = str(uuid.uuid4())
        self.exercise_type = exercise_type
        self.video_path = video_path  # Path to video file
        self.detector = PoseDetectorModified()
        
        self.counter = 0.0
        self.direction = 0  
        self.feedback = "Fix Form"
        self.form_msg = "Waiting for Pose"
        self.progress = 0
        self.is_running = False
        self.thread = None
        self.angles = {}
        self.start_time = time.time()
        self.correct_form = 0

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.start_time = time.time()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info(f"Started video exercise tracker session {self.session_id} for {self.exercise_type} from {self.video_path}")

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
        logger.info(f"Stopped video session {self.session_id}")

    def _run_loop(self):
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            self.form_msg = f"Error: Video {self.video_path} not found"
            self.is_running = False
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        logger.info(f"Video loop started for {self.exercise_type} at {fps} FPS")

        while self.is_running:
            success, frame = cap.read()
            if not success:
                # Loop video if it ends
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = self.detector.findPose(frame, draw=False)
            landmarks_list = self.detector.findPosition(frame, draw=False)

            if len(landmarks_list) != 0:
                progress_percentage = 0
                
                if self.exercise_type == "bicep_curl":
                    elbow_angle = self.detector.findAngle(frame, 11, 13, 15, landmarks_list, draw=True)
                    shoulder_angle = self.detector.findAngle(frame, 23, 11, 13, landmarks_list, draw=True)
                    
                    progress_percentage = np.interp(elbow_angle, (50, 160), (100, 0))
                    self.angles = {"elbow": round(elbow_angle, 1), "shoulder": round(shoulder_angle, 1)}

                    if shoulder_angle > 150:
                        self.correct_form = 1
                        self.form_msg = "Form is Correct"
                    else:
                        self.correct_form = 0
                        self.form_msg = "Keep your shoulder stable"

                    if progress_percentage >= 95:
                        if self.direction == 0:
                            self.counter += 0.5
                            self.direction = 1
                            self.feedback = "Down"
                    
                    if progress_percentage <= 5:
                        if self.direction == 1:
                            self.counter += 0.5
                            self.direction = 0
                            self.feedback = "Up"

                elif self.exercise_type == "pushup":
                    shoulder_angle = self.detector.findAngle(frame, 12, 14, 16, landmarks_list, draw=True)
                    hip_angle = self.detector.findAngle(frame, 12, 24, 26, landmarks_list, draw=True)
                    
                    progress_percentage = np.interp(shoulder_angle, (60, 160), (100, 0))
                    self.angles = {"shoulder": round(shoulder_angle, 1), "hip": round(hip_angle, 1)}

                    if hip_angle > 150:
                        self.correct_form = 1
                        self.form_msg = "Form is Correct"
                    else:
                        self.correct_form = 0
                        self.form_msg = "Keep your back straight"

                    if progress_percentage >= 95:
                        if self.direction == 0:
                            self.counter += 0.5
                            self.direction = 1
                            self.feedback = "Up"
                    
                    if progress_percentage <= 5:
                        if self.direction == 1:
                            self.counter += 0.5
                            self.direction = 0
                            self.feedback = "Down"
                
                elif self.exercise_type == "squat":
                    knee_angle = self.detector.findAngle(frame, 24, 26, 28, landmarks_list, draw=True)
                    hip_angle = self.detector.findAngle(frame, 12, 24, 26, landmarks_list, draw=True)
                    
                    progress_percentage = np.interp(knee_angle, (90, 160), (100, 0))
                    self.angles = {"knee": round(knee_angle, 1), "hip": round(hip_angle, 1)}

                    if hip_angle > 150:
                        self.correct_form = 1
                        self.form_msg = "Form is Correct"
                    else:
                        self.correct_form = 0
                        self.form_msg = "Keep your back straight"

                    if progress_percentage >= 95:
                        if self.direction == 0:
                            self.counter += 0.5
                            self.direction = 1
                            self.feedback = "Up"
                    if progress_percentage <= 5:
                        if self.direction == 1:
                            self.counter += 0.5
                            self.direction = 0
                            self.feedback = "Down"

                elif self.exercise_type == "deadlift":
                    hip_angle = self.detector.findAngle(frame, 11, 23, 25, landmarks_list, draw=True)
                    knee_angle = self.detector.findAngle(frame, 23, 25, 27, landmarks_list, draw=True)
                    
                    progress_percentage = np.interp(hip_angle, (30, 160), (100, 0))
                    self.angles = {"hip": round(hip_angle, 1), "knee": round(knee_angle, 1)}

                    if knee_angle > 100 or hip_angle > 140:
                        self.correct_form = 1
                        self.form_msg = "Form is Correct"
                    elif knee_angle < 80:
                        self.correct_form = 0
                        self.form_msg = "Don't squat — hinge at the hips"
                    else:
                        self.correct_form = 1
                        self.form_msg = "Keep back neutral"

                    if progress_percentage >= 95:
                        if self.direction == 0:
                            self.counter += 0.5
                            self.direction = 1
                            self.feedback = "Up"
                    if progress_percentage <= 5:
                        if self.direction == 1:
                            self.counter += 0.5
                            self.direction = 0
                            self.feedback = "Down"

                elif self.exercise_type == "pullup":
                    elbow_angle = self.detector.findAngle(frame, 11, 13, 15, landmarks_list, draw=True)
                    
                    progress_percentage = np.interp(elbow_angle, (30, 160), (100, 0))
                    self.angles = {"elbow": round(elbow_angle, 1)}

                    self.correct_form = 1
                    self.form_msg = "Pull-up Tracking"

                    if progress_percentage >= 90:
                        if self.direction == 0:
                            self.counter += 0.5
                            self.direction = 1
                            self.feedback = "Down"
                    if progress_percentage <= 10:
                        if self.direction == 1:
                            self.counter += 0.5
                            self.direction = 0
                            self.feedback = "Up"
                
                self.progress = progress_percentage
            else:
                self.form_msg = "No pose detected"
                self.feedback = "Position body in frame"
                self.progress = 0

            if int(time.time() * 2) % 2 == 0:
                logger.debug(f"Video Tracker: Counter={self.counter}, Feedback={self.feedback}, Progress={self.progress}")

            time.sleep(0.05)

        cap.release()
        cv2.destroyAllWindows()

    def get_status(self) -> dict:
        elapsed = time.time() - self.start_time
        return {
            "session_id": self.session_id,
            "exercise": self.exercise_type,
            "reps": int(self.counter),
            "progress": int(self.progress),
            "feedback": self.feedback,
            "form_message": self.form_msg,
            "angles": self.angles,
            "duration": round(elapsed, 1),
            "is_running": self.is_running,
            "video_path": self.video_path
        }

class ExerciseService:
    """Service for managing video file-based exercise tracking"""
    
    def __init__(self):
        self._sessions: Dict[str, VideoExerciseTracker] = {}

    def start_session(self, exercise_type: str, video_path: str) -> dict:
        # Allow multiple video sessions (no camera conflicts)
        tracker = VideoExerciseTracker(exercise_type, video_path)
        tracker.start()
        self._sessions[tracker.session_id] = tracker
        return tracker.get_status()

    def get_status(self, session_id: str) -> dict:
        tracker = self._sessions.get(session_id)
        if not tracker:
            return {"error": "Session not found"}
        return tracker.get_status()

    def stop_session(self, session_id: str) -> dict:
        tracker = self._sessions.get(session_id)
        if not tracker:
            return {"error": "Session not found"}
        tracker.stop()
        status = tracker.get_status()
        del self._sessions[session_id]
        return status

    def list_supported_exercises(self) -> list:
        return [
            {"type": "bicep_curl", "description": "Bicep Curl"},
            {"type": "pushup", "description": "Push-Up"},
            {"type": "squat", "description": "Squat"},
            {"type": "deadlift", "description": "Deadlift"},
            {"type": "pullup", "description": "Pull-Up"}
        ]
