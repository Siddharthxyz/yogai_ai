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

    def process_frame(self, frame):
        frame = self.detector.findPose(frame, draw=False)
        landmarks_list = self.detector.findPosition(frame, draw=False)

        if len(landmarks_list) != 0:
            elbow_angle = self.detector.findAngle(frame, 11, 13, 15, landmarks_list, draw=True)
            shoulder_angle = self.detector.findAngle(frame, 23, 11, 13, landmarks_list, draw=True)
            
            progress_percentage = np.interp(elbow_angle, (50, 160), (100, 0))
            self.angles = {"elbow": round(elbow_angle, 1), "shoulder": round(shoulder_angle, 1)}

            if shoulder_angle > 150:
                self.form_msg = "Form is Correct"
            else:
                self.form_msg = "Keep your shoulder stable"

            if shoulder_angle > 150:
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
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            print(f"Error: Video {self.video_path} not found")
            return

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = self.process_frame(frame)
            cv2.imshow('Bicep Curl Counter', frame)
            if cv2.waitKey(30) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

    def get_status(self):
        return {
            "exercise": "bicep_curl",
            "reps": int(self.counter),
            "progress": int(self.progress),
            "feedback": self.feedback,
            "form_message": self.form_msg,
            "angles": self.angles
        }
