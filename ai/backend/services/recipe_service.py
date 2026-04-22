"""
Recipe Service (Extended)
=========================
Original: Groq LLM-based recipe generation + chat.
Added   : IngredientDetector — YOLO-based food ingredient detection from images.

The IngredientDetector uses ultralytics YOLOv8 trained on a food dataset.
Falls back gracefully if ultralytics is not installed.
"""

from typing import Dict, List
import os
import io
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── YOLO setup (optional — graceful fallback if not installed) ───────────────
try:
    from ultralytics import YOLO
    from PIL import Image
    import numpy as np
    HAS_YOLO = True
    logger.info("ultralytics YOLO available — ingredient detection enabled.")
except ImportError:
    HAS_YOLO = False
    logger.warning(
        "ultralytics / Pillow not installed. "
        "Ingredient detection will use keyword fallback. "
        "Run: pip install ultralytics Pillow"
    )

# ─── Food/ingredient class names present in COCO-trained YOLOv8 ──────────────
# These are the food-related classes from COCO-80 that YOLO can detect.
COCO_FOOD_CLASSES = {
    "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
    "hot dog", "pizza", "donut", "cake", "bottle", "wine glass",
    "cup", "fork", "knife", "spoon", "bowl",
}


class IngredientDetector:
    """
    Detects food ingredients from an image using YOLOv8.
    Uses the general COCO-trained yolov8n.pt model.
    For better food coverage, replace with a fine-tuned food model.
    """

    _model = None  # shared singleton

    def __init__(self, model_path: str = "yolo_fruits_and_vegetables_v8x.pt", conf_threshold: float = 0.25):
        self.conf_threshold = conf_threshold
        # Check if the specific model exists in the backend directory
        target_model = os.path.join(os.path.dirname(__file__), "..", model_path)
        if not os.path.exists(target_model):
            target_model = model_path # fallback to just the name for ultralytics auto-download if applicable
            
        self.model_path = os.getenv("YOLO_MODEL_PATH", target_model)

    def _get_model(self):
        """Lazy-load the YOLO model."""
        if IngredientDetector._model is None and HAS_YOLO:
            try:
                IngredientDetector._model = YOLO(self.model_path)
                logger.info("YOLO model loaded: %s", self.model_path)
            except Exception as e:
                logger.error("Failed to load YOLO model: %s", e)
        return IngredientDetector._model

    def detect_from_bytes(self, image_bytes: bytes) -> Dict:
        """
        Run YOLO inference on raw image bytes.
        Returns detected ingredient names + counts (matching RecipeMaker-AI style).
        """
        if not HAS_YOLO:
            return self._fallback_detection()

        model = self._get_model()
        if model is None:
            return self._fallback_detection()

        try:
            # RecipeMaker-AI style: Save to temp then predict (or use predict directly on bytes if supported)
            # For robustness, we'll use PIL Image then predict
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # Use model.predict as in RecipeMaker-AI
            results = model.predict(source=image, conf=self.conf_threshold, verbose=False)
            
            ingredient_counts = {}
            detections = []
            
            # The results object contains boxes
            if len(results) > 0:
                result = results[0]
                for box in result.boxes:
                    label_index = int(box.cls)
                    label_name = model.names[label_index]
                    confidence = round(float(box.conf), 2)
                    
                    ingredient_counts[label_name] = ingredient_counts.get(label_name, 0) + 1
                    detections.append({"name": label_name, "confidence": confidence})

            ingredients = list(ingredient_counts.keys())
            logger.info("YOLO detected ingredients: %s", ingredients)

            return {
                "ingredients": ingredients,
                "counts": ingredient_counts,
                "detections": detections,
                "source": "yolo",
            }

        except Exception as e:
            logger.error("YOLO inference error: %s", e)
            return self._fallback_detection()

    @staticmethod
    def _is_likely_food(class_name: str) -> bool:
        food_keywords = ["fruit", "vegetable", "meat", "fish", "bread", "egg",
                         "cheese", "milk", "tomato", "potato", "onion", "garlic"]
        return any(kw in class_name for kw in food_keywords)

    @staticmethod
    def _fallback_detection() -> Dict:
        return {
            "ingredients": [],
            "detections": [],
            "source": "fallback",
            "warning": (
                "YOLO model not available. "
                "Install ultralytics and Pillow, or provide a custom YOLO_MODEL_PATH."
            ),
        }


# ─── Recipe Service ───────────────────────────────────────────────────────────
class RecipeService:
    """
    Recipe generation service using GROQ API.
    Extended with YOLO-based ingredient detection.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.history = []
        self.next_id = 1
        self.detected_ingredients = []
        self.ingredient_detector = IngredientDetector()

    # ── YOLO ingredient detection ─────────────────────────────────────────────
    def detect_ingredients_from_image(self, image_bytes: bytes) -> Dict:
        """
        Run YOLO on an uploaded image and return detected ingredient names.
        Stores results so /api/recipe can immediately use them.
        """
        result = self.ingredient_detector.detect_from_bytes(image_bytes)
        self.detected_ingredients = result.get("ingredients", [])
        return result

    # ── Groq LLM query ────────────────────────────────────────────────────────
    def query_groq(self, prompt: str) -> str:
        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY not set. Using fallback recipes.")
            return self._fallback_recipe(prompt)

        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 500,
        }
        try:
            response = requests.post(
                self.groq_url, json=payload, headers=headers, timeout=30
            )
            response_json = response.json()
            if response.status_code == 200 and "choices" in response_json:
                return response_json["choices"][0]["message"]["content"]
            return f"Error: {response_json.get('error', 'Unexpected response')}"
        except Exception as e:
            logger.error("Error calling Groq API: %s", e)
            return self._fallback_recipe(prompt)

    def _fallback_recipe(self, query: str) -> str:
        lower = query.lower()
        if "vegetarian" in lower or "veggie" in lower:
            return (
                "Vegetable Stir-Fry\n- 2 cups mixed vegetables\n- 2 tbsp soy sauce\n"
                "- Rice\n\nSteps:\n1. Heat oil\n2. Add vegetables\n"
                "3. Stir-fry 5 mins\n4. Add soy sauce\n5. Serve with rice"
            )
        elif "chicken" in lower:
            return (
                "Grilled Chicken\n- Chicken breast\n- Salt, pepper\n- Lemon juice\n\n"
                "Steps:\n1. Season chicken\n2. Grill 15 mins per side\n"
                "3. Rest 5 mins\n4. Serve with lemon"
            )
        elif "pasta" in lower:
            return (
                "Simple Pasta\n- Pasta\n- Tomato sauce\n- Garlic\n\n"
                "Steps:\n1. Boil pasta\n2. Heat tomato sauce\n"
                "3. Combine\n4. Top with garlic"
            )
        return "Create a balanced meal using:\nProtein, Vegetables, Carbs, Healthy Fat.\nSeason to taste!"

    # ── Recipe generation ─────────────────────────────────────────────────────
    def generate_recipe(self, ingredients: List[str]) -> Dict:
        self.detected_ingredients = ingredients
        prompt = (
            f"You are a professional chef. Create a simple recipe using these ingredients:\n"
            f"{', '.join(ingredients)}\n\n"
            f"Provide:\n1. Recipe Name\n2. Key Ingredients (from the list)\n"
            f"3. Simple Steps (max 6)\n4. Cooking Time estimate\n"
        )
        result = self.query_groq(prompt)
        
        # Parse result into subsections (RecipeMaker-AI style)
        steps = [line.strip() for line in result.split("\n") if line.strip() and (line[0].isdigit() or line.startswith("-"))]
        
        recipe = {
            "id": self.next_id,
            "recipeName": (
                f"Recipe with {', '.join(ingredients[:2])}"
                f"{'...' if len(ingredients) > 2 else ''}"
            ),
            "title": f"Recipe for {', '.join(ingredients)}",
            "ingredients": ", ".join(ingredients),
            "description": result,
            "subsections": [
                {
                    "heading": "Ingredients",
                    "items": ingredients
                },
                {
                    "heading": "Instructions",
                    "steps": steps if steps else [result]
                }
            ],
            "userMessage": f"Generate recipe with: {', '.join(ingredients)}",
            "intent": "recipe",
        }
        self.next_id += 1
        self.history.append(recipe)
        return recipe

    # ── Chat respond ──────────────────────────────────────────────────────────
    def respond(self, message: str, intent: str = None) -> Dict:
        context = (
            "User is asking about recipes."
            if intent == "recipe"
            else "You are a helpful culinary assistant."
        )
        if self.detected_ingredients:
            context += f" Available ingredients: {', '.join(self.detected_ingredients)}."

        prompt = f"{context}\nUser: {message}\nAssistant:"
        response = self.query_groq(prompt)

        entry = {
            "id": self.next_id,
            "userMessage": message,
            "botReply": response,
            "intent": intent or "unknown",
        }
        self.next_id += 1
        self.history.append(entry)
        return {"reply": response, "intent": intent, "history": self.history}

    def get_history(self) -> List[Dict]:
        return self.history
