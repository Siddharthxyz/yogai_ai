"""
Chat & Recipe Routes (Extended)
================================
Original endpoints:
  POST /api/chat            - LLM-based culinary chatbot
  POST /api/recipe          - Generate recipe from ingredient list
  GET  /api/recipes         - Return chat + recipe history
  GET  /api/recipes/status  - Health check

New endpoint (RecipeMaker-AI integration):
  POST /api/upload          - Upload food image → YOLO detects ingredients
                              Returns detected ingredient list.
                              Chain with POST /api/recipe to get a recipe.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List

from services.recipe_service import RecipeService
from services.intent_handler import detect_intent

chat_bp = APIRouter()
recipe_service = RecipeService()


# ─── Request models ───────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str


class ChatbotQuery(BaseModel):
    query: str


class RecipeRequest(BaseModel):
    ingredients: List[str]


# ─── Original endpoints ───────────────────────────────────────────────────────
@chat_bp.post("/chat")
async def handle_chat(msg: ChatMessage):
    """Send a message to the culinary AI chatbot (Standard YogAI)."""
    if not msg.message:
        raise HTTPException(
            status_code=400,
            detail="Request JSON must include a 'message' field."
        )
    intent = detect_intent(msg.message)
    response = recipe_service.respond(msg.message, intent=intent)
    return response


@chat_bp.post("/chatbot")
async def handle_chatbot(msg: ChatbotQuery):
    """Send a message to the culinary AI chatbot (RecipeMaker-AI style)."""
    if not msg.query:
        raise HTTPException(status_code=400, detail="Query missing")
    intent = detect_intent(msg.query)
    # Match the output format of RecipeMaker-AI
    response = recipe_service.respond(msg.query, intent=intent)
    return {
        "title": "Chatbot Response",
        "response": response.get("reply", "")
    }


@chat_bp.post("/recipe")
async def generate_recipe(request: RecipeRequest):
    """Generate a recipe from a list of ingredient names (via Groq LLM)."""
    if not request.ingredients:
        raise HTTPException(status_code=400, detail="No ingredients provided.")
    return recipe_service.generate_recipe(request.ingredients)


@chat_bp.get("/recipes/status")
def recipes_status():
    """Health check for the recipe chatbot backend."""
    return "Recipe chatbot backend running"


@chat_bp.get("/recipes")
def recipes_list():
    """Return full chat and recipe history for this session."""
    return recipe_service.get_history()


# ─── New: YOLO ingredient detection ──────────────────────────────────────────
@chat_bp.post("/upload")
async def upload_image(image: UploadFile = File(...)):
    """
    Upload a food image and get detected ingredients back.

    Uses YOLO (ultralytics YOLOv8) to identify food items in the image.
    The detected ingredient list can then be passed directly to POST /api/recipe.

    Returns:
        - ingredients: list of detected ingredient names
        - detections:  list of {name, confidence} dicts
        - source:      "yolo" | "fallback"
    """
    if not image.filename:
        raise HTTPException(
            status_code=400,
            detail="An image file must be uploaded as form field 'image'."
        )

    contents = await image.read()
    result = recipe_service.detect_ingredients_from_image(contents)
    return result
