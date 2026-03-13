import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import logger
from tasks import periodic_cleanup_task
from routes import router

# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("AI Service starting up...")
    
    # Start background cleanup
    cleanup_task = asyncio.create_task(periodic_cleanup_task())
    
    yield
    
    # Shutdown
    logger.info("AI Service shutting down...")
    cleanup_task.cancel()

# --- FastAPI App ---
app = FastAPI(lifespan=lifespan)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
