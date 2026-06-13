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
    import io
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
COCO_FOOD_CLASSES = {
    "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
    "hot dog", "pizza", "donut", "cake", "bottle", "wine glass",
    "cup", "fork", "knife", "spoon", "bowl",
}


class IngredientDetector:
    """
    Detects food ingredients from an image using YOLOv8.
    """

    _model = None

    def __init__(self, model_path: str = "yolov8n.pt", conf_threshold: float = 0.25):
        self.conf_threshold = conf_threshold
        import os
        target_model = os.path.join(os.path.dirname(__file__), "..", model_path)
        if not os.path.exists(target_model):
            target_model = model_path
            
        self.model_path = os.getenv("YOLO_MODEL_PATH", target_model)

    def _get_model(self):
        if IngredientDetector._model is None and HAS_YOLO:
            try:
                IngredientDetector._model = YOLO(self.model_path)
                logger.info("YOLO model loaded: %s", self.model_path)
            except Exception as e:
                logger.error("Failed to load YOLO model: %s", e)
        return IngredientDetector._model

    def detect_from_bytes(self, image_bytes: bytes) -> Dict:
        if not HAS_YOLO:
            return self._fallback_detection()

        model = self._get_model()
        if model is None:
            return self._fallback_detection()

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            results = model.predict(source=image, conf=self.conf_threshold, verbose=False)
            
            ingredient_counts = {}
            detections = []
            
            if len(results) > 0:
                result = results[0]
                for box in result.boxes:
                    label_index = int(box.cls)
                    label_name = model.names[label_index]
                    
                    # Fix for YOLO confusing tomatoes with apples (COCO dataset lacks a tomato class)
                    if label_name == "apple":
                        label_name = "tomato"
                        
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
    def _fallback_detection() -> Dict:
        return {
            "ingredients": [],
            "detections": [],
            "source": "fallback",
            "warning": "YOLO model not available. Install ultralytics and Pillow.",
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
        """
        Smart fallback engine simulating an LLM when GROQ API key is missing.
        Parses the injected context to give personalized responses based on the AI Nutrition Matrix.
        """
        import re
        
        # Extract user message
        user_msg_match = re.search(r"User:\s*(.*)\nAssistant:", query, re.IGNORECASE)
        user_msg = user_msg_match.group(1).strip().lower() if user_msg_match else query.lower()

        # Extract context variables
        name = "there"
        name_match = re.search(r"Name:\s*([^,]+),", query)
        if name_match:
            name = name_match.group(1).strip()
            
        bmi_class = "Normal weight"
        bmi_match = re.search(r"BMI\s+[\d\.]+\s+\(([^)]+)\)", query)
        if bmi_match:
            bmi_class = bmi_match.group(1).strip()
            
        accuracy = 90
        acc_match = re.search(r"(\d+)%\s*yoga accuracy", query)
        if acc_match:
            accuracy = int(acc_match.group(1))

        # 1. Greeting / Conversational / Underspecified prompts
        conversational_words = ["hi", "hello", "hey", "ok", "okay", "start", "help", "", "thanks", "thank you", "thx", "awesome", "great", "cool"]
        if user_msg in conversational_words or user_msg.strip("!?.") in conversational_words:
            return (
                f"Hello {name}! I see you are currently in the **{bmi_class}** category, and your Yoga Accuracy is **{accuracy}%**.\n\n"
                f"Whenever you're ready, list the ingredients you have in your kitchen, or ask for a diet recommendation, and I will generate a custom recipe based on your unique fitness data!"
            )
            
        # 2. Diet / Recommendation intent
        if "diet" in user_msg or "recommend" in user_msg or "macros" in user_msg or "protein" in user_msg:
            # BMI Logic
            if "Underweight" in bmi_class:
                recommendation = "a calorie surplus meal with protein-rich foods and healthy fats to help you build mass."
            elif "Overweight" in bmi_class:
                recommendation = "a calorie deficit meal with high protein, low sugar, and high fiber to support weight management."
            else:
                recommendation = "a balanced nutrition profile with complex carbs and seasonal vegetables to maintain your physique."
            
            # Accuracy Logic
            if accuracy > 90:
                acc_rec = "Since your Yoga Accuracy is high (>90%), I also recommend performance enhancement and muscle recovery foods."
            elif accuracy >= 70:
                acc_rec = "Your Yoga Accuracy is solid (70-90%), so let's focus on balanced energy and hydration foods."
            else:
                acc_rec = "To help improve your Yoga Accuracy (<70%), let's stick to energy-supporting, micronutrient-rich beginner meals."

            return (
                f"Based on your profile ({bmi_class}), I recommend {recommendation} {acc_rec}\n\n"
                f"Tell me what ingredients you have, and I'll generate a custom recipe that fits these exact rules!"
            )
            
        # 3. Ingredient-based Recipe Generation (Catch-all for any food items)
        ingredients_list = user_msg.title()
        
        # Build explanation string
        explanation = ""
        if "Underweight" in bmi_class:
            explanation = "I designed this recipe to be calorie-dense and rich in healthy fats to support healthy weight gain (BMI < 18.5)."
        elif "Overweight" in bmi_class:
            explanation = "I kept this recipe low-sugar and high-fiber to support a calorie deficit for weight management (BMI >= 25)."
        else:
            explanation = "This is a perfectly balanced meal to maintain your healthy weight."
            
        if accuracy > 90:
            explanation += " I also added extra protein for muscle recovery since your yoga accuracy is excellent!"
        elif accuracy >= 70:
            explanation += " I included hydrating elements to keep your energy balanced."
        else:
            explanation += " It is packed with micronutrients to support your energy levels for your next yoga session."
        
        import random
        recipe_types = ["Stir-Fry", "Skillet", "Wrap", "Salad", "Medley", "Plate", "Roast"]
        recipe_type = random.choice(recipe_types)

        return (
            f"Perfect {name}. Here is a personalized recipe using your ingredients:\n\n"
            f"**Custom {ingredients_list} {recipe_type}**\n"
            f"- {ingredients_list}\n"
            "- Complex carbs\n"
            "- Healthy fats & Greens\n\n"
            "**Steps:**\n"
            "1. Prep your ingredients.\n"
            "2. Cook gently to preserve nutrients.\n"
            "3. Serve and enjoy.\n\n"
            f"**Why this recipe?**\n{explanation}"
        )

    # ── Recipe generation ─────────────────────────────────────────────────────
    def generate_recipe(self, ingredients: List[str], user_context: str = "") -> Dict:
        self.detected_ingredients = ingredients
        context_rules = (
            "You are a professional chef and personalized AI wellness assistant for YogAI. "
            "Follow these strict Recommendation Rules based on the user's data:\n"
            "1. Underweight (BMI < 18.5): Recommend calorie surplus meals, protein-rich foods, and healthy fats.\n"
            "2. Overweight (BMI >= 25): Recommend calorie deficit meals, high protein, low sugar, and high fiber.\n"
            "3. Normal BMI: Recommend balanced nutrition (proteins, complex carbs, healthy fats).\n"
            "4. High Yoga Accuracy (>90%): Recommend performance enhancement and muscle recovery meals.\n"
            "5. Medium Accuracy (70-90%): Recommend balanced energy and hydration.\n"
            "6. Low Accuracy (<70%): Recommend energy-supporting and beginner-friendly nutrition.\n"
        )
        if user_context:
            context_rules += f"\nUser Context: {user_context}\n"
            
        prompt = (
            f"{context_rules}\n"
            f"Create a simple recipe using these ingredients:\n"
            f"{', '.join(ingredients)}\n\n"
            f"Provide:\n1. Recipe Name\n2. Key Ingredients (from the list)\n"
            f"3. Simple Steps (max 6)\n4. Cooking Time estimate\n"
            f"CRITICAL INSTRUCTION: Include a short paragraph at the end explaining exactly WHY you are recommending this recipe based on their specific BMI category and Yoga Accuracy."
        )
        result = self.query_groq(prompt)
        
        # Parse result into subsections (RecipeMaker-AI style)
        steps = [line.strip() for line in result.split("\n") if line.strip() and (line[0].isdigit() or line.startswith("-"))]
        
        # Extract the explanation paragraph
        import re
        reasoning = ""
        reasoning_match = re.search(r"(?:Why this recipe\?|CRITICAL INSTRUCTION:?|Here is why|Based on your|Reasoning:)(.*?)$", result, re.IGNORECASE | re.DOTALL)
        if reasoning_match:
            reasoning = reasoning_match.group(1).strip()
            # Clean up the result to not include the reasoning in the main steps if it got caught
            result = result.replace(reasoning_match.group(0), "").strip()
        else:
            # Fallback: just take the last paragraph if it doesn't match steps
            paragraphs = [p.strip() for p in result.split("\n\n") if p.strip()]
            if paragraphs and not paragraphs[-1][0].isdigit():
                reasoning = paragraphs[-1]

        recipe = {
            "id": self.next_id,
            "recipeName": (
                f"Recipe with {', '.join(ingredients[:2])}"
                f"{'...' if len(ingredients) > 2 else ''}"
            ),
            "title": f"Recipe for {', '.join(ingredients)}",
            "ingredients": ", ".join(ingredients),
            "description": result,
            "reasoning": reasoning,
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
    def respond(self, message: str, intent: str = None, user_context: str = "") -> Dict:
        context = (
            "You are a personalized AI wellness and nutrition assistant for YogAI. "
            "Follow these strict Recommendation Rules based on the user's data:\n"
            "1. Underweight (BMI < 18.5): Recommend calorie surplus meals, protein-rich foods, and healthy fats.\n"
            "2. Overweight (BMI >= 25): Recommend calorie deficit meals, high protein, low sugar, and high fiber.\n"
            "3. Normal BMI: Recommend balanced nutrition (proteins, complex carbs, healthy fats).\n"
            "4. High Yoga Accuracy (>90%): Recommend performance enhancement and muscle recovery meals.\n"
            "5. Medium Accuracy (70-90%): Recommend balanced energy and hydration.\n"
            "6. Low Accuracy (<70%): Recommend energy-supporting and beginner-friendly nutrition.\n"
            "CRITICAL INSTRUCTION: You MUST explain exactly WHY you are recommending the recipe based on their specific BMI category and Yoga Accuracy.\n"
        )
        if user_context:
            context += f"User Context: {user_context} "
        if self.detected_ingredients:
            context += f"Available ingredients: {', '.join(self.detected_ingredients)}."

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
