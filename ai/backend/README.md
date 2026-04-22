# Unified FastAPI Backend

This backend combines pose detection (from Exercise-Counter) and recipe generation (from RecipeMaker-AI) into one unified FastAPI application.

## Project structure

```
backend/
├── app.py                      # FastAPI application entrypoint
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── services/
    ├── __init__.py
    ├── pose_module.py         # PoseDetectorModified (from Exercise-Counter)
    ├── recipe_service.py      # Recipe generation with GROQ API (from RecipeMaker-AI)
    ├── intent_handler.py      # Simple intent detection
    └── pose_detector.py       # Deprecated - use pose_module.py
└── routes/
    ├── __init__.py
    ├── chat.py                # Chat and recipe routes
    └── pose.py                # Pose detection routes
```

## Key Features

### Pose Detection
- **Module**: `services/pose_module.py` (PoseDetectorModified from Exercise-Counter)
- **Methods**:
  - `findPose(img, draw=True)` - Detect poses in images
  - `findPosition(img, draw=True)` - Get landmark positions
  - `findAngle(img, p1, p2, p3, landmarks_list, draw=True)` - Calculate angles between landmarks

### Recipe Generation
- **Module**: `services/recipe_service.py` (Integrated from RecipeMaker-AI)
- **Uses GROQ API** for LLM-powered recipe generation
- **Features**:
  - Natural language recipe queries
  - Ingredient-based recipe generation
  - Fallback recipes when API unavailable
  - Chat context awareness

## API Routes

### Health Check
- `GET /api/status` — Backend status

### Chat & Recipes
- `POST /api/chat` — Chat with recipe assistant
  - Body: `{ "message": "I want a vegetarian dinner" }`
- `POST /api/recipe` — Generate recipe from ingredients
  - Body: `{ "ingredients": ["tomato", "basil", "mozzarella"] }`
- `GET /api/recipes/status` — Recipe service health
- `GET /api/recipes` — Get recipe history

### Pose Detection
- `POST /api/detect` — Upload image for pose detection
  - Form-data field: `image` (image file)
- `GET /api/yoga/status` — Pose service health
- `GET /api/yoga` — Get yoga sessions (returns `[]`)

## Setup & Installation

### 1. Copy `.env.example` to `.env` and add your GROQ API key

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY from https://console.groq.com/keys
```

### 2. Create virtual environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Start the backend

```powershell
python app.py
```

Server runs on: `http://localhost:5000`

## Frontend Integration

### Update frontend API client

Update `frontend/src/services/recipeService.js` and `yogaService.js`:

```js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default api;
```

### Example API Calls

**Chat with recipe bot**:
```js
const response = await axios.post("http://localhost:5000/api/chat", {
  message: "What can I make with chicken and rice?"
});
console.log(response.data.reply);
```

**Generate recipe**:
```js
const result = await axios.post("http://localhost:5000/api/recipe", {
  ingredients: ["tomato", "basil", "mozzarella", "pasta"]
});
console.log(result.data.description);
```

**Upload image for pose detection**:
```js
const formData = new FormData();
formData.append("image", imageFile);

const poseResult = await axios.post("http://localhost:5000/api/detect", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
console.log(poseResult.data.accuracy);
console.log(poseResult.data.landmarks);
```

## Dependencies

- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **OpenCV** - Image processing
- **MediaPipe** - Pose detection (from Exercise-Counter)
- **Requests** - HTTP client for GROQ API
- **Pydantic** - Data validation
- **python-dotenv** - Environment variables

## Integration Sources

- **Pose Detection**: Integrated from [Exercise-Counter-main](C:\Users\godls\Desktop\Exercise-Counter-main)
  - PoseModule.py → PoseDetectorModified class
  
- **Recipe Generation**: Integrated from [RecipeMaker-AI-main](C:\Users\godls\Desktop\RecipeMaker-AI-main)
  - GROQ API integration for recipe generation
  - LLM-powered chatbot context awareness

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
FLASK_ENV=development
DEBUG=True
```

**Note**: If `GROQ_API_KEY` is not set, the backend will use **fallback recipes** instead of LLM generation.

## Running with Java Backends (Legacy)

If you still want to run the Java microservices (auth-backend, yoga-backend, recipe-backend), use:

```powershell
./start-all.bat
```

This starts:
- Auth Backend (8081)
- Yoga Backend (8082)
- Recipe Backend (8083)
- Frontend (3000)
- **New**: Python AI Backend (5000) ← Replace separate services

## Development Notes

- **Pose detection** uses MediaPipe's Pose model for real-time landmark detection
- **Recipe generation** uses GROQ's API with Llama 3.1 for natural language understanding
- **Intent detection** is a simple keyword-based system in `intent_handler.py`
- All routes support CORS for frontend integration

