import cv2
import math
import os
import numpy as np
import os

# ──────────────────────────────────────────────────────────────────────────────
# MediaPipe backend selection
# MediaPipe ≥0.10 dropped mp.solutions.pose in favour of the Tasks API.
# We try the Tasks API first; fall back to mp.solutions if available.
# ──────────────────────────────────────────────────────────────────────────────

HAS_MP_SOLUTIONS = False  # legacy API flag (kept for compatibility)
_USE_TASKS = False         # whether the new Tasks API is active

# Use the new MediaPipe Tasks API (compatible with mediapipe 0.10+)
try:
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision
    from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
    import mediapipe as mp

    # ── Try new Tasks API (mediapipe ≥ 0.10) ──────────────────────────────────
    from mediapipe.tasks import python as _mp_python
    from mediapipe.tasks.python import vision as _mp_vision
    from mediapipe.tasks.python.vision import (
        PoseLandmarker as _PoseLandmarker,
        PoseLandmarkerOptions as _PLOptions,
        RunningMode as _RunningMode,
    )

    # Locate the bundled model file
    _MODEL_PATHS = [
        os.path.join(os.path.dirname(__file__), "..", "models", "pose_landmarker_lite.task"),
        os.path.join(os.path.dirname(__file__), "..", "models", "pose_landmarker_full.task"),
        os.path.join(os.path.dirname(__file__), "..", "models", "pose_landmarker_heavy.task"),
    ]
    _MODEL_PATH = next((p for p in _MODEL_PATHS if os.path.exists(p)), None)

    if _MODEL_PATH:
        _USE_TASKS = True
    else:
        raise FileNotFoundError("No pose_landmarker .task model found in models/")

except Exception as _e:
    # ── Fallback: try legacy mp.solutions.pose ────────────────────────────────
    try:
        import mediapipe as mp
        mpPose = mp.solutions.pose
        mpDraw = mp.solutions.drawing_utils
        HAS_MP_SOLUTIONS = True
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────────────────────
# MediaPipe landmark index → human-readable (same indices as mp.solutions.pose)
# ──────────────────────────────────────────────────────────────────────────────
# 0=nose, 11=left_shoulder, 12=right_shoulder, 13=left_elbow, 14=right_elbow,
# 15=left_wrist, 16=right_wrist, 23=left_hip, 24=right_hip,
# 25=left_knee, 26=right_knee, 27=left_ankle, 28=right_ankle
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
    Unified pose detector that works with both:
      • MediaPipe Tasks API  (mediapipe ≥ 0.10, uses pose_landmarker_lite.task)
      • Legacy mp.solutions  (mediapipe < 0.10)
    Pose detector using MediaPipe Tasks API (mediapipe >= 0.10).
    Finds pose landmarks and calculates angles.
    """

    def __init__(self, mode=False, complexity=1, smooth_landmarks=True,
                 enable_segmentation=False, smooth_segmentation=True,
                 detectionCon=0.5, trackCon=0.5):

        self._results = None          # last raw mediapipe result
        self._landmarks_cache = []    # last landmark list

        if _USE_TASKS:
            base_opts = _mp_python.BaseOptions(model_asset_path=_MODEL_PATH)
            opts = _PLOptions(
                base_options=base_opts,
                running_mode=_RunningMode.IMAGE,
                num_poses=1,
                min_pose_detection_confidence=detectionCon,
                min_pose_presence_confidence=detectionCon,
                min_tracking_confidence=trackCon,
            )
            self._detector = _PoseLandmarker.create_from_options(opts)
            self.pose = self._detector  # non-None signals "ready"

        elif HAS_MP_SOLUTIONS:
            self.pose = mpPose.Pose(
                static_image_mode=mode,
                model_complexity=complexity,
                smooth_landmarks=smooth_landmarks,
                min_detection_confidence=detectionCon,
                min_tracking_confidence=trackCon,
            )
        else:
            self.pose = None

    # ── public interface ───────────────────────────────────────────────────────

    def findPose(self, img, draw=False):
        """Detect pose landmarks in *img* (BGR). Returns the image."""
        if self.pose is None:
            return img

        self._landmarks_cache = []

        if _USE_TASKS:
            self._results = self._run_tasks(img)
        else:
            self._results = self._run_solutions(img, draw)
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
        """Return list of [id, cx, cy] for every landmark."""
        if self._landmarks_cache:
            return self._landmarks_cache

        lm_list = []

        if _USE_TASKS:
            if self._results and self._results.pose_landmarks:
                h, w = img.shape[:2]
                for idx, lm in enumerate(self._results.pose_landmarks[0]):
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    lm_list.append([idx, cx, cy])
                    if draw:
                        cv2.circle(img, (cx, cy), 5, (0, 0, 255), cv2.FILLED)

        elif HAS_MP_SOLUTIONS:
            if self._results and self._results.pose_landmarks:
                h, w = img.shape[:2]
                for idx, lm in enumerate(self._results.pose_landmarks.landmark):
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    lm_list.append([idx, cx, cy])
                    if draw:
                        cv2.circle(img, (cx, cy), 8, (0, 0, 255), cv2.FILLED)

        self._landmarks_cache = lm_list
        return lm_list

    def findAngle(self, img, p1, p2, p3, landmarks_list, draw=True):
        """Calculate angle at p2 formed by p1-p2-p3."""
        try:
            if len(landmarks_list) <= max(p1, p2, p3):
                return 0
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

            x1, y1 = landmarks_list[p1][1], landmarks_list[p1][2]
            x2, y2 = landmarks_list[p2][1], landmarks_list[p2][2]
            x3, y3 = landmarks_list[p3][1], landmarks_list[p3][2]

            angle = math.degrees(
                math.atan2(y3 - y2, x3 - x2) - math.atan2(y1 - y2, x1 - x2)
            )
            if angle < 0:
                angle += 360

            if draw:
                cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), 3)
                cv2.line(img, (x3, y3), (x2, y2), (255, 255, 255), 3)
                for pt in [(x1, y1), (x2, y2), (x3, y3)]:
                    cv2.circle(img, pt, 10, (0, 0, 255), cv2.FILLED)
                    cv2.circle(img, pt, 15, (0, 0, 255), 2)
                cv2.circle(img, (x1, y1), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x2, y2), 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x3, y3), 10, (0, 0, 255), cv2.FILLED)
                cv2.putText(img, str(int(angle)), (x2 - 50, y2 + 50),
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2)

            return angle
        except Exception:
            return 0

    # ── private helpers ────────────────────────────────────────────────────────

    def _run_tasks(self, img):
        """Run PoseLandmarker (Tasks API) on a BGR frame."""
        try:
            import mediapipe as mp
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            return self._detector.detect(mp_image)
        except Exception:
            return None

    def _run_solutions(self, img, draw):
        """Run mp.solutions.pose on a BGR frame."""
        try:
            imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = self.pose.process(imgRGB)
            if results and results.pose_landmarks and draw:
                mpDraw.draw_landmarks(
                    img, results.pose_landmarks, mpPose.POSE_CONNECTIONS,
                    mpDraw.DrawingSpec(color=(255, 255, 255), thickness=2, circle_radius=2),
                    mpDraw.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=5),
                )
            return results
        except Exception:
            return None
