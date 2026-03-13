# AI Service Architecture

## 1. Overview
The AI Service is a core component of the LMS platform, designed to enhance the learning experience through advanced artificial intelligence and document processing capabilities. For the Minimum Viable Product (MVP), this service handles four primary domains:
*   **Retrieval-Augmented Generation (RAG)**: Context-aware querying and content generation based on course materials.
*   **Spaced Repetition System (SRS)**: Intelligent flashcard scheduling to optimize student retention of vocabulary and concepts.
*   **Document Processing**: Automated conversion of various document formats into web-friendly formats for seamless frontend rendering.
*   **Text-to-Speech (TTS)**: High-quality audio generation for language learning (Chinese, Vietnamese, English).

## 2. Tech Stack Choices & Reasoning

*   **Vector DB: Qdrant (Local Docker)**
    *   *Reasoning*: Chosen over Chroma primarily for its superior metadata filtering capabilities (crucial for isolating context by `courseId`) and better long-term scalability. Running it locally via Docker keeps the MVP self-contained and cost-effective.
*   **Document Conversion: LibreOffice via `subprocess`**
    *   *Reasoning*: A free, highly accurate, and robust solution for converting various office documents (Word, PowerPoint, etc.) into PDFs. It runs reliably headlessly within a Docker container without requiring expensive third-party APIs.
*   **Text-to-Speech: `edge-tts`**
    *   *Reasoning*: Provides high-quality, natural-sounding voices completely free of charge. It has excellent out-of-the-box support for our target languages: Chinese, Vietnamese, and English.
*   **Frontend Viewer: `react-pdf`**
    *   *Reasoning*: Unlike basic iframe embeds or canvas-only renderers, `react-pdf` renders native DOM text layers over the PDF canvas. This is critical for language learners, as it allows for easy double-click text selection for instant translation or flashcard creation.
*   **File Storage: Shared Docker Volume (`shared-media`)**
    *   *Reasoning*: For the MVP, a shared Docker volume mounted simultaneously to the FastAPI backend and the Next.js `public` directory provides a dead-simple, zero-latency setup for serving generated PDFs and TTS audio files directly to the client.

## 3. Architecture Components

### FastAPI Endpoints
The AI service exposes a RESTful API built with FastAPI to handle core processing tasks:
*   `POST /upload`: Handles document uploads, triggering the LibreOffice subprocess for conversion to PDF, and stores the result in the shared volume.
*   `POST /tts`: Accepts text and language parameters, generates audio using `edge-tts`, saves the `.mp3` to the shared volume, and returns the file URL.
*   `POST /translate`: Integrates with Gemini and Qdrant (RAG) to provide context-aware translations and explanations of selected text based on course materials.
*   `POST /generate-quiz`: Uses Gemini and Qdrant to automatically generate contextual quiz questions and flashcards from uploaded course documents.

### Background Tasks
*   **Cleanup Routine**: An `asyncio` loop runs within the FastAPI `lifespan` context manager to periodically scan and delete generated files (PDFs, audio) older than 7 days.
    *   *Reasoning*: This is a lightweight, built-in approach that avoids the overhead and complexity of introducing external task queues like Celery or Redis for a simple MVP cleanup job.

### MongoDB Schema
The Spaced Repetition System relies on a `Flashcard` schema designed around the SM-2 algorithm. Key fields include:
*   `interval`: The number of days before the card should be reviewed again.
*   `repetition`: The number of times the card has been successfully recalled in a row.
*   `easeFactor`: A multiplier dictating how quickly the interval grows (starts at 2.5).
*   `nextReviewDate`: The calculated timestamp for the next scheduled review.
*   `audioFilePath`: A reference to the generated TTS audio file stored in the shared volume.

## 4. Security & Scaling Considerations (Future Work)

While the current architecture is optimized for rapid MVP development, several areas will require enhancement as the platform scales:

*   **Public File Access**: Currently, files stored in the `shared-media` Docker volume are mounted directly to the Next.js `public` directory, making them publicly accessible to anyone with the URL. While acceptable for an MVP, future iterations must implement proper access control (e.g., migrating to AWS S3 with pre-signed URLs) to protect proprietary course materials and user data.
*   **Data Retention**: The background cleanup task only deletes physical files from the shared volume to save disk space. The corresponding MongoDB records (like flashcard metadata or document references) are intentionally kept for historical purposes, analytics, and user progress tracking. Future updates may require a data archiving strategy to prevent database bloat.
