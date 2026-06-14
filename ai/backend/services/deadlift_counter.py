"""
Deadlift Counter (Video File)
Tracks deadlifts from a video file
"""

import cv2
import numpy as np
from services.pose_module import PoseDetectorModified

class DeadliftCounter:
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
            hip_angle = self.detector.findAngle(frame, 11, 23, 25, landmarks_list, draw=True)
            knee_angle = self.detector.findAngle(frame, 23, 25, 27, landmarks_list, draw=True)
            
            progress_percentage = np.interp(hip_angle, (30, 160), (100, 0))
            self.angles = {"hip": round(hip_angle, 1), "knee": round(knee_angle, 1)}

            if knee_angle > 100 or hip_angle > 140:
                self.form_msg = "Form is Correct"
            elif knee_angle < 80:
                self.form_msg = "Don't squat — hinge at the hips"
            else:
                self.form_msg = "Keep back neutral"

            # Rep counting logic (independent of form check to handle camera framing/estimation limits)
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
                break

            frame = self.process_frame(frame)
            self.current_frame = frame
            time.sleep(frame_delay)

        self.is_running = False
        self.form_msg = f"Analysis complete — {int(self.counter)} reps counted"
        cap.release()

    def get_status(self):
        return {
            "exercise": "deadlift",
            "reps": int(self.counter),
            "progress": int(self.progress),
            "feedback": self.feedback,
            "form_message": self.form_msg,
            "angles": self.angles
        }
