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

        logger.info(f"Yoga loop started for {self.session_id}")
        try:
            while self.is_running:
                success, img = cap.read()
                if not success:
                    logger.warning("Failed to grab frame. Retrying...")
                    time.sleep(0.5)
                    continue

                img = self.detector.findPose(img, draw=False)
                lmList = self.detector.findPosition(img, draw=False)

                if len(lmList) > 0:
                    self._analyze_pose(img, lmList)
                else:
                    self.form_msg = "Step back! Full body needed"
                    self.feedback = "Camera needs wide view"
                    self.progress = 0
                    self.is_perfect = False
                    self.perfect_form_start = None

                time.sleep(0.1)  # ~10 FPS

        except Exception as e:
            logger.error(f"Error in yoga loop {self.session_id}: {e}")
        finally:
            cap.release()
            self.is_running = False
            logger.info(f"Yoga loop ended for {self.session_id}")

    def _analyze_pose(self, img, lmList):
        pt = self.pose_type.lower()
        
        # Helper variables
        is_correct = False
        feedback_str = "Adjusting..."
        form_msg_str = "Aligning Body"
        progress_val = 0

        # Tree Pose
        if pt == "tree":
            # Standing leg straight (let's assume right leg is standing)
            right_knee_angle = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)
            # Bent leg (left leg)
            left_knee_angle = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            
            # Since camera might flip, we check both
            standing_angle = max(right_knee_angle, left_knee_angle)
            bent_angle = min(right_knee_angle, left_knee_angle)

            self.angles = {"standing_knee": standing_angle, "bent_knee": bent_angle}
            
            # Tree Pose Logic: one leg straight (~160-180), one leg bent (<90)
            if standing_angle > 160:
                if bent_angle < 100:
                    is_correct = True
                    feedback_str = "Perfect Tree Pose!"
                    form_msg_str = "Hold Steady"
                    progress_val = 100
                else:
                    feedback_str = "Bend your lifted knee more"
                    progress_val = 50
            else:
                feedback_str = "Straighten your standing leg"
                progress_val = 20

        # Warrior II
        elif pt == "warrior":
            # Arms horizontal
            left_shoulder = self.detector.findAngle(img, 13, 11, 23, lmList, draw=False)
            right_shoulder = self.detector.findAngle(img, 14, 12, 24, lmList, draw=False)
            
            # Legs: one bent ~90, one straight ~180
            left_knee = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)
            
            front_knee = min(left_knee, right_knee)
            back_knee = max(left_knee, right_knee)
            
            self.angles = {"front_knee": front_knee, "back_knee": back_knee, "l_shoulder": left_shoulder, "r_shoulder": right_shoulder}

            if back_knee > 150:
                if front_knee < 110:
                    if 70 < left_shoulder < 110 and 70 < right_shoulder < 110:
                        is_correct = True
                        feedback_str = "Perfect Warrior II!"
                        form_msg_str = "Breathe Deeply"
                        progress_val = 100
                    else:
                        feedback_str = "Keep your arms horizontal"
                        progress_val = 80
                else:
                    feedback_str = "Lunge deeper on your front leg"
                    progress_val = 50
            else:
                feedback_str = "Straighten your back leg"
                progress_val = 20

        # Downward Dog
        elif pt == "downward_dog":
            # Hips folded
            left_hip = self.detector.findAngle(img, 11, 23, 25, lmList, draw=False)
            right_hip = self.detector.findAngle(img, 12, 24, 26, lmList, draw=False)
            hip_angle = (left_hip + right_hip) / 2
            
            # Knees and arms straight
            left_knee = self.detector.findAngle(img, 23, 25, 27, lmList, draw=False)
            right_knee = self.detector.findAngle(img, 24, 26, 28, lmList, draw=False)
            knee_angle = (left_knee + right_knee) / 2
            
            self.angles = {"hip_angle": hip_angle, "knee_angle": knee_angle}

            if knee_angle > 150:
                if hip_angle < 100:
                    is_correct = True
                    feedback_str = "Perfect Downward Dog!"
                    form_msg_str = "Press heels down"
                    progress_val = 100
                else:
                    feedback_str = "Push your hips up higher"
                    progress_val = 60
            else:
                feedback_str = "Straighten your legs"
                progress_val = 30
                
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
                # We need to simulate the time delta since `tracker.hold_time` uses real `time.time()`
                # We will manually calculate hold time based on frames
                tracker._analyze_pose(img, lmList)
                # Note: `_analyze_pose` updates `tracker.progress` and sets `tracker.feedback`
                # If progress == 100, we add a fraction of a second to hold time
                if tracker.progress == 100:
                    tracker.hold_time += (1.0 / 10.0) # Assuming we are processing at ~10 fps
            else:
                tracker.progress = 0
    except Exception as e:
        logger.error(f"Error processing video: {e}")
    finally:
        cap.release()

    return {
        "pose_type": pose_type,
        "hold_time": round(tracker.hold_time, 1),
        "feedback": f"Video analysis complete. You held perfect {pose_type} form for {round(tracker.hold_time, 1)} seconds."
    }
