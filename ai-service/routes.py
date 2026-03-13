import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from config import logger, UPLOAD_DIR, MEDIA_DIR
from schemas import TTSRequest, TranslateRequest, QuizRequest, FlashcardRequest, QuizResponse, FlashcardResponse
from document_service import convert_to_pdf
from tts_service import process_tts
from rag_service import rag_service

router = APIRouter()

@router.get("/")
def read_root():
    return {"status": "AI Service Running", "version": "1.0.0"}

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    courseId: str = Form(...)
):
    """
    Uploads a document (PDF, DOCX, PPTX), converts to PDF if needed, 
    saves to shared volume, and ingests into Qdrant.
    """
    try:
        # 1. Save uploaded file
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        input_file_path = UPLOAD_DIR / unique_filename
        
        with open(input_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"File saved to {input_file_path}")

        # 2. Convert to PDF if necessary
        final_pdf_path = input_file_path
        if file_ext.lower() in ['.docx', '.doc', '.pptx', '.ppt']:
            # Output to MEDIA_DIR so it's accessible by frontend
            final_pdf_path = await convert_to_pdf(input_file_path, MEDIA_DIR)
            logger.info(f"Converted to PDF: {final_pdf_path}")
        elif file_ext.lower() == '.pdf':
            # Just copy PDF to MEDIA_DIR
            final_pdf_path = MEDIA_DIR / unique_filename
            shutil.copy(input_file_path, final_pdf_path)

        # 3. Generating public URL (relative to Next.js public/media)
        pdf_filename = final_pdf_path.name
        public_url = f"/media/{pdf_filename}"

        # 4. Ingest into Qdrant using RAG Service
        try:
            await rag_service.ingest_document(str(final_pdf_path), courseId)
            logger.info(f"Ingested document into Qdrant for course {courseId}")
        except Exception as e:
            logger.error(f"Failed to ingest document: {e}")
            # We don't fail the whole request if ingestion fails, just log it
            # Or maybe we should add a warning to the response

        return {
            "status": "success",
            "filename": pdf_filename,
            "url": public_url,
            "message": "Document uploaded and processed successfully"
        }

    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/tts")
async def generate_tts(request: TTSRequest):
    """Generates audio for given text using Edge TTS."""
    try:
        public_url = await process_tts(request.text, request.language)
        return {
            "status": "success",
            "audio_url": public_url,
            "language": request.language
        }
    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/translate")
async def translate_text(request: TranslateRequest):
    """
    RAG-enabled translation/explanation.
    Uses Gemini + Qdrant to explain the text in the context of the course.
    """
    try:
        explanation = await rag_service.explain_text(request.text, request.courseId)
        return {
            "original": request.text,
            "translation": f"Translated '{request.text}' (See explanation)",
            "explanation": explanation
        }
    except Exception as e:
        logger.error(f"Translate failed: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz_endpoint(request: QuizRequest):
    """
    Generates a quiz based on the course content in Qdrant.
    """
    try:
        return await rag_service.generate_quiz(request.topic, request.courseId, request.num_questions)
    except Exception as e:
        logger.error(f"Quiz generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards_endpoint(request: FlashcardRequest):
    """
    Generates flashcards based on the course content in Qdrant.
    """
    try:
        return await rag_service.generate_flashcards(request.topic, request.courseId, request.num_cards)
    except Exception as e:
        logger.error(f"Flashcard generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
