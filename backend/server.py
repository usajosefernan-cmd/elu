from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Setup paths and env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# DB Setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'luxscaler_db')]

# FastAPI App
app = FastAPI(title="LuxScaler v27 API")

# Router Setup
api_router = APIRouter(prefix="/api")

from routes import auth, pillars, process, admin, presets, slider_definitions

api_router.include_router(auth.router)
api_router.include_router(pillars.router)
api_router.include_router(process.router)
api_router.include_router(admin.router) # Map /api/admin-actions
api_router.include_router(presets.router) # Map /api/presets
api_router.include_router(slider_definitions.router) # Map /api/slider-definitions

@api_router.get("/")
async def root():
    return {"message": "LuxScaler v27 API Running"}

app.include_router(api_router)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"], # Allow all for dev
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
