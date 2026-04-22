import cv2
import math
import numpy as np

# Try importing mediapipe Solutions (older API)
try:
    import mediapipe as mp
    mpPose = mp.solutions.pose
    mpDraw = mp.solutions.drawing_utils
    HAS_MP_SOLUTIONS = True
except AttributeError:
    HAS_MP_SOLUTIONS = False


class PoseDetectorModified:
    """
    Pose detector using MediaPipe that finds pose landmarks and calculates angles.
    Compatible with both old and new MediaPipe versions.
    """

    def __init__(self, mode=False, complexity=1, smooth_landmarks=True,
                 enable_segmentation=False, smooth_segmentation=True,
                 detectionCon=0.5, trackCon=0.5):
        """
        Initialize the pose detector.
        """
        self.detectionCon = detectionCon
        self.trackCon = trackCon
        self.results = None
        self.pose = None
        
        if HAS_MP_SOLUTIONS:
            try:
                self.pose = mpPose.Pose(
                    static_image_mode=mode,
                    model_complexity=complexity,
                    smooth_landmarks=smooth_landmarks,
                    min_detection_confidence=detectionCon,
                    min_tracking_confidence=trackCon
                )
            except:
                self.pose = None

    def findPose(self, img, draw=True):
        """Find pose in image."""
        if self.pose is None:
            return img
            
        try:
            imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            self.results = self.pose.process(imgRGB)

            if self.results and self.results.pose_landmarks:
                if draw and HAS_MP_SOLUTIONS:
                    # Drawing with white lines and red dots
                    mpDraw.draw_landmarks(img, self.results.pose_landmarks, 
                                        mpPose.POSE_CONNECTIONS,
                                        mpDraw.DrawingSpec(color=(255, 255, 255), thickness=2, circle_radius=2),
                                        mpDraw.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=5))
        except:
            pass
        
        return img

    def findPosition(self, img, draw=True):
        """Get landmark positions."""
        landmarks_list = []
        
        try:
            if self.results and self.results.pose_landmarks:
                for id, lm in enumerate(self.results.pose_landmarks.landmark):
                    h, w, c = img.shape
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    landmarks_list.append([id, cx, cy])
                    if draw:
                        # Use Red for the circles to match user's project
                        cv2.circle(img, (cx, cy), 8, (0, 0, 255), cv2.FILLED)
        except:
            pass
        
        return landmarks_list

    def findAngle(self, img, p1, p2, p3, landmarks_list, draw=True):
        """Calculate angle between three landmarks with matching style."""
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
                # White lines, red circles
                cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), 3)
                cv2.line(img, (x3, y3), (x2, y2), (255, 255, 255), 3)
                cv2.circle(img, (x1, y1), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x2, y2), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x3, y3), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x1, y1), 15, (0, 0, 255), 2)
                cv2.circle(img, (x2, y2), 15, (0, 0, 255), 2)
                cv2.circle(img, (x3, y3), 15, (0, 0, 255), 2)
                cv2.putText(img, str(int(angle)), (x2 - 50, y2 + 50), cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2)

            return angle
        except:
            return 0


