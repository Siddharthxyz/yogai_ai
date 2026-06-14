"""
Bicep Curl Counter (Video File)
Tracks bicep curls from a video file
"""

import cv2
import numpy as np
from services.pose_module import PoseDetectorModified

class BicepCurlCounter:
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.detector = PoseDetectorModified()
        self.counter = 0.0
        self.direction = 0
        self.feedback = "Fix Form"
        self.form_msg = "Waiting for Pose"
        self.progress = 0
        self.angles = {}
        self.current_frame = None
        self.is_running = False

    def process_frame(self, frame):
        frame = self.detector.findPose(frame, draw=False)
        landmarks_list = self.detector.findPosition(frame, draw=False)

        if len(landmarks_list) != 0:
            elbow_angle = self.detector.findAngle(frame, 11, 13, 15, landmarks_list, draw=True)
            shoulder_angle = self.detector.findAngle(frame, 23, 11, 13, landmarks_list, draw=True)
            
            progress_percentage = np.interp(elbow_angle, (50, 160), (100, 0))
            self.angles = {"elbow": round(elbow_angle, 1), "shoulder": round(shoulder_angle, 1)}

            self.form_msg = "Form is Correct" if shoulder_angle > 150 else "Keep your shoulder stable"

            # Rep counting logic (independent of shoulder angle to prevent camera framing issues)
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
            
            self.progress = progress_percentage
        else:
            self.form_msg = "Step back! Full body needed"
            self.feedback = "Camera needs wide view"
            self.progress = 0

        return frame

    def run(self):
        import time
        self.is_running = True
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            print(f"Error: Video {self.video_path} not found")
            self.is_running = False
            return

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_delay = 1.0 / fps

        while self.is_running and cap.isOpened():
            success, frame = cap.read()
            if not success:
                # Video ended — stop gracefully
                break

            frame = self.process_frame(frame)
            self.current_frame = frame
            time.sleep(frame_delay)

        self.is_running = False
        self.form_msg = f"Analysis complete — {int(self.counter)} reps counted"
        cap.release()

    def get_status(self):
        return {
            "exercise": "bicep_curl",
            "reps": int(self.counter),
            "progress": int(self.progress),
            "feedback": self.feedback,
            "form_message": self.form_msg,
            "angles": self.angles
        }
