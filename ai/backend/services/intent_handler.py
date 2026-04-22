def detect_intent(text: str) -> str:
    lower_text = text.lower()
    if any(word in lower_text for word in
           ["recipe", "cook", "ingredients", "dinner", "lunch", "breakfast", "food", "eat"]):
        return "recipe"
    if any(word in lower_text for word in
           ["pose", "yoga", "stretch", "balance", "flexibility"]):
        return "pose"
    if any(word in lower_text for word in
           ["exercise", "workout", "pushup", "squat", "curl", "deadlift", "rep", "set", "gym", "fitness"]):
        return "exercise"
    return "unknown"
