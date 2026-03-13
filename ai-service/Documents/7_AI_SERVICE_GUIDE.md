# AI Service Guide: Building Smart Features

## 🎯 One-Sentence Summary

**The AI Service is a separate Python/FastAPI application that provides intelligent features like document conversion, text-to-speech, flashcard generation, and AI-powered quizzes.**

---

## 🤖 What is the AI Service?

The AI Service is a **microservice** - a small, independent application that handles one thing very well: **making learning smarter with AI**.

```
Traditional Monolith          Project Rewood Architecture
┌─────────────────┐           ┌──────────────┐
│  Frontend       │           │  Frontend    │
│  Backend        │           │  Backend     │
│  AI Features    │ ❌        │  Database    │
│  Database       │           └──────────────┘
└─────────────────┘                  ↕️
            ❌                   ┌──────────────┐
  Everything mixed together     │ AI Service   │ ✅
                                │ (Separate)   │
                                └──────────────┘
```

**Benefits of separate AI Service:**
- ✅ Update AI without touching main app
- ✅ Scale AI independently (separate resources)
- ✅ Use Python for AI (better AI/ML ecosystem)
- ✅ Reuse Python libraries easily
- ✅ If AI breaks, main app still works

---

## 🎯 Four Core AI Features

### 1. 📄 Document Processing

**What it does:** Convert office documents into web-friendly PDFs

**Supported formats:**
```
Input:  .docx, .pptx, .xlsx, .odt, .txt, etc.
        (Microsoft Word, PowerPoint, Excel, etc.)

Output: .pdf (web-friendly, searchable)
```

**Technology:** LibreOffice (free, open-source office suite)

**How it works:**
```
1. Teacher uploads Word document
   └─ "Chinese_Lesson_Plan.docx"

2. Frontend sends to AI Service
   └─ POST /upload with file

3. AI Service processes:
   └─ Receives .docx
   └─ Runs LibreOffice conversion
   └─ Converts to PDF
   └─ Saves to shared volume
   └─ Returns file URL

4. Frontend displays:
   └─ Shows PDF viewer
   └─ User can read/download
   └─ Can select text for translation
```

**Why this matters for language learners:**
- PDFs are viewable in web browser
- Can select text → get instant translation
- Can select text → create flashcard
- Professional-looking documents

### 2. 🎙️ Text-to-Speech (TTS)

**What it does:** Convert text to natural-sounding audio

**Supported languages:**
- 🇨🇳 Chinese (Simplified & Traditional)
- 🇻🇳 Vietnamese
- 🇬🇧 English
- And 50+ more...

**Technology:** `edge-tts` (Microsoft's TTS, free)

**How it works:**
```
1. Student learns flashcard "你好 (hello)"
   └─ Wants to hear pronunciation

2. Frontend sends text to AI Service
   └─ POST /tts
   └─ text: "你好"
   └─ language: "Chinese"

3. AI Service processes:
   └─ Receives text
   └─ Generates natural audio using TTS
   └─ Saves .mp3 file to storage
   └─ Returns URL to audio

4. Frontend plays audio:
   └─ User clicks "Listen"
   └─ Hears: "你好" pronounced naturally
   └─ Can replay multiple times
```

**Why this matters:**
- Pronunciation matters in language learning
- Natural pronunciation helps learning
- Free (no licensing fees)
- High quality (sounds like real person)

### 3. 💬 Smart Translation (Context-Aware)

**What it does:** Translate text using course context

**Without context:**
```
Word: "practice"
Translation: "练习" (to exercise/drill)

But in different contexts:
- "Medical practice" → "医疗实践" (profession)
- "Piano practice" → "钢琴练习" (rehearsal)
- Context matters!
```

**With our AI Service (using RAG):**
```
1. Student double-clicks word "practice"
   └─ In context: "Daily practice is important"

2. Frontend asks AI Service:
   └─ POST /translate
   └─ word: "practice"
   └─ context: "Daily practice is important"
   └─ courseId: "course123"

3. AI Service processes:
   └─ Searches course materials for similar usage
   └─ Understands context
   └─ Generates accurate translation
   └─ Provides example sentences

4. Frontend shows:
   └─ Translation: "练习"
   └─ Meaning: "repeated action to improve skill"
   └─ Examples from course: "..."
```

**Technology:**
- **Qdrant:** Vector database (stores embeddings)
- **Gemini:** AI model (understands meaning)
- **RAG:** Retrieval-Augmented Generation (searches + generates)

**What is RAG?**
```
Without RAG (standard ChatGPT):
┌──────────────┐
│ User question│
└──────┬───────┘
       │
    ┌──▼──┐
    │ LLM │ ← Uses training data only
    │     │   Might make up answer
    └─────┘

With RAG (our approach):
┌──────────────┐
│ User question│
└──────┬───────┘
       │
   ┌───▼───┐
   │ Search│ ← Search course materials first
   │Vector │   Find relevant context
   │ DB    │
   └───┬───┘
       │ ← Pass context to LLM
    ┌──▼──┐
    │ LLM │ ← Uses course context
    │     │   Accurate answer
    └─────┘
```

### 4. ❓ Smart Quiz & Flashcard Generation

**What it does:** Automatically create quiz questions and flashcards from course materials

**Without AI:**
```
Teacher workflow:
1. Read course document (2 hours)
2. Manually create questions (3 hours)
3. Create flashcards (2 hours)
Total: 7 hours per course module ❌
```

**With AI Service:**
```
Teacher workflow:
1. Upload course document (2 minutes)
2. AI generates 20 questions + flashcards (30 seconds)
3. Teacher reviews & approves (30 minutes)
Total: 1 hour per course module ✅
```

**How it works:**
```
1. Teacher uploads document to course

2. Frontend calls AI Service:
   └─ POST /generate-quiz
   └─ documentId: "doc123"
   └─ courseId: "course123"
   └─ numberOfQuestions: 20

3. AI Service processes:
   └─ Reads document from storage
   └─ Uses Gemini to extract key concepts
   └─ Generates 20 questions
   └─ Generates 20 flashcards
   └─ Stores in MongoDB
   └─ Returns to frontend

4. Teacher reviews & approves:
   └─ Sees generated questions
   └─ Can edit/delete/approve
   └─ Students see approved quiz

5. Student studies:
   └─ Attempts quiz
   └─ Studies with flashcards
   └─ Uses spaced repetition
```

**Spaced Repetition System (SRS):**

Flashcards are reviewed at optimal intervals:

```
Day 1: Learn "你好"
       confidence: 50%

Day 2: Review "你好"
       confidence: 80% ✅
       → Next review in 3 days

Day 5: Review "你好"
       confidence: 90% ✅
       → Next review in 7 days

Day 12: Review "你好"
        confidence: 95% ✅
        → Next review in 16 days

Day 28: Review "你好"
        confidence: 99% ✅
        → Next review in 42 days

Result: Word is memorized for life! 🎉
```

---

## 🏗️ AI Service Architecture

```
┌─────────────────────────────────────────┐
│    FASTAPI SERVER (main.py)             │
│    (Runs on localhost:8000)             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ POST /upload                      │ │
│  │ Document → LibreOffice → PDF      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ POST /tts                         │ │
│  │ Text → edge-tts → Audio MP3       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ POST /translate                   │ │
│  │ Text + Context → Gemini + Qdrant  │ │
│  │ → Translation + Explanation       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ POST /generate-quiz               │ │
│  │ Document → Gemini →Questions+Cards│ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Background Tasks:                 │ │
│  │ - Cleanup files > 7 days old      │ │
│  │ - Monitor Qdrant health           │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
         ↕️              ↕️              ↕️
    Backend      MongoDB        Qdrant DB
    (queries)  (stores quiz,   (vector
                flashcard      embeddings)
                metadata)
```

---

## 📁 AI Service Folder Structure

```
ai-service/
├── main.py                      # Main FastAPI app
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker configuration
│
├── services/
│   ├── document_processor.py    # LibreOffice integration
│   ├── tts_service.py           # Text-to-speech
│   ├── rag_service.py           # RAG with Qdrant + Gemini
│   └── quiz_generator.py        # Quiz generation
│
├── models/
│   ├── document.py              # Document model
│   ├── flashcard.py             # Flashcard model
│   ├── quiz.py                  # Quiz model
│   └── question.py              # Question model
│
├── schemas/
│   ├── request.py               # Request formats
│   └── response.py              # Response formats
│
├── utils/
│   ├── file_handler.py          # File operations
│   ├── vector_db.py             # Qdrant operations
│   └── cleanup.py               # Background cleanup
│
├── config.py                    # Configuration
└── Documents/                   # This guide!
```

---

## 🔧 Key Technologies Explained

### FastAPI

**What it is:** Modern Python web framework

**Why we chose it:**
- Fast (one of fastest Python frameworks)
- Easy to learn
- Built-in async support
- Auto-generates API documentation
- Type hints for safety

**Example endpoint:**
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class TextRequest(BaseModel):
    text: str
    language: str

@app.post("/tts")
async def text_to_speech(request: TextRequest):
    """
    Convert text to speech
    
    - text: Text to convert
    - language: Language code (e.g., 'zh-CN')
    """
    audio_file = edge_tts.generate(
        text=request.text,
        voice=VOICE_MAPPING[request.language]
    )
    return {"audio_url": audio_file_path}
```

### LibreOffice

**What it is:** Free, open-source office suite

**Why we chose it:**
- Free (no licensing)
- Accurate conversion (preserves formatting)
- Supports many formats
- Works headlessly (no GUI needed)

**How we use it:**
```python
import subprocess

def convert_to_pdf(docx_path):
    """Convert DOCX to PDF"""
    result = subprocess.run([
        "libreoffice",
        "--headless",
        "--convert-to", "pdf",
        "--outdir", "/output",
        docx_path
    ])
    return pdf_path
```

### Qdrant

**What it is:** Vector database

**Why vectors matter:**
```
Traditional search (keyword-based):
Search: "hello"
Results: Only documents with "hello"

Vector search (semantic):
Search: "greeting" → converts to vector
Results: Documents about greetings, salutations, hi, hello, etc.
         Based on meaning, not just keywords!

How it works:
"你好" → vector [0.2, 0.8, -0.3, 0.5, ...] ← 768 numbers
"hello" → vector [0.1, 0.9, -0.2, 0.4, ...] ← 768 numbers
           ↓
        Compare vectors → Similar meaning!
```

**Why we use Qdrant:**
- Better than simple vector similarity search
- Metadata filtering by courseId
- Scalable
- Runs locally in Docker
- Fast similarity search

### Gemini

**What it is:** Google's AI model

**Why we use it:**
- Powerful (understands context)
- Free tier available (MVP)
- Multimodal (text, images)
- Good at generating content
- Supports multiple languages

**Example usage:**
```python
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

response = model.generate_content("""
Generate 5 quiz questions from this text:

TEXT:
"你好 (nǐ hǎo) means hello in Mandarin Chinese.
It's used as a greeting. The tone marks are important
for correct pronunciation."

Format: Each question should be multiple choice with 4 options.
""")

print(response.text)
```

### Edge-TTS

**What it is:** Microsoft's Text-to-Speech API

**Why we use it:**
- Free
- High quality (sounds natural)
- Multiple languages
- No API key needed (uses web)
- Supports SSML (pauses, emphasis)

**Example usage:**
```python
from edge_tts import Communicator

async def generate_speech(text: str, language: str):
    """Generate speech audio"""
    
    # Map language to voice
    voice_map = {
        "Chinese": "zh-CN-XiaoxiaoNeural",
        "Vietnamese": "vi-VN-NhungNeural",
        "English": "en-US-AriaNeural"
    }
    
    tts = Communicator(text, voice_map[language])
    
    # Save to file
    with open("output.mp3", "wb") as f:
        async for data in tts.stream():
            f.write(data["audio"])
    
    return "output.mp3"
```

---

## 🚀 Running the AI Service

### Locally (Development)

```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run
python main.py

# Runs on http://localhost:8000
```

### With Docker (Production)

```bash
# Build
docker build -t ai-service .

# Run
docker run -p 8000:8000 ai-service

# Runs on http://localhost:8000
```

### With Docker Compose (Full Stack)

```bash
docker-compose up --build

# Starts all services:
# - Frontend: localhost:3000
# - Backend: localhost:8008
# - AI Service: localhost:8000
# - MongoDB: localhost:27018
# - Qdrant: localhost:6333
```

---

## 📊 Data Flow Example: Student Studying Flashcards

```
STEP 1: AI SERVICE SETUP
AI Service running on localhost:8000
Qdrant (vector DB) running on localhost:6333
MongoDB connection established

STEP 2: STUDENT VIEWS FLASHCARD
Frontend (localhost:3000):
┌────────────────────────────────┐
│ Flashcard                      │
│ Front: "你好"                  │
│ [Play Audio] [See Answer]      │
│ [Easy] [Hard] [Correct]        │
└────────────────────────────────┘

STEP 3: STUDENT CLICKS [PLAY AUDIO]
Frontend calls AI Service:
POST http://localhost:8000/tts
{
  "text": "你好",
  "language": "Chinese"
}

STEP 4: AI SERVICE GENERATES AUDIO
AI Service:
- Receives request
- Calls edge-tts library
- Generates natural audio
- Saves to shared volume
- Returns URL

Response:
{
  "audio_url": "/media/tts_1234.mp3",
  "duration_seconds": 1.2
}

STEP 5: FRONTEND PLAYS AUDIO
User hears pronunciation: "你好" (nǐ hǎo)

STEP 6: STUDENT REVIEWS FLASHCARD
Student marks: "Easy" (knew it)
Frontend updates MongoDB:
db.flashcards.updateOne(
  { _id: flashcard_id },
  {
    repetition: 5,
    easeFactor: 2.6,
    nextReviewDate: tomorrow + 3 days
  }
)

STEP 7: SPACED REPETITION
Next review suggested in 3 days
System automatically schedules review
```

---

## 🔄 Common AI Service Tasks

### Creating a New Endpoint

```python
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI()

class MyRequest(BaseModel):
    parameter1: str
    parameter2: int

@app.post("/my-endpoint")
async def my_endpoint(request: MyRequest):
    """
    Description of what this endpoint does
    
    Parameters:
    - parameter1: Description
    - parameter2: Description
    """
    # Your code here
    result = process_request(request)
    return {"result": result}
```

### Integrating with Gemini

```python
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

def generate_questions(document_text: str) -> list:
    """Use Gemini to generate quiz questions"""
    
    prompt = f"""
    Generate 5 multiple-choice questions about this content:
    
    {document_text}
    
    Format each question as JSON:
    {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "..."
    }}
    """
    
    response = model.generate_content(prompt)
    
    # Parse and return questions
    return parse_questions(response.text)
```

### Working with Qdrant

```python
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

client = QdrantClient("localhost", port=6333)

def store_course_embeddings(course_id: str, documents: list):
    """Store document embeddings in Qdrant"""
    
    points = []
    for i, doc in enumerate(documents):
        # Generate embedding
        embedding = model.encode(doc.text)
        
        # Create point with metadata
        point = PointStruct(
            id=i,
            vector=embedding,
            payload={
                "course_id": course_id,
                "document_id": doc.id,
                "text": doc.text
            }
        )
        points.append(point)
    
    # Store in Qdrant
    client.upsert(
        collection_name="course_documents",
        points=points
    )

def search_by_context(query: str, course_id: str):
    """Search documents by semantic similarity"""
    
    # Encode query
    query_vector = model.encode(query)
    
    # Search Qdrant
    results = client.search(
        collection_name="course_documents",
        query_vector=query_vector,
        query_filter={
            "must": [
                {"key": "course_id", "match": {"value": course_id}}
            ]
        },
        limit=5
    )
    
    return results
```

---

## 🚨 Common Issues & Solutions

### Issue: "ModuleNotFoundError: No module named 'X'"

```bash
# Solution: Install missing dependency
pip install [module-name]

# Or install from requirements.txt
pip install -r requirements.txt
```

### Issue: "Connection refused to localhost:6333"

```bash
# Solution: Start Qdrant
# Make sure Qdrant is running:
docker run -p 6333:6333 qdrant/qdrant

# Or in docker-compose:
docker-compose up qdrant
```

### Issue: "API key invalid for Gemini"

```python
# Solution: Set correct API key
import os
os.environ['GEMINI_API_KEY'] = 'your-actual-key'

# Or in .env file
GEMINI_API_KEY=your-actual-key

# Load from environment
import google.generativeai as genai
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
```

---

## 📈 Performance Optimization

### Caching Results

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_flashcards(student_id: str):
    """Cache flashcard results"""
    return db.flashcards.find({"studentId": student_id})

# Clear cache when data updates
get_flashcards.cache_clear()
```

### Async Operations

```python
import asyncio
from fastapi import BackgroundTasks

@app.post("/generate-quiz")
async def generate_quiz(document_id: str, background_tasks: BackgroundTasks):
    """Generate quiz in background"""
    
    # Return immediately
    background_tasks.add_task(quiz_generation_job, document_id)
    
    return {"status": "processing"}

async def quiz_generation_job(document_id: str):
    """Run in background"""
    questions = await generate_questions_async(document_id)
    await save_to_database(questions)
```

---

## ✅ What You've Learned

You now understand:
- ✅ What the AI Service is and why it exists
- ✅ Four core features (document processing, TTS, translation, quiz generation)
- ✅ How each feature works
- ✅ Technologies used (FastAPI, LibreOffice, Qdrant, Gemini, edge-tts)
- ✅ Service architecture
- ✅ How to run locally and with Docker
- ✅ How to create new endpoints
- ✅ Integration patterns
- ✅ Common issues and solutions

---

## 🎯 Next Step

Ready to see how all parts communicate together?

**[→ Read Document 8: Communication Flow](8_COMMUNICATION_FLOW.md)**

Or go back to **[Welcome Guide](1_WELCOME_START_HERE.md)**
