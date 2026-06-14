import cv2
import math
import numpy as np
import os

# Use the new MediaPipe Tasks API (compatible with mediapipe 0.10+)
try:
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision
    from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
    import mediapipe as mp

    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'pose_landmarker_lite.task')
    MODEL_PATH = os.path.abspath(MODEL_PATH)
    HAS_TASKS_API = os.path.exists(MODEL_PATH)
    if not HAS_TASKS_API:
        print(f"[pose_module] WARNING: Model not found at {MODEL_PATH}")
except Exception as e:
    HAS_TASKS_API = False
    print(f"[pose_module] WARNING: Could not import MediaPipe Tasks API: {e}")


class PoseDetectorModified:
    """
    Pose detector using MediaPipe Tasks API (mediapipe >= 0.10).
    Finds pose landmarks and calculates angles.
    """

    def __init__(self, mode=False, complexity=1, smooth_landmarks=True,
                 enable_segmentation=False, smooth_segmentation=True,
                 detectionCon=0.5, trackCon=0.5):
        self.detectionCon = detectionCon
        self.trackCon = trackCon
        self._last_result = None
        self._landmarker = None

        if HAS_TASKS_API:
            try:
                options = PoseLandmarkerOptions(
                    base_options=mp_tasks.BaseOptions(model_asset_path=MODEL_PATH),
                    running_mode=RunningMode.IMAGE,
                    num_poses=1,
                    min_pose_detection_confidence=detectionCon,
                    min_pose_presence_confidence=detectionCon,
                    min_tracking_confidence=trackCon,
                )
                self._landmarker = PoseLandmarker.create_from_options(options)
                print("[pose_module] PoseLandmarker (Tasks API) initialized successfully.")
            except Exception as e:
                print(f"[pose_module] ERROR creating PoseLandmarker: {e}")
                self._landmarker = None

    def findPose(self, img, draw=True):
        """Find pose in image using new Tasks API."""
        if self._landmarker is None:
            return img

        try:
            imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=imgRGB)
            self._last_result = self._landmarker.detect(mp_image)

            if draw and self._last_result and self._last_result.pose_landmarks:
                h, w = img.shape[:2]
                for landmark_list in self._last_result.pose_landmarks:
                    for lm in landmark_list:
                        cx, cy = int(lm.x * w), int(lm.y * h)
                        cv2.circle(img, (cx, cy), 5, (0, 0, 255), cv2.FILLED)
        except Exception as e:
            pass

        return img

    def findPosition(self, img, draw=True):
        """Get landmark positions as list of [id, x, y]."""
        landmarks_list = []

        try:
            if self._last_result and self._last_result.pose_landmarks:
                h, w = img.shape[:2]
                for landmark_list in self._last_result.pose_landmarks:
                    for id, lm in enumerate(landmark_list):
                        cx, cy = int(lm.x * w), int(lm.y * h)
                        landmarks_list.append([id, cx, cy])
                        if draw:
                            cv2.circle(img, (cx, cy), 8, (0, 0, 255), cv2.FILLED)
        except Exception as e:
            pass

        return landmarks_list

    def findAngle(self, img, p1, p2, p3, landmarks_list, draw=True):
        """Calculate angle between three landmarks."""
        try:
            if len(landmarks_list) <= max(p1, p2, p3):
                return 0

            x1, y1 = landmarks_list[p1][1:]
            x2, y2 = landmarks_list[p2][1:]
            x3, y3 = landmarks_list[p3][1:]

            angle = math.degrees(math.atan2(y3 - y2, x3 - x2) - math.atan2(y1 - y2, x1 - x2))
            if angle < 0:
                angle += 360

            if draw:
                cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), 3)
                cv2.line(img, (x3, y3), (x2, y2), (255, 255, 255), 3)
                cv2.circle(img, (x1, y1), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x2, y2), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x3, y3), 10, (0, 0, 255), cv2.FILLED)
                cv2.putText(img, str(int(angle)), (x2 - 50, y2 + 50),
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2)

            return angle
        except:
            return 0
