# Communication Flow: How Everything Works Together

## 🎯 One-Sentence Summary

**This document shows exactly how the frontend, backend, database, and AI service communicate to deliver features to users.**

---

## 🏗️ The Complete System

```
┌──────────────────────────────────────────────────────────────┐
│                    USER (Web Browser)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FRONTEND (Next.js + React)                             │ │
│  │ - Shows pages, buttons, forms                          │ │
│  │ - Runs JavaScript in browser                           │ │
│  │ - Makes HTTP requests to backend                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕️ HTTP                            │
└──────────────────────────────────────────────────────────────┘
                          ↕️
                   Network (Internet)
                          ↕️
┌──────────────────────────────────────────────────────────────┐
│              BACKEND SERVICES (Servers)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ SPRING BOOT BACKEND (Java)                             │ │
│  │ - Process requests from frontend                       │ │
│  │ - Business logic & validation                          │ │
│  │ - Talk to database                                     │ │
│  │ - Send responses back                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕️ Queries                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FASTAPI AI SERVICE (Python)                            │ │
│  │ - Generate TTS audio                                   │ │
│  │ - Convert documents to PDF                             │ │
│  │ - Create quizzes with Gemini                           │ │
│  │ - Smart translations with RAG                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕️ Queries                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DATA LAYER                                             │ │
│  │                                                        │ │
│  │  ┌─────────────────────────┐                          │ │
│  │  │ MONGODB                 │                          │ │
│  │  │ - Users, courses, grades│                          │ │
│  │  │ - Messages, submissions │                          │ │
│  │  │ - Flashcards, analytics │                          │ │
│  │  └─────────────────────────┘                          │ │
│  │                                                        │ │
│  │  ┌─────────────────────────┐                          │ │
│  │  │ QDRANT (Vector DB)      │                          │ │
│  │  │ - Course embeddings     │                          │ │
│  │  │ - Semantic search       │                          │ │
│  │  └─────────────────────────┘                          │ │
│  │                                                        │ │
│  │  ┌─────────────────────────┐                          │ │
│  │  │ DOCKER VOLUME           │                          │ │
│  │  │ - PDF files             │                          │ │
│  │  │ - Audio files           │                          │ │
│  │  │ - Generated images      │                          │ │
│  │  └─────────────────────────┘                          │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 📡 How Frontend Talks to Backend

### Server Actions (Preferred)

**What they are:** Frontend functions that run on the server

```
Frontend (Browser)              Backend (Server)
─────────────────────────────────────────────────

1. User fills form
   Click "Submit"
        │
        ├─ Server Action called
        │  (Runs on backend!)
        │
        ├─ Direct DB access
        │  (No HTTP needed)
        │
        └─ Return result
           (React state updates)


Frontend code:
───────────────────────────────
"use server"  ← This function runs on server!

export async function getCourses(teacherId) {
  // Direct MongoDB access
  const courses = await Course.find({ teacherId });
  return courses;
}

─────────────────────────────────────────────────

Usage:
───────────────────────────────
export default async function Dashboard() {
  const courses = await getCourses("teacher123");
  
  return (
    <div>
      {courses.map(course => (
        <div key={course._id}>{course.title}</div>
      ))}
    </div>
  );
}
```

**Benefits:**
- ✅ No HTTP overhead
- ✅ Secrets stay on server
- ✅ Direct database access
- ✅ Faster than fetch

### REST API / Fetch (Traditional)

**What it is:** Making HTTP requests to backend endpoints

```
Frontend (Browser)              Backend (Java/Spring)
─────────────────────────────────────────────────

1. User interaction
        │
        ├─ fetch() call
        │
   HTTP POST /api/courses
        │
        ├─ Controller receives
        ├─ Validates
        ├─ Queries database
        │
        └─ HTTP Response
           { courses: [...] }

Frontend code:
───────────────────────────────
async function getCourses(teacherId) {
  const response = await fetch(
    `http://localhost:8080/api/courses?teacherId=${teacherId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  
  return response.json();
}

React component:
───────────────────────────────
export default function CourseList() {
  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    getCourses("teacher123")
      .then(data => setCourses(data))
      .catch(err => console.error(err));
  }, []);
  
  return (
    <div>
      {courses.map(course => (
        <div>{course.title}</div>
      ))}
    </div>
  );
}
```

**Benefits:**
- ✅ Works from any frontend (not just Next.js)
- ✅ Follows REST standards
- ✅ Easy to test with Postman
- ✅ Backend language independent

---

## 💾 Database Communication

### Backend → MongoDB (Query)

```
Spring Boot Backend wants to find all courses
───────────────────────────────────────────────

Java Code:
──────────
@Service
public class CourseService {
  
  @Autowired
  private CourseRepository courseRepository;
  
  public List<Course> getAllCourses() {
    // This sends a query to MongoDB
    return courseRepository.findAll();
  }
}

What Actually Happens:
──────────────────────
courseRepository.findAll()
        ↓
   Sends to MongoDB:
   db.courses.find({})
        ↓
   MongoDB searches collections
   MongoDB returns all course documents
        ↓
   Java receives as List<Course>
        ↓
   Convert to JSON
        ↓
   Send to frontend as HTTP response
```

### AI Service → MongoDB (Store Flashcards)

```
AI Service generates flashcards
────────────────────────────────

Python Code:
────────────
questions = gemini.generate_questions(document_text)

for question in questions:
    flashcard = {
        "studentId": student_id,
        "courseId": course_id,
        "front": question.question,
        "back": question.answer,
        "easeFactor": 2.5,
        "nextReviewDate": tomorrow
    }
    
    # Save to MongoDB
    db.flashcards.insert_one(flashcard)

What Happens:
─────────────
Python connects to MongoDB
        ↓
   Insert documents into flashcards collection
        ↓
   MongoDB returns confirmation
        ↓
   Python returns success to frontend
```

---

## 🎤 AI Service Communication

### Example 1: Teacher Converts Document to PDF

```
STEP 1: TEACHER UPLOADS DOCUMENT
────────────────────────────────

Frontend (Browser):
┌────────────────────────────────┐
│ <input type="file">            │
│ Drag & drop: lesson.docx       │
│ Click "Upload"                 │
└────────────────────────────────┘

File: lesson.docx (500 KB)

STEP 2: FRONTEND SENDS TO BACKEND
──────────────────────────────────

HTTP POST /api/upload
Content-Type: multipart/form-data

[File binary data of lesson.docx]


STEP 3: BACKEND RECEIVES & STORES
──────────────────────────────────

Java Controller:
@PostMapping("/upload")
public ResponseEntity<?> uploadFile(
    @RequestParam("file") MultipartFile file) {
  
  // 1. Save file temporarily
  String tempPath = "/tmp/" + file.getOriginalFilename();
  file.transferTo(tempPath);
  
  // 2. Call AI service
  String pdfUrl = aiService.convertToPdf(tempPath);
  
  // 3. Save reference in MongoDB
  Document doc = new Document();
  doc.setOriginalPath(tempPath);
  doc.setPdfPath(pdfUrl);
  documentRepository.save(doc);
  
  // 4. Return response
  return ResponseEntity.ok({
    "pdfUrl": pdfUrl,
    "documentId": doc.getId()
  });
}


STEP 4: BACKEND CALLS AI SERVICE
──────────────────────────────────

HTTP POST http://localhost:8000/upload

{
  "file": [binary data],
  "courseId": "course123"
}


STEP 5: AI SERVICE PROCESSES
──────────────────────────────

Python FastAPI:
@app.post("/upload")
async def upload_file(file: UploadFile):
  
  # 1. Save to shared volume
  file_path = f"/shared-media/{file.filename}"
  with open(file_path, 'wb') as f:
    content = await file.read()
    f.write(content)
  
  # 2. Convert with LibreOffice
  pdf_path = subprocess.run([
    "libreoffice",
    "--headless",
    "--convert-to", "pdf",
    file_path
  ])
  
  # 3. Delete original, keep PDF
  os.remove(file_path)
  
  # 4. Return URL
  return {
    "pdf_url": f"http://localhost:3000/media/{pdf_name}.pdf",
    "status": "success"
  }


STEP 6: BACKEND RECEIVES FROM AI SERVICE
──────────────────────────────────────────

Response from AI Service:
{
  "pdf_url": "http://localhost:3000/media/lesson.pdf",
  "status": "success"
}

Backend stores:
document.pdfPath = "http://localhost:3000/media/lesson.pdf"
Save to MongoDB


STEP 7: BACKEND SENDS TO FRONTEND
──────────────────────────────────

HTTP Response (200 OK):
{
  "success": true,
  "pdfUrl": "http://localhost:3000/media/lesson.pdf",
  "message": "PDF ready"
}


STEP 8: FRONTEND DISPLAYS PDF
──────────────────────────────

User sees:
┌──────────────────────────────────┐
│ PDF Viewer                       │
│                                  │
│ [Page 1 of 5]   [Zoom] [Download]
│                                  │
│ Document content displayed...   │
└──────────────────────────────────┘

Clicking text → Suggest flashcard creation
Double-click word → Get translation
```

### Example 2: Student Uses Text-to-Speech

```
STEP 1: STUDENT VIEWS FLASHCARD
────────────────────────────────

Frontend shows:
┌─────────────────────────────────┐
│ Flashcard                       │
│ Chinese: 你好                   │
│ [🔊 Listen] [Show Answer]       │
└─────────────────────────────────┘

STEP 2: STUDENT CLICKS LISTEN
──────────────────────────────

HTTP POST http://localhost:8000/tts

{
  "text": "你好",
  "language": "Chinese",
  "flashcardId": "fc_123"
}


STEP 3: AI SERVICE GENERATES AUDIO
───────────────────────────────────

Python FastAPI:
@app.post("/tts")
async def text_to_speech(request: TTSRequest):
  
  # 1. Call edge-tts
  audio = await edge_tts.Communicator(
    text=request.text,
    voice="zh-CN-XiaoxiaoNeural"
  ).stream()
  
  # 2. Save to shared volume
  audio_path = f"/shared-media/tts_{request.flashcardId}.mp3"
  with open(audio_path, 'wb') as f:
    f.write(audio)
  
  # 3. Return URL
  return {
    "audio_url": f"http://localhost:3000/media/tts_{request.flashcardId}.mp3",
    "duration": 1.2
  }


STEP 4: FRONTEND PLAYS AUDIO
──────────────────────────────

JavaScript:
const audio = new Audio(audioUrl);
audio.play();

User hears: "你好" (pronounced naturally)
```

### Example 3: AI Generates Quiz from Document

```
STEP 1: TEACHER UPLOADS DOCUMENT & REQUESTS QUIZ
─────────────────────────────────────────────────

Frontend form:
┌────────────────────────────────────┐
│ Document: chapter5.pdf (selected)  │
│ Number of questions: 20            │
│ Question type: Multiple Choice     │
│ [Generate Quiz]                    │
└────────────────────────────────────┘

HTTP POST /api/courses/course123/generate-quiz

{
  "documentId": "doc456",
  "numberOfQuestions": 20,
  "questionType": "multiple_choice"
}


STEP 2: BACKEND CALLS AI SERVICE
─────────────────────────────────

Java Backend:
public ResponseEntity<?> generateQuiz(String documentId) {
  
  // 1. Get document from MongoDB
  Document doc = documentRepository.findById(documentId);
  String documentText = readPdf(doc.getPdfPath());
  
  // 2. Call AI Service
  QuizResponse quiz = aiService.generateQuiz(
    documentText,
    numberOfQuestions
  );
  
  // 3. Store in MongoDB
  for (Question q : quiz.getQuestions()) {
    questionRepository.save(q);
  }
  
  return ResponseEntity.ok(quiz);
}


STEP 3: AI SERVICE USES GEMINI
───────────────────────────────

Python FastAPI:
@app.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
  
  # Read document
  document_text = read_from_storage(request.documentId)
  
  # Call Gemini with prompt
  prompt = f"""
  Generate {request.numberOfQuestions} multiple-choice questions
  about this text:
  
  {document_text}
  
  Format: JSON with fields: question, options, correct_answer
  """
  
  response = genai.generate_content(prompt)
  
  # Parse and validate
  questions = parse_json(response.text)
  
  # Store in MongoDB
  for q in questions:
    db.questions.insert_one({
      "courseId": request.courseId,
      "documentId": request.documentId,
      "question": q.question,
      "options": q.options,
      "correctAnswer": q.correct_answer,
      "createdAt": datetime.now()
    })
  
  return {
    "success": true,
    "questionsGenerated": len(questions),
    "quiz": questions
  }


STEP 4: BACKEND RETURNS TO FRONTEND
────────────────────────────────────

HTTP Response:
{
  "success": true,
  "questionsCount": 20,
  "quizData": [
    {
      "id": "q1",
      "question": "What does 你好 mean?",
      "options": ["Hello", "Goodbye", "Thank you", "Sorry"],
      "correctAnswer": "Hello"
    },
    ...
  ]
}


STEP 5: FRONTEND DISPLAYS QUIZ
───────────────────────────────

User sees:
┌───────────────────────────────────────┐
│ Quiz: Chapter 5 Vocabulary            │
│ Questions: 20                         │
│                                       │
│ 1. What does 你好 mean?              │
│    ○ Hello                            │
│    ○ Goodbye                          │
│    ○ Thank you                        │
│    ○ Sorry                            │
│                                       │
│ [Previous] [Next] [Submit]            │
└───────────────────────────────────────┘

User takes quiz → Answers submitted → Grades calculated
```

---

## 🔄 Complete Student Learning Flow

```
┌─────────────────────────────────────────────────────────────┐
│ START: STUDENT LOGS IN                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 1: LOGIN                        │
        │ ┌────────────────────────────────┐   │
        │ │ Email: student@example.com     │   │
        │ │ Password: ****                 │   │
        │ │ [Login]                        │   │
        │ └────────────────────────────────┘   │
        │                                      │
        │ Flow:                                │
        │ 1. Frontend POST /api/login          │
        │ 2. Backend validates in MongoDB      │
        │ 3. Returns { id, role, email }      │
        │ 4. Frontend stores role              │
        │ 5. Middleware redirects to /student │
        │ 6. Student dashboard loads           │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 2: VIEW ENROLLED COURSES        │
        │                                      │
        │ Flow:                                │
        │ 1. Frontend calls Server Action      │
        │ 2. Gets enrollments from MongoDB     │
        │ 3. Loads course details              │
        │ 4. Displays course list              │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 3: OPEN COURSE                  │
        │ (e.g., Chinese 101)                  │
        │                                      │
        │ Flow:                                │
        │ 1. Get course modules from DB        │
        │ 2. Check student progress            │
        │ 3. Show resources available          │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 4: VIEW LEARNING MATERIAL       │
        │ (e.g., Chapter 5 PDF)                │
        │                                      │
        │ Flow:                                │
        │ 1. Frontend GET /media/chapter5.pdf │
        │    (from Docker shared volume)      │
        │ 2. PDF viewer loads                 │
        │ 3. Student reads content            │
        │                                      │
        │ Optional: Double-click word          │
        │ "你好" → Get translation            │
        │ 1. Frontend POST /translate         │
        │ 2. AI Service searches Qdrant       │
        │ 3. Gemini generates translation     │
        │ 4. Shows meaning + examples         │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 5: CREATE FLASHCARD             │
        │ (Select "你好" text)                │
        │                                      │
        │ Flow:                                │
        │ 1. Frontend POST /create-flashcard  │
        │ 2. Backend creates in MongoDB        │
        │ 3. AI Service generates TTS audio   │
        │ 4. Stores audio URL in MongoDB      │
        │ 5. Flashcard ready for review       │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 6: STUDY FLASHCARDS            │
        │ (Spaced Repetition)                 │
        │                                      │
        │ Day 1: Review "你好"                │
        │ Flow:                                │
        │ 1. Frontend loads flashcard         │
        │ 2. User clicks [Listen]             │
        │ 3. Frontend GET /media/tts_*.mp3   │
        │ 4. Audio plays from shared volume  │
        │ 5. User clicks [Show Answer]       │
        │ 6. User marks: [Easy]              │
        │ 7. Backend updates in MongoDB:     │
        │    - nextReviewDate += 3 days      │
        │    - easeFactor increased          │
        │                                      │
        │ Day 4: System suggests review      │
        │ (same flow, interval grows)        │
        │                                      │
        │ Repeat until memorized             │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 7: TAKE AI-GENERATED QUIZ      │
        │                                      │
        │ Flow:                                │
        │ 1. Teacher uploaded "chapter5.pdf"  │
        │ 2. AI generated 20 questions        │
        │ 3. Quiz stored in MongoDB           │
        │ 4. Student attempts quiz            │
        │ 5. Answers submitted                │
        │ 6. Backend calculates score         │
        │ 7. Results stored in grades DB      │
        │ 8. Student sees score + feedback    │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ STEP 8: CHECK PROGRESS               │
        │                                      │
        │ Flow:                                │
        │ 1. Frontend calls Server Action      │
        │ 2. Backend aggregates from MongoDB: │
        │    - Completed assignments: 15/20  │
        │    - Quiz scores: 85% avg          │
        │    - Flashcards reviewed: 150      │
        │    - Time spent: 12.5 hours        │
        │ 3. Frontend displays charts         │
        │    (Recharts library)              │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │ END: STUDENT SESSION COMPLETE        │
        └──────────────────────────────────────┘
```

---

## 🔐 Security: How Permissions Work

```
EXAMPLE: Can Student Delete a Course?

STEP 1: STUDENT CLICKS DELETE
───────────────────────────────
Frontend:
DELETE /api/courses/course123


STEP 2: BACKEND RECEIVES REQUEST
──────────────────────────────────
Java Controller:
@DeleteMapping("/courses/{id}")
public ResponseEntity<?> deleteCourse(@PathVariable String id) {
  
  // STEP 3: CHECK PERMISSION
  User user = getCurrentUser(); // Get from session
  
  if (!"Teacher".equals(user.getRole())) {
    // Student is not teacher!
    return ResponseEntity.status(403)
      .body("Only teachers can delete courses");
  }
  
  // If we reach here, user is authorized
  Course course = courseRepository.findById(id);
  courseRepository.delete(course);
  
  return ResponseEntity.ok("Deleted");
}


RESPONSE TO STUDENT:
────────────────────
HTTP 403 Forbidden
{
  "error": "Only teachers can delete courses"
}

STEP 4: FRONTEND SHOWS ERROR
─────────────────────────────
User sees: "You don't have permission to delete"
Button is disabled (UI-level protection)
```

---

## 📊 Data Flow Summary

```
                Frontend (Browser)
                  │         ▲
                  │         │
          (HTTP Requests) (HTTP Response)
                  │         │
                  ▼         │
        ┌─────────────────┐ │
        │ SPRING BOOT     │ │
        │ BACKEND         │ │
        └────────┬────────┘ │
                 │          │
         (Database Queries) │
                 │          │
                 ▼          │
    ┌────────────────────────┐
    │      MONGODB           │
    │ (User, Course, Grade)  │
    └────────────────────────┘
    
    Additionally:
    
        Backend
          │
      (HTTP Request)
          │
          ▼
    ┌─────────────────┐
    │ FASTAPI AI      │
    │ SERVICE         │
    └────────┬────────┘
             │
      (DB Queries)
             │
             ▼
    ┌────────────────────┐
    │ QDRANT (Vector DB) │
    │ MONGODB (Metadata) │
    │ DOCKER VOLUMES     │
    └────────────────────┘
```

---

## 🚀 Real-World Example: Teacher Creates Quiz

```
COMPLETE FLOW: Teacher Creates Quiz from Document

1️⃣  TEACHER (Browser)
    ┌──────────────────────────────┐
    │ Course Dashboard             │
    │ [Upload Document]            │
    │ chapter5.docx                │
    │ Click "Convert & Generate"   │
    └──────────┬───────────────────┘
               │
               │ "use client"
               │ onClick={() => upload(file)}
               │
2️⃣  FRONTEND (Next.js)
    ┌──────────────────────────────┐
    │ Form submission              │
    │ - File: chapter5.docx        │
    │ - CourseID: course123        │
    │ - Questions: 20              │
    └──────────┬───────────────────┘
               │
               │ fetch POST /api/courses/course123/upload
               │
3️⃣  BACKEND (Spring Boot)
    ┌──────────────────────────────┐
    │ @PostMapping("/upload")      │
    │ 1. Validate file             │
    │ 2. Save temporarily          │
    │ 3. Call AI Service           │
    └──────────┬───────────────────┘
               │
               │ HTTP POST /upload
               │
4️⃣  AI SERVICE (FastAPI)
    ┌──────────────────────────────┐
    │ @app.post("/upload")         │
    │ 1. LibreOffice converts      │
    │    docx → pdf                │
    │ 2. Save to /shared-media     │
    │ 3. Return PDF URL            │
    └──────────┬───────────────────┘
               │
               │ Returns:
               │ {pdf_url: "..."}
               │
5️⃣  BACKEND RECEIVES PDF URL
    ┌──────────────────────────────┐
    │ Get PDF content              │
    │ Call AI /generate-quiz       │
    │ {                            │
    │   documentId: doc456,        │
    │   pdfContent: "...",         │
    │   numberOfQuestions: 20      │
    │ }                            │
    └──────────┬───────────────────┘
               │
               │ HTTP POST /generate-quiz
               │
6️⃣  AI SERVICE GENERATES QUIZ
    ┌──────────────────────────────┐
    │ @app.post("/generate-quiz")  │
    │ 1. Read PDF                  │
    │ 2. Call Gemini with prompt   │
    │    "Generate 20 questions..." │
    │ 3. Parse response             │
    │ 4. Validate questions        │
    │ 5. Store in MongoDB          │
    └──────────┬───────────────────┘
               │
               │ Returns:
               │ {
               │   success: true,
               │   questions: [...]
               │ }
               │
7️⃣  BACKEND SAVES TO DATABASE
    ┌──────────────────────────────┐
    │ For each question:           │
    │ db.questions.insert_one({    │
    │   courseId: "course123",     │
    │   question: "...",           │
    │   options: [...],            │
    │   correctAnswer: "A"         │
    │ })                           │
    │                              │
    │ Save document reference:     │
    │ db.documents.update_one({    │
    │   status: "quiz_generated",  │
    │   quizId: "quiz789"          │
    │ })                           │
    └──────────┬───────────────────┘
               │
               │ HTTP Response 200
               │ {
               │   success: true,
               │   quizId: "quiz789",
               │   questionCount: 20
               │ }
               │
8️⃣  FRONTEND DISPLAYS SUCCESS
    ┌──────────────────────────────┐
    │ Success message:             │
    │ "✅ Quiz created!"           │
    │ "20 questions generated"     │
    │ [View Quiz] [Share with students]
    └──────────┬───────────────────┘
               │
               │ Show to students
               │
9️⃣  STUDENT TAKES QUIZ
    ┌──────────────────────────────┐
    │ Frontend gets quiz:          │
    │ db.questions.find({          │
    │   courseId: "course123",     │
    │   quizId: "quiz789"          │
    │ })                           │
    │                              │
    │ Display questions:           │
    │ Q1: What does...?            │
    │ [A] [B] [C] [D]              │
    └──────────┬───────────────────┘
               │
               │ Student submits answers
               │
🔟 GRADE STORED
    ┌──────────────────────────────┐
    │ db.grades.insert_one({       │
    │   studentId: "student123",   │
    │   quizId: "quiz789",         │
    │   score: 85,                 │
    │   maxScore: 100              │
    │ })                           │
    │                              │
    │ Show student:                │
    │ Your score: 85/100           │
    │ Correct answers: 17/20       │
    └──────────────────────────────┘
```

---

## ✅ What You've Learned

You now understand:
- ✅ How frontend communicates with backend
- ✅ Server Actions vs REST API
- ✅ Backend to database communication
- ✅ Backend to AI service communication
- ✅ AI service operations
- ✅ Complete student learning flow
- ✅ Permission checking
- ✅ Real-world example: quiz creation

---

## 🎓 Final Summary

**The Complete System:**

1. **User interacts** with Frontend (browser)
2. **Frontend sends** request (Server Action or HTTP)
3. **Backend receives** and validates
4. **Backend queries** MongoDB or calls AI Service
5. **AI Service** processes and stores
6. **Backend returns** response
7. **Frontend updates** UI

All parts work together seamlessly to provide intelligent learning features!

---

## 🎯 You're Now Ready!

You've learned:
- ✅ What Project Rewood does
- ✅ Why we chose our tech stack
- ✅ How frontend works
- ✅ How backend works
- ✅ How database works
- ✅ How AI service works
- ✅ How everything communicates

## 🚀 Next Steps for You

1. **Explore the code**: Read the actual files in the project
2. **Set up locally**: Follow the README to run everything
3. **Read existing features**: Understand current implementation
4. **Ask questions**: Chat with team members
5. **Start contributing**: Begin working on AI service features

---

## 📚 Additional Resources

**In the project:**
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Full directory structure
- [ROUTING_ARCHITECTURE.md](../ROUTING_ARCHITECTURE.md) - Frontend routing
- [ai-service/AI_SERVICE_ARCHITECTURE.md](../ai-service/AI_SERVICE_ARCHITECTURE.md) - Detailed AI service docs
- [README.md](../README.md) - Setup instructions

**Online:**
- [Next.js Docs](https://nextjs.org/docs)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [MongoDB Docs](https://docs.mongodb.com/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

---

## ❓ Common Questions

**Q: Where should I make changes?**
A: That depends on what you want to build:
- UI changes → `frontend/components` or `frontend/app`
- Backend logic → `backend/src/main/java`
- AI features → `ai-service/main.py`

**Q: How do I test my changes?**
A: Run locally with Docker Compose:
```bash
docker-compose up --build
```
Then visit the application and test.

**Q: Where can I ask for help?**
A: Ask your team members! They're here to help you succeed.

**Q: What's the first thing I should do?**
A: Read through the actual code files in the project. See how real code is structured.

---

## 🎉 Conclusion

You now have a complete understanding of Project Rewood's architecture!

From here, you can:
- Understand how to implement new features
- Debug issues by tracing through the flow
- Contribute to the AI service
- Help other team members understand the system
- Build amazing features for teachers and students

**Welcome to the team! Let's build something great together.** 🚀

---

## 📋 Quick Reference

| Component | Purpose | Technology |
|-----------|---------|-----------|
| Frontend | User interface | Next.js, React, TypeScript |
| Backend | Business logic & APIs | Spring Boot, Java |
| Database | Data storage | MongoDB |
| AI Service | Intelligent features | FastAPI, Python |
| Vector DB | Semantic search | Qdrant |
| File Storage | Media files | Docker Volume |

| Flow | Description |
|------|-------------|
| Server Action | Frontend function that runs on server |
| REST API | HTTP endpoint for communication |
| Middleware | Route protection & verification |
| RBAC | Role-based access control |
| RAG | Retrieval + AI generation |
| SRS | Spaced repetition for flashcards |

Good luck! 🌟

