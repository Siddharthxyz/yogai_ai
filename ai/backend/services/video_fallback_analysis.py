import cv2
import numpy as np


def analyze_squat_video_fallback(video_path: str) -> dict:
    """
    Count squat reps from a static-camera side-view video without pose landmarks.
    Uses background differencing and subject top-edge motion as a fallback.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Failed to open uploaded video."}

    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(cv2.resize(frame, (640, 360)))
    cap.release()

    if not frames:
        return {"error": "No readable frames found in the uploaded video."}

    sample_indexes = np.linspace(0, len(frames) - 1, min(20, len(frames)), dtype=int)
    background = np.median(np.stack([frames[i] for i in sample_indexes]), axis=0).astype(np.uint8)
    background_gray = cv2.cvtColor(background, cv2.COLOR_BGR2GRAY)

    top_positions = []
    heights = []
    for frame in frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        diff = cv2.absdiff(gray, background_gray)
        _, mask = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = [c for c in contours if cv2.contourArea(c) > 300]
        if not contours:
            top_positions.append(np.nan)
            heights.append(np.nan)
            continue

        contour = max(contours, key=cv2.contourArea)
        _, y, _, h = cv2.boundingRect(contour)
        top_positions.append(float(y))
        heights.append(float(h))

    top_positions = np.array(top_positions, dtype=float)
    heights = np.array(heights, dtype=float)

    if np.isnan(top_positions).all():
        return {"error": "Could not isolate the athlete in this video."}

    nan_mask = np.isnan(top_positions)
    indexes = np.arange(len(top_positions))
    top_positions[nan_mask] = np.interp(indexes[nan_mask], indexes[~nan_mask], top_positions[~nan_mask])
    heights[np.isnan(heights)] = np.interp(indexes[np.isnan(heights)], indexes[~np.isnan(heights)], heights[~np.isnan(heights)])

    smoothed = np.convolve(top_positions, np.ones(7) / 7, mode="same")
    standing_threshold = np.percentile(smoothed, 15)
    squat_threshold = np.percentile(smoothed, 85)

    state = "standing"
    reps = 0
    for value in smoothed:
        if state == "standing" and value >= squat_threshold:
            state = "lowered"
        elif state == "lowered" and value <= standing_threshold:
            reps += 1
            state = "standing"

    progress = int(np.clip(np.interp(smoothed[-1], (standing_threshold, squat_threshold), (0, 100)), 0, 100))
    duration = round(len(frames) / 30.0, 1)

    return {
        "exercise": "squat",
        "reps": int(reps),
        "progress": progress,
        "feedback": "Up" if state == "lowered" else "Down",
        "form_message": "Fallback squat analysis completed",
        "angles": {
            "top_y_min": round(float(np.min(smoothed)), 1),
            "top_y_max": round(float(np.max(smoothed)), 1),
            "height_min": round(float(np.min(heights)), 1),
            "height_max": round(float(np.max(heights)), 1),
        },
        "duration": duration,
        "is_running": False,
        "analysis_mode": "fallback_motion",
    }
