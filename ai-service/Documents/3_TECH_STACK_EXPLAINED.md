# Tech Stack Explained: The Tools We Chose

## 🎯 What This Document Covers

This guide explains **every technology** used in Project Rewood, **why we chose it**, and **what it does**. By the end, you'll understand our technology choices like a pro.

---

## 🏗️ The Three-Layer Stack

```
┌────────────────────────────────────────┐
│  PRESENTATION LAYER (What You See)     │
│  Frontend: Next.js 15, React, TypeScript│
│  Styling: TailwindCSS, Radix UI         │
└────────────────────────────────────────┘
                    ↕️
┌────────────────────────────────────────┐
│   BUSINESS LOGIC LAYER (The Brain)     │
│  Backend: Spring Boot 3.4.4, Java       │
│  Database: MongoDB                      │
│  AI Service: FastAPI, Python            │
└────────────────────────────────────────┘
                    ↕️
┌────────────────────────────────────────┐
│  DATA LAYER (The Storage)               │
│  MongoDB (NoSQL Database)               │
│  Docker Volumes (File Storage)          │
└────────────────────────────────────────┘
```

---

## 🌐 FRONTEND: What Users See

### 1. **Next.js 15** 🚀
**What it is:** A React framework that makes building websites easier

**Why we chose it:**
```
✅ Fast - Pages load quickly
✅ Easy to learn - Good for beginners
✅ File-based routing - URLs are automatic
✅ Server-side rendering - Better performance
✅ Built-in optimization - Images, fonts are optimized
✅ TypeScript support - Catch errors early
```

**What it does:**
- Handles page routing (frontend URLs)
- Renders pages on the server or client
- Bundles code efficiently
- Manages state and data flow

**Analogy:** Next.js is like a chef's kitchen tool that helps you organize recipes and cook meals faster.

### 2. **React 19** ⚛️
**What it is:** A JavaScript library for building interactive user interfaces

**Why we chose it:**
```
✅ Component-based - Reusable UI pieces
✅ One-way data flow - Easier to understand
✅ Large community - Lots of tutorials and help
✅ Ecosystem - Tons of libraries work with it
```

**What it does:**
- Breaks UI into reusable components
- Automatically updates UI when data changes
- Manages how components interact
- Handles user interactions (clicks, typing, etc.)

**Analogy:** React is like LEGO blocks. You build small pieces (components) and combine them to make big things (full pages).

### 3. **TypeScript** 📝
**What it is:** JavaScript with extra safety features

**Code Example:**
```typescript
// JavaScript (risky - no type checking)
function add(a, b) {
  return a + b;
}
add("5", 3);  // Returns "53" - oops! String concatenation instead of math

// TypeScript (safe - catches errors)
function add(a: number, b: number): number {
  return a + b;
}
add("5", 3);  // ❌ Error: "5" is not a number! Found during coding, not runtime
```

**Why we chose it:**
```
✅ Catches errors early - Before code runs
✅ Better code completion - IDE shows what methods exist
✅ Easier to refactor - Change code safely
✅ Self-documenting - Types explain what code expects
```

**What it does:**
- Adds type safety to JavaScript
- Catches bugs before runtime
- Provides IDE autocomplete
- Makes code more maintainable

**Analogy:** TypeScript is like spell-check for code. It catches mistakes before they become problems.

### 4. **TailwindCSS** 🎨
**What it is:** A utility-first CSS framework for styling

**Why we chose it:**
```
✅ Fast - Write styles without leaving HTML
✅ Responsive - Built-in mobile support
✅ Customizable - Easy to maintain brand colors
✅ Small bundle - Only includes used styles
✅ Consistency - Same classes everywhere
```

**Code Example:**
```jsx
// Without Tailwind (traditional CSS)
<div className="user-card">
  <h2 className="user-name">John</h2>
  <p className="user-email">john@example.com</p>
</div>

<style>
  .user-card { background: white; padding: 20px; border-radius: 8px; }
  .user-name { font-size: 18px; font-weight: bold; }
  .user-email { color: #666; }
</style>

// With Tailwind (utility classes)
<div className="bg-white p-5 rounded-lg shadow">
  <h2 className="text-lg font-bold">John</h2>
  <p className="text-gray-600">john@example.com</p>
</div>
```

**Analogy:** TailwindCSS is like a paint-by-numbers system for websites. You apply small styling classes to make things look good.

### 5. **Radix UI** 🧩
**What it is:** Pre-built, accessible UI components

**Why we chose it:**
```
✅ Accessible - Works for all users (keyboard, screen readers, etc.)
✅ Unstyled - We style with TailwindCSS
✅ Headless - No opinionated styling
✅ Reliable - Works across all browsers
```

**Components we use:**
- Buttons
- Form inputs
- Dropdowns
- Dialogs/Modals
- Cards
- Tables
- And more...

**Analogy:** Radix UI is like buying pre-made furniture instead of building from scratch. Saves time and ensures quality.

---

## 🧠 BACKEND: The Business Logic

### 6. **Spring Boot 3.4.4** 🍃
**What it is:** A Java framework for building web servers

**Why we chose it:**
```
✅ Enterprise-grade - Used by Fortune 500 companies
✅ Secure - Built-in security features
✅ Scalable - Handles millions of requests
✅ Mature - Proven over decades
✅ Ecosystem - Works with everything Java
```

**What it does:**
- Handles HTTP requests from frontend
- Routes requests to appropriate handlers
- Validates data
- Enforces business rules
- Connects to database
- Sends responses back to frontend

**Architecture Pattern - MVC (Model View Controller):**
```
┌─────────────┐
│   VIEW      │ ← What users see (frontend)
└─────────────┘
         ↕️ (User interactions)
┌─────────────┐
│ CONTROLLER  │ ← Handles requests (backend)
└─────────────┘
         ↕️ (Get/Set data)
┌─────────────┐
│   MODEL     │ ← Data structure (database)
└─────────────┘
```

### 7. **Java** ☕
**What it is:** A programming language that Spring Boot uses

**Why we chose Java:**
```
✅ Strongly-typed - Catches errors like TypeScript
✅ JVM optimized - Runs very fast
✅ Parallel processing - Handles multiple users
✅ Backward compatible - Old code still works
✅ Security - Built-in security features
```

**Code Concept:**
```java
// Java controller that handles login
@RestController
@RequestMapping("/api")
public class AuthController {
  
  @PostMapping("/login")
  public LoginResponse login(@RequestBody LoginRequest request) {
    // 1. Validate email and password
    // 2. Check database for user
    // 3. Return user info or error
    // 4. Send back to frontend
  }
}
```

### 8. **Lombok** 📦
**What it is:** Java library that reduces boilerplate code

**Why we use it:**
```
✅ Less code - Eliminates repetitive getters/setters
✅ Cleaner - Easier to read
✅ Maintained - Automatically updates when fields change
```

**Example:**
```java
// Without Lombok (verbose)
public class User {
  private String name;
  private String email;
  
  public String getName() { return this.name; }
  public void setName(String name) { this.name = name; }
  public String getEmail() { return this.email; }
  public void setEmail(String email) { this.email = email; }
  // ... more boilerplate
}

// With Lombok (clean)
@Data
public class User {
  private String name;
  private String email;
  // Getters, setters, toString, equals, hashCode all auto-generated!
}
```

---

## 💾 DATABASE: The Storage

### 9. **MongoDB** 🍃
**What it is:** A NoSQL document database

**Why we chose it:**
```
✅ Flexible - Schema changes are easy
✅ JSON-like - Matches frontend/backend data structures
✅ Scalable - Handles large datasets
✅ Fast reads - Optimized for querying
✅ No migrations - Add fields without changing table structure
```

**How it works:**
```
Traditional Database (SQL)        MongoDB (NoSQL)
┌──────────────────┐            ┌──────────────────┐
│ USERS TABLE      │            │ USERS COLLECTION │
├──────────────────┤            ├──────────────────┤
│ id   │ name   │  │            │ _id: "123"       │
│ 1    │ John   │  │            │ name: "John"     │
│ 2    │ Jane   │  │            │ email: "j@..."   │
│      │        │  │            │ age: 25          │
└──────────────────┘            └──────────────────┘

Fixed columns                    Flexible fields
Every row same structure         Each document can be different

INSERT INTO users VALUES        db.users.insertOne({
  (1, "John", "john@...");        name: "John",
                                  email: "john@...",
                                  age: 25
                                });
```

**Collections in Project Rewood:**
- `users` - Teacher, student, admin accounts
- `courses` - Course information
- `enrollments` - Student-course relationships
- `assignments` - Homework and quizzes
- `submissions` - Student assignment submissions
- `grades` - Student grades
- `messages` - Teacher-student messages
- `flashcards` - AI-generated study cards
- And more...

**Analogy:** MongoDB is like a filing cabinet where each drawer (collection) contains flexible folders (documents). Unlike SQL databases where every folder must have the same structure, MongoDB folders can be different.

### 10. **MongoDB Atlas** (Optional Cloud)
**What it is:** Hosted MongoDB in the cloud

**Why we might use it:**
```
✅ No server management - They handle infrastructure
✅ Automatic backups - Data is safe
✅ Global distribution - Servers worldwide
✅ Monitoring - See database health
```

**Current Setup:** We run MongoDB locally in Docker, but production might use Atlas.

---

## 🤖 AI SERVICE: The Smart Features

### 11. **FastAPI** ⚡
**What it is:** A modern Python web framework for building APIs

**Why we chose it:**
```
✅ Fast - One of the fastest Python frameworks
✅ Easy - Simple to learn and write
✅ Async - Handles slow operations efficiently
✅ Automatic docs - API documentation auto-generated
✅ Python ecosystem - Works with all AI/ML libraries
```

**What it does:**
- Creates API endpoints for AI features
- Handles document uploads
- Processes documents (Word → PDF)
- Generates speech (text-to-speech)
- Creates flashcards using AI
- Generates quizzes from documents
- Manages file storage

**Code Example:**
```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/upload")
async def upload_file(file: UploadFile):
    # 1. Save uploaded file
    # 2. Convert to PDF using LibreOffice
    # 3. Return file URL to frontend
    return {"file_url": "..."}

@app.post("/tts")
async def text_to_speech(text: str, language: str):
    # 1. Generate audio using edge-tts
    # 2. Save to shared storage
    # 3. Return audio URL
    return {"audio_url": "..."}
```

### 12. **Python** 🐍
**What it is:** Programming language for the AI service

**Why we chose Python:**
```
✅ Easy syntax - Great for beginners
✅ AI/ML libraries - NumPy, Pandas, TensorFlow, etc.
✅ Fast development - Write code quickly
✅ Scientific community - Used by data scientists
✅ Large ecosystem - Libraries for everything
```

**Packages we use:**
- `fastapi` - Web framework
- `edge-tts` - Text-to-speech
- `python-pptx` - PowerPoint processing
- `pdf2image` - PDF conversion
- `qdrant-client` - Vector database
- `google-generativeai` - AI/LLM features
- And more...

---

## 🐳 DEPLOYMENT & INFRASTRUCTURE

### 13. **Docker** 🐳
**What it is:** Technology for packaging applications in containers

**Why we use it:**
```
✅ Consistent - Runs same everywhere (laptop, server)
✅ Isolated - Each service in separate container
✅ Easy deployment - No "but it works on my machine!"
✅ Scalable - Easy to run multiple copies
```

**How it works:**
```
Traditional Way                  Docker Way
┌──────────────────┐            ┌──────────────────┐
│ Your Computer    │            │ Your Computer    │
│ ✅ Works! ✨     │            │ Has Docker       │
└──────────────────┘            └──────────────────┘
         ↓                               ↓
┌──────────────────┐            ┌──────────────────┐
│ Server Computer  │            │ Server Computer  │
│ ❌ Doesn't work  │            │ Docker runs same │
│    (Different    │            │ code ✅ Works!  │
│    libraries)    │            └──────────────────┘
└──────────────────┘

Docker containers are like shipping boxes:
- Package code + dependencies in container
- Container runs identically on any computer
- No "missing library" problems!
```

### 14. **Docker Compose** 📦
**What it is:** Tool for managing multiple Docker containers

**Why we use it:**
```
✅ One command - docker-compose up starts everything
✅ Networking - Containers talk to each other automatically
✅ Volume management - Files shared between containers
✅ Environment variables - Easy configuration
```

**Our setup:**
```yaml
version: '3'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27018:27017"
    # Database server
  
  backend:
    build: ./backend
    ports:
      - "8008:8080"
    # Spring Boot server
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    # Next.js website
  
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    # FastAPI AI server
  
  qdrant:
    image: qdrant/qdrant
    # Vector database for AI
```

**What happens when you run `docker-compose up`:**
1. Builds all four containers
2. Starts them in the right order
3. Connects them to a network
4. Shares volumes
5. Everything is running!

---

## 🔗 Communication Protocols

### 15. **HTTP/HTTPS** 📡
**What it is:** Protocol for web communication

**How it works:**
```
Frontend (Client)          Backend (Server)
   │                           │
   ├─ HTTP Request ─────────→  │
   │ "GET /api/courses"        │
   │                           │
   │                     (Processing...)
   │                           │
   │  ← HTTP Response ──────── │
   │  { data: [...] }          │
   │                           │

Each HTTP request has:
- Method: GET (read), POST (create), PUT (update), DELETE (delete)
- URL: /api/courses (which endpoint)
- Headers: Content-Type, Authorization
- Body: Data being sent (for POST/PUT)

Each HTTP response has:
- Status Code: 200 (success), 404 (not found), 500 (error)
- Headers: Content-Type, etc.
- Body: Response data
```

### 16. **REST API** 🏗️
**What it is:** Standard way to design web APIs

**Why we use it:**
```
✅ Consistent - Same patterns everywhere
✅ Simple - Easy to understand
✅ Scalable - Works for small and large projects
```

**REST patterns:**
```
GET    /api/courses           → List all courses
GET    /api/courses/123       → Get course with ID 123
POST   /api/courses           → Create new course
PUT    /api/courses/123       → Update course 123
DELETE /api/courses/123       → Delete course 123

Same pattern for everything:
GET    /api/students          → List students
GET    /api/students/456      → Get student 456
POST   /api/students          → Create student
etc...
```

---

## 🔐 Security & Authentication

### 17. **CORS** (Cross-Origin Resource Sharing)
**What it is:** Security feature that allows frontend to talk to backend

**Why it matters:**
```
Without CORS:
Frontend (localhost:3000) → Backend (localhost:8080)
❌ Blocked! Different ports = different origin

With CORS enabled:
Frontend (localhost:3000) → Backend (localhost:8080)
✅ Allowed! Backend says "I trust frontend"
```

**In our code:**
```java
@CrossOrigin(origins = "http://localhost:3000")
@RestController
public class AuthController {
  // Now frontend can call these endpoints
}
```

### 18. **Authentication Flow** 🔐
**How login works:**
```
1. User enters email/password in frontend
2. Frontend sends POST /api/login
3. Backend validates credentials
4. Backend returns: { id, role, email }
5. Frontend stores role in localStorage
6. Middleware checks role on each page
7. User redirected to correct dashboard
```

---

## 📊 Data Storage Locations

```
FILES & ASSETS:
┌────────────────────────────┐
│ Docker Shared Volume       │
│ (shared-media)             │
│                            │
│ └─ PDFs (converted docs)   │
│ └─ Audio files (TTS)       │
│ └─ Generated images        │
│                            │
│ Mounted to Frontend public/│
│ → Accessible via URL       │
└────────────────────────────┘

USER DATA:
┌────────────────────────────┐
│ MongoDB                    │
│                            │
│ └─ Users collection        │
│ └─ Courses collection      │
│ └─ Grades collection       │
│ └─ Messages collection     │
│ └─ Flashcards collection   │
│                            │
│ Accessed by Backend & AI   │
└────────────────────────────┘
```

---

## 🏆 Technology Comparison: Why Not These?

### SQL vs MongoDB
```
SQL (MySQL, PostgreSQL)     MongoDB (What we use)
❌ Rigid schema             ✅ Flexible documents
❌ Need migrations          ✅ Easy changes
❌ Relational overhead      ✅ Simpler queries
✅ Proven for decades       ✅ Modern approach
```

**Our choice:** MongoDB - better for education platform where student needs vary.

### Express vs Spring Boot
```
Express (Node.js)           Spring Boot (What we use)
✅ Simple, easy             ✅ Enterprise-grade
❌ Harder to scale          ✅ Built for scaling
❌ Less security            ✅ Security features
```

**Our choice:** Spring Boot - more reliable, better for team project.

### React vs Vue vs Angular
```
React (What we use)         Vue         Angular
✅ Largest ecosystem        Good        Steep learning curve
✅ Most job opportunities   Easier      Lots of boilerplate
✅ Best for beginners       Good for    Complex
                            learners
```

**Our choice:** React - industry standard, largest community.

---

## 📚 Quick Tech Stack Summary

| Layer | Technology | Language | Purpose |
|-------|-----------|----------|---------|
| **Frontend UI** | Next.js 15 | TypeScript/JavaScript | Pages, routing, rendering |
| **UI Library** | React 19 | JavaScript | Component management |
| **Styling** | TailwindCSS | CSS | Design system |
| **Components** | Radix UI | JavaScript | Pre-built accessible UI |
| **Backend** | Spring Boot 3.4.4 | Java | API, business logic |
| **Database** | MongoDB | JSON | Data storage |
| **AI Service** | FastAPI | Python | AI features |
| **Deployment** | Docker | Config | Containerization |
| **Orchestration** | Docker Compose | YAML | Multi-container management |
| **Communication** | REST API | HTTP | Frontend-backend talks |

---

## 🔧 Development Environment

### What You Need Installed
```
✅ Docker & Docker Compose (to run everything)
✅ Node.js & npm (to develop frontend)
✅ Java & Maven (to develop backend)
✅ Python & pip (to develop AI service)
✅ Git (for version control)
```

### Running Locally
```bash
# Option 1: Run with Docker (easiest)
docker-compose up --build

# Option 2: Run individually
cd frontend && npm run dev      # Frontend on localhost:3000
cd backend && mvn spring-boot:run  # Backend on localhost:8080
cd ai-service && python main.py # AI on localhost:8000
cd mongodb && mongod            # Database on localhost:27018
```

---

## 💡 Glossary: Tech Terms

| Term | Meaning |
|------|---------|
| **Framework** | Pre-built structure for building applications |
| **Library** | Reusable code for specific tasks |
| **API** | Way for programs to communicate |
| **Endpoint** | Specific URL that handles a request |
| **Database** | Persistent data storage |
| **Collection** | MongoDB table equivalent |
| **Document** | MongoDB row equivalent |
| **Container** | Packaged application with dependencies |
| **Image** | Blueprint for creating containers |
| **Volume** | Persistent storage in Docker |
| **Port** | Number identifying a service (e.g., 3000) |
| **Localhost** | Your own computer as a server |

---

## ✅ What You've Learned

You now understand:
- ✅ What each technology does
- ✅ Why we chose each tool
- ✅ How technologies work together
- ✅ The three-layer architecture
- ✅ Communication protocols
- ✅ Data storage
- ✅ Development environment

---

## 🎯 Next Step

Ready to dive into how the frontend works?

**[→ Read Document 4: Frontend Explained](4_FRONTEND_EXPLAINED.md)**

Or go back to **[Welcome Guide](1_WELCOME_START_HERE.md)**
