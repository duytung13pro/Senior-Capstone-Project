import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
SHARED_DATA_DIR = Path("/app/shared_data")
MEDIA_DIR = SHARED_DATA_DIR / "media"
UPLOAD_DIR = SHARED_DATA_DIR / "uploads"
SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60
CHECK_INTERVAL_SECONDS = 24 * 60 * 60  # Run daily

# Ensure directories exist
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- RAG Setup ---
import os
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "course_materials")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
LLM_MODEL = os.getenv("LLM_MODEL", "models/gemini-2.5-flash")
