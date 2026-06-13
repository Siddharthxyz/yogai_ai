"""
Video Streaming Service
Handles MJPEG streaming from the server's camera
"""

import cv2
import threading
from typing import Optional
import time

class VideoStreamer:
    """Streams video frames as MJPEG"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(VideoStreamer, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.cap = None
        self.current_frame = None
        self.frame_lock = threading.Lock()
        self.streaming = False
        self.stream_thread = None
        self._initialized = True
    
    def start_stream(self, source: int = 0):
        """Start streaming from camera"""
        if self.streaming:
            return
        
        self.cap = cv2.VideoCapture(source)
        if not self.cap.isOpened():
            self.cap = None
            return False
        
        self.streaming = True
        self.stream_thread = threading.Thread(target=self._stream_loop, daemon=True)
        self.stream_thread.start()
        return True
    
    def stop_stream(self):
        """Stop streaming"""
        self.streaming = False
        if self.stream_thread:
            self.stream_thread.join(timeout=2)
        if self.cap:
            self.cap.release()
            self.cap = None
    
    def _stream_loop(self):
        """Continuously capture frames"""
        while self.streaming and self.cap:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            # Resize for performance
            frame = cv2.resize(frame, (640, 480))
            
            with self.frame_lock:
                self.current_frame = frame
            
            time.sleep(0.03)  # ~30 FPS
    
    def get_frame(self):
        """Get current frame as JPEG bytes"""
        with self.frame_lock:
            if self.current_frame is None:
                return None
            ret, buffer = cv2.imencode('.jpg', self.current_frame)
            if ret:
                return buffer.tobytes()
        return None
    
    def get_mjpeg_stream(self):
        """Generator for MJPEG stream"""
        while self.streaming:
            frame_bytes = self.get_frame()
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n'
                       + frame_bytes + b'\r\n')
            time.sleep(0.03)
