"""
Exercise Service (Live Threaded Version - Hardcoded Native Script Logic)
========================================
Provides a way to start a background thread that tracks exercise reps using the server's webcam.
Endpoints call start, status, and stop to manage these threads.

Supported exercises: bicep_curl, pushup, squat, deadlift, pullup
"""

import uuid
import logging
import threading
import time
from typing import Dict, Optional
import cv2
import numpy as np

from services.pose_module import PoseDetectorModified

logger = logging.getLogger(__name__)

class LiveExerciseTracker:
    def __init__(self, exercise_type: str, source: str = "0"):
        self.session_id = str(uuid.uuid4())
        self.exercise_type = exercise_type
        self.source = int(source) if source.isdigit() else source
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
        logger.info(f"Started exercise tracker session {self.session_id} for {self.exercise_type} source {self.source}")

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
        logger.info(f"Stopped session {self.session_id}")

    def _run_loop(self):
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            self.form_msg = f"Error: Source {self.source} not found"
            self.is_running = False
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_delay = 0.03 # Default to ~30 FPS if cap fails to provide FPS

        logger.info(f"Loop started for {self.exercise_type}")

        while self.is_running:
            success, frame = cap.read()
            if not success:
                if isinstance(self.source, str):
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                break

            frame = self.detector.findPose(frame, draw=False)
            landmarks_list = self.detector.findPosition(frame, draw=False)

            if len(landmarks_list) != 0:
                progress_percentage = 0
                progress_bar = 380
                
                if self.exercise_type == "bicep_curl":
                    elbow_angle = self.detector.findAngle(frame, 11, 13, 15, landmarks_list, draw=True)
                    shoulder_angle = self.detector.findAngle(frame, 23, 11, 13, landmarks_list, draw=True)
                    
                    # 160 deg is extended (0% progress), 50 deg is bent (100% progress)
                    progress_percentage = np.interp(elbow_angle, (50, 160), (100, 0))
                    progress_bar = np.interp(elbow_angle, (50, 160), (50, 380))
                    
                    self.angles = {"elbow": round(elbow_angle, 1), "shoulder": round(shoulder_angle, 1)}

                    # Form check: shoulder should be relatively stable
                    if shoulder_angle > 150:
                        self.correct_form = 1
                        self.form_msg = "Form is Correct"
                    else:
                        self.form_msg = "Keep your shoulder stable"

                    if self.correct_form == 1:
                        # Full contraction (Up)
                        if progress_percentage >= 95:
                            if self.direction == 0:
                                self.counter += 0.5
                                self.direction = 1
                                self.feedback = "Down" # Instruction for next phase
                        
                        # Full extension (Down)
                        if progress_percentage <= 5:
                            if self.direction == 1:
                                self.counter += 0.5
                                self.direction = 0
                                self.feedback = "Up" # Instruction for next phase

                elif self.exercise_type == "pushup":
                    shoulder_angle = self.detector.findAngle(frame, 12, 14, 16, landmarks_list, draw=True)
                    hip_angle = self.detector.findAngle(frame, 24, 12, 26, landmarks_list, draw=True)
                    
                    # Hip angle 160+ is straight background (0% down), lower is descending
                    progress_percentage = np.interp(shoulder_angle, (60, 160), (100, 0))
                    
                    self.angles = {"shoulder": round(shoulder_angle, 1), "hip": round(hip_angle, 1)}

                    if hip_angle > 150:
                        self.correct_form = 1
                        self.form_msg = "Form is Correct"
                    else:
                        self.form_msg = "Keep your back straight"

                    if self.correct_form == 1:
                        if progress_percentage >= 95: # Chest down
                            if self.direction == 0:
                                self.counter += 0.5
                                self.direction = 1
                                self.feedback = "Up"
                        
                        if progress_percentage <= 5: # Arms straight
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
                        self.form_msg = "Keep your back straight"

                    if self.correct_form == 1:
                        if progress_percentage >= 95: # Bottom of squat
                            if self.direction == 0:
                                self.counter += 0.5
                                self.direction = 1
                                self.feedback = "Up"
                        if progress_percentage <= 5: # Standing
                            if self.direction == 1:
                                self.counter += 0.5
                                self.direction = 0
                                self.feedback = "Down"

                elif self.exercise_type == "deadlift":
                    # Hip and Knee angles
                    hip_angle = self.detector.findAngle(frame, 11, 23, 25, landmarks_list, draw=True)
                    knee_angle = self.detector.findAngle(frame, 23, 25, 27, landmarks_list, draw=True)
                    
                    progress_percentage = np.interp(hip_angle, (30, 160), (100, 0))
                    
                    self.angles = {"hip": round(hip_angle, 1), "knee": round(knee_angle, 1)}

                    self.correct_form = 1 # Simplified for now
                    self.form_msg = "Deadlift Tracking"

                    if self.correct_form == 1:
                        if progress_percentage >= 95: # Bent over
                            if self.direction == 0:
                                self.counter += 0.5
                                self.direction = 1
                                self.feedback = "Up"
                        if progress_percentage <= 5: # Standing
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

                    if self.correct_form == 1:
                        if progress_percentage >= 90: # Chin over bar
                            if self.direction == 0:
                                self.counter += 0.5
                                self.direction = 1
                                self.feedback = "Down"
                        if progress_percentage <= 10: # Arms straight
                            if self.direction == 1:
                                self.counter += 0.5
                                self.direction = 0
                                self.feedback = "Up"
                
                self.progress = progress_percentage
            else:
                self.progress = 0

            # Internal logging for debugging
            if int(time.time() * 2) % 2 == 0: # Log every ~1 second
                 logger.debug(f"Tracker Status: Counter={self.counter}, Feedback={self.feedback}, Progress={self.progress}")

            # Removed cv2.imshow to prevent thread GUI hangs on Windows
            # The frontend will poll status to show progress/reps
            
            time.sleep(0.01)

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
            "is_running": self.is_running
        }

class ExerciseService:
    def __init__(self):
        self._sessions: Dict[str, LiveExerciseTracker] = {}

    def start_session(self, exercise_type: str, source: str = "0") -> dict:
        # Prevent multiple overlapping camera sessions by stopping them first
        for sid in list(self._sessions.keys()):
            self.stop_session(sid)
            
        tracker = LiveExerciseTracker(exercise_type, source)
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
