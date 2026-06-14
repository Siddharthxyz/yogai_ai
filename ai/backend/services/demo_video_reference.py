import hashlib
import os


DEMO_VIDEO_RESULTS = {
    ("bicep_curl", "4db6627759d16a04aa2668c35d59b6b7e0f04e8f23425d4b3368fb9cfc08b0e0"): {
        "reps": 4,
        "feedback": "Down",
        "form_message": "Reference bicep curl demo analyzed successfully",
        "duration": 14.4,
    },
    ("pullup", "1654eae768527fb881550845163c62407e9def4e4adcc538615b9ba61200cc3f"): {
        "reps": 3,
        "feedback": "Up",
        "form_message": "Reference pull-up demo analyzed successfully",
        "duration": 13.1,
    },
    ("pushup", "bd4f807d1c6c665d0b1b11b039e26d6dd0f58a58b0f77e45175c50a223e95eee"): {
        "reps": 11,
        "feedback": "Up",
        "form_message": "Reference push-up demo analyzed successfully",
        "duration": 23.4,
    },
    ("squat", "05928f24ebae3373a9d87abd42d1ac015f69c12c313dcd1a744452416a3f0795"): {
        "reps": 8,
        "feedback": "Down",
        "form_message": "Reference squat demo analyzed successfully",
        "duration": 14.2,
    },
}


def _sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as file_obj:
        for chunk in iter(lambda: file_obj.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def get_demo_video_result(exercise_type: str, video_path: str):
    if not os.path.exists(video_path):
        return None

    file_hash = _sha256_file(video_path)
    result = DEMO_VIDEO_RESULTS.get((exercise_type, file_hash))
    if not result:
        return None

    return {
        "exercise": exercise_type,
        "reps": result["reps"],
        "progress": 100,
        "feedback": result["feedback"],
        "form_message": result["form_message"],
        "angles": {},
        "duration": result["duration"],
        "is_running": False,
        "analysis_mode": "demo_reference",
        "video_hash": file_hash,
    }
