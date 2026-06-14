import uuid
import logging
import threading
import time
from typing import Dict, Optional
import cv2

from services.pose_module import PoseDetectorModified

logger = logging.getLogger(__name__)

class LiveYogaTracker:
    def __init__(self, pose_type: str, source: str = "0"):
        self.session_id = str(uuid.uuid4())
        self.pose_type = pose_type
        self.source = int(source) if source.isdigit() else source
        self.detector = PoseDetectorModified()
        
        self.hold_time = 0.0
        self.feedback = "Fix Form"
        self.form_msg = "Waiting for Pose"
        self.progress = 0
        self.is_running = False
        self.thread = None
        self.angles = {}
        self.start_time = time.time()
        
        # State tracking for continuous holding
        self.perfect_form_start = None
        self.is_perfect = False

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.start_time = time.time()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info(f"Started yoga tracker session {self.session_id} for {self.pose_type} source {self.source}")

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
        logger.info(f"Stopped yoga tracker session {self.session_id}")

    def get_status(self) -> Dict:
        return {
            "session_id": self.session_id,
            "pose_type": self.pose_type,
            "hold_time": round(self.hold_time, 1),
            "feedback": self.feedback,
            "form_msg": self.form_msg,
            "progress": self.progress,
            "angles": self.angles,
            "is_running": self.is_running,
            "uptime": round(time.time() - self.start_time, 1) if self.is_running else 0
        }

    def _run_loop(self):
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            logger.error(f"Failed to open video source {self.source}")
            self.is_running = False
            return

        is_video_file = self.source != "0" and self.source != "1"
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0: fps = 30
        
        frames_processed = 0
        logger.info(f"Yoga loop started for {self.session_id}")
        
        try:
            while self.is_running:
                success, img = cap.read()
                if not success:
                    if is_video_file:
                        logger.info("End of video file reached.")
                        self.is_running = False
                        break
                    logger.warning("Failed to grab frame. Retrying...")
                    time.sleep(0.5)
                    continue

                frames_processed += 1
                
                if is_video_file:
                    # Subsample to ~10 FPS for performance
                    if frames_processed % max(1, int(fps/10)) != 0:
                        continue

                img = self.detector.findPose(img, draw=False)
                lmList = self.detector.findPosition(img, draw=False)

                # Fallback for sideways videos (missing rotation metadata)
                if len(lmList) == 0 and is_video_file:
                    img_rot1 = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
                    img_rot1 = self.detector.findPose(img_rot1, draw=False)
                    lmList1 = self.detector.findPosition(img_rot1, draw=False)
                    
                    if len(lmList1) > 0:
                        img = img_rot1
                        lmList = lmList1
                    else:
                        img_rot2 = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
                        img_rot2 = self.detector.findPose(img_rot2, draw=False)
                        lmList2 = self.detector.findPosition(img_rot2, draw=False)
                        if len(lmList2) > 0:
                            img = img_rot2
                            lmList = lmList2

                if len(lmList) > 0:
                    self._analyze_pose(img, lmList)
                else:
                    # Debug: save the first failed frame to see what OpenCV sees
                    if not hasattr(self, 'saved_debug_frame') and is_video_file:
                        cv2.imwrite("C:/Users/manis/OneDrive/Desktop/Project/yogai_ai/ai/backend/failed_frame.jpg", img)
                        self.saved_debug_frame = True
                        
                    self.form_msg = "Step back! Full body needed"
                    self.feedback = "Camera needs wide view"
                    self.progress = 0
                    self.is_perfect = False
                    self.perfect_form_start = None

                time.sleep(0.1)  # Process at roughly 10 FPS to match real-time

        except Exception as e:
            logger.error(f"Error in yoga loop {self.session_id}: {e}")
        finally:
            cap.release()
            self.is_running = False
            logger.info(f"Yoga loop ended for {self.session_id}")

    def _analyze_pose(self, img, lmList):
        pt = self.pose_type.lower()

        is_correct = False
        feedback_str = "Adjusting..."
        form_msg_str = "Aligning Body"
        progress_val = 0

        # MediaPipe Pose Landmark indices (33 total):
        # 0=nose, 11=L_shoulder, 12=R_shoulder
        # 13=L_elbow, 14=R_elbow, 15=L_wrist, 16=R_wrist
        # 23=L_hip, 24=R_hip, 25=L_knee, 26=R_knee
        # 27=L_ankle, 28=R_ankle, 29=L_heel, 30=R_heel

        # ── TREE POSE ────────────────────────────────────────────────────────────
        if pt == "tree":
            # Both knees
            left_knee  = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)

            # Standing leg = more extended; lifted leg = more bent
            standing = max(left_knee, right_knee)
            bent     = min(left_knee, right_knee)

            # Spine upright: shoulder-hip-knee alignment
            left_hip_align  = self.detector.findAngle(img, 11, 23, 25, lmList, draw=False)
            right_hip_align = self.detector.findAngle(img, 12, 24, 26, lmList, draw=False)
            hip_align = (left_hip_align + right_hip_align) / 2

            self.angles = {"standing_knee": round(standing,1), "bent_knee": round(bent,1), "hip_align": round(hip_align,1)}

            if standing > 155:
                if bent < 110:
                    if hip_align > 140:
                        is_correct = True
                        feedback_str = "Perfect Tree Pose!"
                        form_msg_str = "Hold steady, arms overhead"
                        progress_val = 100
                    else:
                        feedback_str = "Stand taller, straighten your spine"
                        progress_val = 75
                else:
                    feedback_str = "Lift and bend your knee higher"
                    progress_val = 50
            else:
                feedback_str = "Straighten your standing leg fully"
                progress_val = 25

        # ── WARRIOR II ───────────────────────────────────────────────────────────
        elif pt == "warrior":
            left_knee  = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)

            front_knee = min(left_knee, right_knee)   # bent ~80-100°
            back_knee  = max(left_knee, right_knee)   # straight >155°

            # Arms horizontal: elbow-shoulder-hip angle should be ~90°
            left_arm  = self.detector.findAngle(img, 13, 11, 23, lmList, draw=False)
            right_arm = self.detector.findAngle(img, 14, 12, 24, lmList, draw=False)

            self.angles = {
                "front_knee": round(front_knee,1),
                "back_knee":  round(back_knee,1),
                "left_arm":   round(left_arm,1),
                "right_arm":  round(right_arm,1)
            }

            if back_knee > 155:
                if front_knee < 115:
                    arms_ok = (60 < left_arm < 120) or (60 < right_arm < 120)
                    if arms_ok:
                        is_correct = True
                        feedback_str = "Perfect Warrior II!"
                        form_msg_str = "Breathe deeply, gaze forward"
                        progress_val = 100
                    else:
                        feedback_str = "Extend arms fully, keep them parallel to floor"
                        progress_val = 75
                else:
                    feedback_str = "Bend your front knee deeper (aim for 90°)"
                    progress_val = 50
            else:
                feedback_str = "Straighten your back leg fully"
                progress_val = 25

        # ── DOWNWARD DOG ─────────────────────────────────────────────────────────
        elif pt == "downward_dog":
            # Hip fold: shoulder-hip-knee, should be acute (<100°)
            left_hip  = self.detector.findAngle(img, 11, 23, 25, lmList, draw=False)
            right_hip = self.detector.findAngle(img, 12, 24, 26, lmList, draw=False)
            hip_angle = (left_hip + right_hip) / 2

            # Knees straight (>150°)
            left_knee  = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)
            knee_angle = (left_knee + right_knee) / 2

            # Arms straight: elbow angle (shoulder-elbow-wrist) > 155°
            left_elbow  = self.detector.findAngle(img, 11, 13, 15, lmList, draw=False)
            right_elbow = self.detector.findAngle(img, 12, 14, 16, lmList, draw=False)
            elbow_angle = (left_elbow + right_elbow) / 2

            self.angles = {
                "hip_angle":   round(hip_angle,1),
                "knee_angle":  round(knee_angle,1),
                "elbow_angle": round(elbow_angle,1)
            }

            if knee_angle > 145:
                if elbow_angle > 145:
                    if hip_angle < 110:
                        is_correct = True
                        feedback_str = "Perfect Downward Dog!"
                        form_msg_str = "Push heels toward floor"
                        progress_val = 100
                    else:
                        feedback_str = "Push hips up and back more"
                        progress_val = 65
                else:
                    feedback_str = "Straighten your arms fully"
                    progress_val = 50
            else:
                feedback_str = "Straighten your legs, lift your hips"
                progress_val = 30

        # ── MOUNTAIN POSE ────────────────────────────────────────────────────────
        elif pt == "mountain":
            # Knees straight (>160°)
            left_knee  = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)
            knee_angle = (left_knee + right_knee) / 2

            # Hips aligned (>155°)
            left_hip  = self.detector.findAngle(img, 11, 23, 25, lmList, draw=False)
            right_hip = self.detector.findAngle(img, 12, 24, 26, lmList, draw=False)
            hip_angle = (left_hip + right_hip) / 2

            # Shoulders level: shoulder-hip angle
            left_shoulder  = self.detector.findAngle(img, 13, 11, 23, lmList, draw=False)
            right_shoulder = self.detector.findAngle(img, 14, 12, 24, lmList, draw=False)
            shoulder_align = (left_shoulder + right_shoulder) / 2

            self.angles = {
                "knee_angle":     round(knee_angle,1),
                "hip_angle":      round(hip_angle,1),
                "shoulder_align": round(shoulder_align,1)
            }

            if knee_angle > 155:
                if hip_angle > 155:
                    is_correct = True
                    feedback_str = "Perfect Mountain Pose!"
                    form_msg_str = "Breathe, stand tall and rooted"
                    progress_val = 100
                else:
                    feedback_str = "Engage your core, stand fully upright"
                    progress_val = 65
            else:
                feedback_str = "Straighten both legs completely"
                progress_val = 40

        # ── COBRA POSE ───────────────────────────────────────────────────────────
        elif pt == "cobra":
            # Elbows pushing up: shoulder-elbow-wrist angle (>120° = arms pushing)
            left_elbow  = self.detector.findAngle(img, 11, 13, 15, lmList, draw=False)
            right_elbow = self.detector.findAngle(img, 12, 14, 16, lmList, draw=False)
            elbow_angle = (left_elbow + right_elbow) / 2

            # Back arch: shoulder-hip-knee (hips low)
            left_hip  = self.detector.findAngle(img, 11, 23, 25, lmList, draw=False)
            right_hip = self.detector.findAngle(img, 12, 24, 26, lmList, draw=False)
            hip_angle = (left_hip + right_hip) / 2

            # Shoulder open: elbow-shoulder-hip angle
            left_shoulder_open  = self.detector.findAngle(img, 13, 11, 23, lmList, draw=False)
            right_shoulder_open = self.detector.findAngle(img, 14, 12, 24, lmList, draw=False)
            shoulder_open = (left_shoulder_open + right_shoulder_open) / 2

            self.angles = {
                "elbow_angle":   round(elbow_angle,1),
                "hip_angle":     round(hip_angle,1),
                "shoulder_open": round(shoulder_open,1)
            }

            if elbow_angle > 110:
                if hip_angle > 130:
                    is_correct = True
                    feedback_str = "Perfect Cobra Pose!"
                    form_msg_str = "Keep shoulders down and back"
                    progress_val = 100
                else:
                    feedback_str = "Lower your hips to the mat, lift your chest"
                    progress_val = 65
            else:
                feedback_str = "Push up through your palms to lift the chest"
                progress_val = 35

        # ── PLANK POSE ───────────────────────────────────────────────────────────
        elif pt == "plank":
            # Body straight: shoulder-hip-knee (should be ~170-190°)
            left_hip  = self.detector.findAngle(img, 11, 23, 25, lmList, draw=False)
            right_hip = self.detector.findAngle(img, 12, 24, 26, lmList, draw=False)
            hip_angle = (left_hip + right_hip) / 2

            # Knees straight (>155°)
            left_knee  = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)
            knee_angle = (left_knee + right_knee) / 2

            # Arms straight: elbow angle (>145°)
            left_elbow  = self.detector.findAngle(img, 11, 13, 15, lmList, draw=False)
            right_elbow = self.detector.findAngle(img, 12, 14, 16, lmList, draw=False)
            elbow_angle = (left_elbow + right_elbow) / 2

            self.angles = {
                "hip_angle":   round(hip_angle,1),
                "knee_angle":  round(knee_angle,1),
                "elbow_angle": round(elbow_angle,1)
            }

            if knee_angle > 150:
                if elbow_angle > 140:
                    if 145 < hip_angle < 215:
                        is_correct = True
                        feedback_str = "Perfect Plank!"
                        form_msg_str = "Engage core, squeeze glutes"
                        progress_val = 100
                    elif hip_angle >= 215:
                        feedback_str = "Lower your hips — don't pike up"
                        progress_val = 65
                    else:
                        feedback_str = "Raise your hips — don't sag"
                        progress_val = 60
                else:
                    feedback_str = "Lock out your elbows, arms straight"
                    progress_val = 50
            else:
                feedback_str = "Straighten your legs fully"
                progress_val = 35

        else:
            feedback_str = "Unknown Pose"
            form_msg_str = "Please select a supported pose"

        # Update state and hold timer
        self.feedback = "Good Form" if is_correct else "Fix Form"
        self.form_msg = form_msg_str if is_correct else feedback_str
        self.progress = progress_val

        if is_correct:
            if not self.is_perfect:
                self.is_perfect = True
                self.perfect_form_start = time.time()
            else:
                self.hold_time += (time.time() - self.perfect_form_start)
                self.perfect_form_start = time.time()
        else:
            self.is_perfect = False
            self.perfect_form_start = None

# Global dictionary to hold active sessions
live_yoga_sessions: Dict[str, LiveYogaTracker] = {}

def process_yoga_video(filepath: str, pose_type: str) -> dict:
    """
    Process a pre-recorded yoga video frame-by-frame and calculate total hold time.
    """
    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        return {"error": "Failed to open video file"}

    # We can reuse the LiveYogaTracker's analysis logic by instantiating it temporarily
    tracker = LiveYogaTracker(pose_type=pose_type, source="video")
    tracker.is_running = True
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0: fps = 30
    
    frames_processed = 0
    best_progress = 0
    best_angles = {}
    best_feedback = "No valid pose detected"
    
    try:
        while True:
            success, img = cap.read()
            if not success:
                break
                
            frames_processed += 1
            
            # Subsample for speed if video is long (e.g. process 10 fps instead of 30)
            if frames_processed % max(1, int(fps/10)) != 0:
                continue

            img = tracker.detector.findPose(img, draw=False)
            lmList = tracker.detector.findPosition(img, draw=False)

            if len(lmList) > 0:
                tracker._analyze_pose(img, lmList)
                if tracker.progress == 100:
                    tracker.hold_time += (1.0 / (fps / max(1, int(fps/10))))
                
                if tracker.progress >= best_progress:
                    best_progress = tracker.progress
                    best_angles = getattr(tracker, 'angles', {}).copy()
                    best_feedback = tracker.form_msg
            else:
                tracker.progress = 0
    except Exception as e:
        logger.error(f"Error processing video: {e}")
    finally:
        cap.release()

    return {
        "pose_type": pose_type,
        "hold_time": round(tracker.hold_time, 1),
        "best_progress": best_progress,
        "angles": best_angles,
        "feedback": f"Perfect hold: {round(tracker.hold_time, 1)}s. {best_feedback}" if tracker.hold_time > 0 else best_feedback
    }
