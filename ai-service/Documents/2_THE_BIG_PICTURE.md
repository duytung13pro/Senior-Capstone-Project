# The Big Picture: What is Project Rewood?

## 🎯 One-Sentence Summary

**Project Rewood is a web-based learning platform that helps teachers manage their Chinese language classes and helps students learn more effectively.**

---

## 📖 The Problem We're Solving

### Before Project Rewood

Teachers in language centers faced many challenges:

```
Teachers:
❌ Scattered teaching materials across different folders
❌ Difficulty communicating with 30+ students individually
❌ Manual attendance tracking (paper-based)
❌ No easy way to track student progress
❌ Wasting time on admin work instead of teaching
❌ Can't create quizzes or flashcards efficiently

Students:
❌ Hard to find learning materials
❌ Don't know their progress
❌ No interaction with teacher outside class
❌ Confusing interface across multiple platforms
❌ Can't practice on their own schedule
```

### With Project Rewood

Now they have:

```
Teachers:
✅ Centralized course management
✅ Easy communication dashboard
✅ Automated attendance tracking
✅ Real-time student progress monitoring
✅ Templates for emails and announcements
✅ AI-powered quiz generation

Students:
✅ All materials in one place
✅ Clear progress tracking
✅ Easy messaging with teacher
✅ Simple, intuitive interface
✅ Practice tools and resources
✅ AI-powered flashcard generation
```

---

## 👥 Who Uses Project Rewood?

Project Rewood has **4 different portals** for different users:

### 1️⃣ **Students** 👨‍🎓
**What they do:**
- View enrolled courses
- Submit assignments
- Check grades
- Message their teacher
- View their study progress
- Access learning resources
- Create flashcards for practice

**Their motto:** *"I want an easy place to learn and track my progress"*

### 2️⃣ **Teachers** 👩‍🏫
**What they do:**
- Create and manage courses
- Upload teaching materials
- Create assignments and quizzes
- Track student attendance
- Give grades and feedback
- Message students and parents
- View analytics on how students are doing
- Plan lessons
- Create announcements

**Their motto:** *"I want one place to manage everything without chaos"*

### 3️⃣ **Center Admins** 🏫
**What they do:**
- Manage multiple learning centers (franchises)
- View business analytics
- Monitor teacher performance
- Create reports for upper management
- Manage staff
- Track revenue and enrollment

**Their motto:** *"I need to see the big picture of my business"*

**Status:** 🚧 Currently in development (marked as TODO)

### 4️⃣ **Super Admins** 🔐
**What they do:**
- Manage the entire system
- Add new centers
- Manage all users
- Configure system settings
- View platform-wide analytics

**Their motto:** *"I control the whole platform"*

**Status:** 🚧 Currently in development (marked as TODO)

---

## 🏗️ The Three Main Parts

Every web application has three main pieces:

```
┌────────────────────┐
│   FRONTEND         │  ← What users see in browser
│  (Next.js, React)  │
└────────────────────┘
         ↕️ (Talk to each other via API)
┌────────────────────┐
│    BACKEND         │  ← The thinking part
│  (Spring Boot)     │
└────────────────────┘
         ↕️ (Query data)
┌────────────────────┐
│    DATABASE        │  ← Where data lives
│    (MongoDB)       │
└────────────────────┘
```

### **Frontend** - What Users See 👀
- Website users visit in their browser
- Built with **Next.js** (a React framework)
- Written in **TypeScript** (a safe version of JavaScript)
- Styled with **TailwindCSS** (makes things look pretty)
- Different layouts for each role (teacher sees different menu than student)

**Example:** When a teacher logs in, they see a dashboard with a sidebar menu containing: Classes, Assignments, Student Progress, Attendance, Messages, etc.

### **Backend** - The Brain 🧠
- Server that processes all requests
- Built with **Spring Boot** (a Java framework)
- Runs business logic (calculations, validations, decisions)
- Connects to the database
- Exposes **APIs** (endpoints that frontend can call)

**Example:** When a teacher marks attendance, the frontend sends a request to the backend API at `POST /api/attendance`. The backend validates the data, checks if the teacher is authorized, saves it to the database, and returns a success message.

### **Database** - The Storage 💾
- Stores all the data (users, courses, grades, messages, etc.)
- Built with **MongoDB** (a document database)
- Data is stored in **collections** (like tables in Excel)
- Each collection contains **documents** (like rows, but flexible)

**Example:** The `users` collection stores all user information. One document might look like:
```json
{
  "id": "12345",
  "email": "john@example.com",
  "name": "John Teacher",
  "role": "TEACHER",
  "createdAt": "2024-01-15"
}
```

---

## 🤖 The AI Service (Your Part!)

We recently added a **fourth component** - the AI Service:

```
┌──────────────────┐
│  FRONTEND        │
└──────────────────┘
         ↕️
┌──────────────────┐
│   BACKEND        │
└──────────────────┘
    ↕️        ↕️
┌─────────┐  ┌──────────────────┐
│ DATABASE │  │  AI SERVICE ✨   │  ← New!
└─────────┘  │  (Python/FastAPI)│
             └──────────────────┘
```

### What Does the AI Service Do?

The AI Service provides **intelligent features** that make learning better:

1. **📚 Document Processing** - Convert Word, PowerPoint, PDFs into web-friendly formats
2. **🎙️ Text-to-Speech** - Read Chinese text aloud with natural pronunciation
3. **💬 Smart Flashcards** - Generate flashcards from course materials using AI
4. **❓ Smart Quiz Generation** - Create questions based on course content automatically
5. **🔍 Context-Aware Translation** - Understand words by looking at course materials

### Why Did We Build It?

**Problem:** Teachers spend hours creating flashcards and quizzes manually. Students need better ways to practice.

**Solution:** Use AI to automate this work so:
- Teachers can focus on teaching, not administrative work
- Students can learn at their own pace with intelligent tools
- All tools are tailored to each course's content

---

## 🏛️ Architecture Philosophy: Why This Design?

### Design Choice 1: Separate Frontend & Backend ✅

```
❌ Old Way (Tightly Coupled)
- Frontend and backend mixed together
- Hard to change one without breaking the other
- Both must use the same language

✅ Our Way (Separate)
- Frontend is completely separate from backend
- Can update one without affecting the other
- Frontend can be JavaScript, backend can be Java
```

**Why?** Flexibility and maintainability. Different people can work on frontend and backend without stepping on each other's toes.

### Design Choice 2: Separate AI Service ✅

```
❌ Old Way (Everything in Backend)
- One service does everything
- If AI processing breaks, whole system breaks
- Hard to scale

✅ Our Way (Separate Service)
- AI service is completely independent
- Can be updated/restarted without affecting users
- Easy to scale just the AI part
```

**Why?** AI tasks (document processing, TTS) are resource-intensive. By isolating them, we can manage them separately.

### Design Choice 3: Role-Based Routing ✅

```
❌ Old Way (One Interface for Everyone)
- Everyone sees the same menu
- Confusing for users
- Need to show/hide features based on role

✅ Our Way (Different Interfaces)
- Teachers see teacher interface
- Students see student interface
- Each interface is optimized for that role
```

**Why?** Better user experience. Teachers don't need to see "My Classes I'm Enrolled In" - they teach the classes.

---

## 📊 Data Flow Example: A Teacher Creating an Assignment

Let's trace what happens when a teacher creates an assignment:

```
1. FRONTEND (Browser)
   └─ Teacher fills out form:
      • Title: "Chapter 5 Vocabulary Quiz"
      • Type: "Quiz"
      • Deadline: 2024-02-15
      └─ Clicks "Create Assignment"

2. COMMUNICATION (API Call)
   └─ Frontend sends HTTP request:
      POST /api/assignments
      {
        "title": "Chapter 5 Vocabulary Quiz",
        "type": "quiz",
        "deadline": "2024-02-15",
        "courseId": "course123"
      }

3. BACKEND (Server Processing)
   └─ Receives request
      └─ Validates: Is this person a teacher? Do they own this course?
      └─ Creates the assignment
      └─ Saves to database
      └─ Returns success response

4. DATABASE (Storage)
   └─ Stores new assignment document:
      {
        "_id": "assignment456",
        "title": "Chapter 5 Vocabulary Quiz",
        "type": "quiz",
        "deadline": "2024-02-15",
        "courseId": "course123",
        "teacherId": "teacher789",
        "createdAt": "2024-02-01"
      }

5. FRONTEND (Update UI)
   └─ Receives success response
      └─ Shows success message: "Assignment created!"
      └─ Updates the page to show new assignment
```

---

## 🗂️ Where Code Lives

```
Senior-Capstone-Project/
├── frontend/              ← Frontend code (Next.js, React, TypeScript)
│   ├── app/               ← Pages and routes
│   ├── components/        ← React components
│   ├── lib/               ← Helper code, database models
│   └── ...
├── backend/               ← Backend code (Spring Boot, Java)
│   ├── src/main/java/     ← Java code
│   ├── pom.xml            ← Dependencies
│   └── ...
├── ai-service/            ← AI Service code (Python, FastAPI)
│   ├── main.py            ← Main API code
│   ├── requirements.txt    ← Python dependencies
│   └── Documents/         ← THIS GUIDE!
├── docker-compose.yml     ← Runs everything together
└── ...
```

---

## 🚀 Technology Stack Summary

| Component | Technology | Language | Why? |
|-----------|-----------|----------|------|
| **Frontend** | Next.js 15 | TypeScript/React | Modern, fast, easy to build UIs |
| **Backend** | Spring Boot 3.4.4 | Java | Robust, enterprise-grade, secure |
| **Database** | MongoDB | JSON-like | Flexible, great for educational data |
| **AI Service** | FastAPI | Python | Fast, great for AI/ML tasks |
| **Deployment** | Docker + Docker Compose | - | Everything runs the same everywhere |

---

## 📈 Current Status

### Completed ✅
- User authentication (login/register)
- Student portal (basic functionality)
- Teacher portal (basic functionality)
- Database models and schemas
- API endpoints for core features
- Responsive UI design
- Role-based access control
- Message system
- Assignment management

### In Progress 🚧
- AI Service (this is where you come in!)
- Admin portal
- Center portal
- Advanced analytics

### Future Plans 📅
- Mobile app
- Video streaming improvements
- Advanced AI features (tutoring, personalized learning paths)
- Offline mode
- Advanced reporting

---

## 🎓 Key Concepts You'll Learn

As you dive deeper into this guide, you'll understand:

1. **Frontend Routing** - How URLs map to different pages
2. **Server Actions** - How frontend sends data to backend
3. **Middleware** - How the system checks if you have permission
4. **API Endpoints** - How frontend and backend communicate
5. **MongoDB Schema** - How data is organized
6. **Docker** - How everything is packaged and run
7. **Microservices** - How the AI service is independent

---

## 💭 Think About

As you move forward, think about these questions:

1. **For the Student Portal:** What information would YOU want to see if you were a student?
2. **For the Teacher Portal:** What would make a teacher's job easier?
3. **For the AI Service:** What AI features would help language learners the most?

---

## 🔗 Quick Glossary

| Term | Simple Explanation |
|------|-------------------|
| **Frontend** | What users see and interact with (website/app) |
| **Backend** | Server that does the thinking and processing |
| **API** | Way for frontend and backend to talk to each other |
| **Database** | Storage system for all data |
| **Authentication** | Login system to verify who you are |
| **Authorization** | Checking if you're allowed to do something |
| **Role** | What type of user you are (teacher/student/admin) |
| **Microservice** | A small, independent service that does one thing well |
| **Docker** | Tool that packages code so it runs everywhere |
| **Repository** | Folder where all project code is stored |

---

## ✅ What You've Learned

By reading this document, you now know:

- ✅ What Project Rewood does and why it exists
- ✅ Who uses it (4 different user types)
- ✅ The 3 main components (Frontend, Backend, Database) + AI Service
- ✅ Why we made these architectural choices
- ✅ How data flows through the system
- ✅ What technology we use and why
- ✅ Current status and future plans

---

## 🎯 Next Step

Ready to learn about the technology stack in detail?

**[→ Read Document 3: Tech Stack Explained](3_TECH_STACK_EXPLAINED.md)**

Or go back to the **[Welcome Guide](1_WELCOME_START_HERE.md)**
