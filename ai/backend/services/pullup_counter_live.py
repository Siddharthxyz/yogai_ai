"""
Pull Up Counter Live (Webcam)
Tracks pull ups from webcam in real-time
"""

import cv2
import numpy as np
from services.pose_module import PoseDetectorModified

class PullUpCounterLive:
    def __init__(self, source: int = 0):
        self.source = source
        self.detector = PoseDetectorModified()
        self.counter = 0.0
        self.direction = 0
        self.feedback = "Fix Form"
        self.form_msg = "Waiting for Pose"
        self.progress = 0
        self.angles = {}
        self.current_frame = None

    def process_frame(self, frame):
        frame = self.detector.findPose(frame, draw=False)
        landmarks_list = self.detector.findPosition(frame, draw=False)

        if len(landmarks_list) != 0:
            elbow_angle = self.detector.findAngle(frame, 11, 13, 15, landmarks_list, draw=True)
            
            progress_percentage = np.interp(elbow_angle, (30, 160), (100, 0))
            self.angles = {"elbow": round(elbow_angle, 1)}

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
            self.form_msg = "Step back! Full body needed"
            self.feedback = "Camera needs wide view"
            self.progress = 0

        return frame

    def run(self):
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            print(f"Error: Camera {self.source} not found")
            return

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            frame = self.process_frame(frame)
            # Store frame for streaming (don't display locally)
            self.current_frame = frame

        cap.release()

    def get_status(self):
        return {
            "exercise": "pullup",
            "reps": int(self.counter),
            "progress": int(self.progress),
            "feedback": self.feedback,
            "form_message": self.form_msg,
            "angles": self.angles
        }
