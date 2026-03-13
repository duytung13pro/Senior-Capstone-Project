# Frontend Explained: What Users See

## 🎯 One-Sentence Summary

**The frontend is everything users see and interact with in their web browser - it's built with Next.js and React, styled beautifully, and talks to the backend to get/send data.**

---

## 🏗️ Frontend Architecture

```
┌──────────────────────────────────────────┐
│          BROWSER (User's Computer)       │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐  │
│  │      NEXT.JS FRONTEND APP        │  │
│  │                                  │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │ Pages & Routes           │   │  │
│  │  │ /auth/login              │   │  │
│  │  │ /dashboard/teacher       │   │  │
│  │  │ /dashboard/student       │   │  │
│  │  └──────────────────────────┘   │  │
│  │                                  │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │ React Components          │   │  │
│  │  │ ClassCard.tsx            │   │  │
│  │  │ StudentList.tsx          │   │  │
│  │  │ AssignmentForm.tsx       │   │  │
│  │  └──────────────────────────┘   │  │
│  │                                  │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │ Styling                  │   │  │
│  │  │ TailwindCSS              │   │  │
│  │  │ Global Styles            │   │  │
│  │  └──────────────────────────┘   │  │
│  │                                  │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │ API Calls                │   │  │
│  │  │ fetch('/api/courses')    │   │  │
│  │  │ Server Actions           │   │  │
│  │  └──────────────────────────┘   │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
└──────────────────────────────────────────┘
              ↕️ HTTP Requests
         Backend & Database
```

---

## 📁 Frontend Folder Structure

```
frontend/
├── app/                          # Main application code
│   ├── layout.tsx                # Root layout (all pages)
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   │
│   ├── auth/                     # Authentication pages
│   │   ├── layout.tsx            # Auth layout (shared)
│   │   ├── login/
│   │   │   └── page.tsx          # Login form
│   │   ├── register/
│   │   │   └── page.tsx          # Registration form
│   │   └── forgot-password/
│   │       └── page.tsx          # Password reset
│   │
│   ├── dashboard/                # Main app (protected)
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Redirect to role portal
│   │   │
│   │   ├── teacher/              # Teacher Portal
│   │   │   ├── layout.tsx        # Teacher layout with sidebar
│   │   │   ├── page.tsx          # Teacher dashboard
│   │   │   ├── classes/
│   │   │   │   └── page.tsx      # Manage classes
│   │   │   ├── assignments/
│   │   │   │   └── page.tsx      # Create assignments
│   │   │   ├── student-progress/
│   │   │   │   └── page.tsx      # Track progress
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx      # Mark attendance
│   │   │   ├── messages/
│   │   │   │   └── page.tsx      # Chat with students
│   │   │   ├── resources/
│   │   │   │   └── page.tsx      # Upload materials
│   │   │   └── profile/
│   │   │       └── page.tsx      # Teacher settings
│   │   │
│   │   ├── student/              # Student Portal
│   │   │   ├── layout.tsx        # Student layout with sidebar
│   │   │   ├── page.tsx          # Student dashboard
│   │   │   ├── my-classes/
│   │   │   │   └── page.tsx      # Enrolled courses
│   │   │   ├── assignments/
│   │   │   │   └── page.tsx      # View/submit assignments
│   │   │   ├── messages/
│   │   │   │   └── page.tsx      # Chat with teacher
│   │   │   ├── grades/
│   │   │   │   └── page.tsx      # View grades
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx      # Class schedule
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx      # Study progress charts
│   │   │   └── resources/
│   │   │       └── page.tsx      # Learning materials
│   │   │
│   │   ├── admin/                # Admin Portal (TODO)
│   │   │   └── page.tsx
│   │   │
│   │   └── center/               # Center Portal (TODO)
│   │       └── page.tsx
│   │
│   ├── actions/                  # Server Actions (Backend Logic)
│   │   ├── auth.ts               # Login/register logic
│   │   ├── course.ts             # Course operations
│   │   ├── enrollment.ts         # Enrollment operations
│   │   ├── student.ts            # Student operations
│   │   ├── users.ts              # User management
│   │   ├── messages.ts           # Message operations
│   │   ├── schedule.ts           # Schedule operations
│   │   └── resources.ts          # Resource operations
│   │
│   └── api/                      # API Routes (REST endpoints)
│       ├── courses/
│       │   └── route.ts          # Course endpoints
│       ├── enrollments/
│       │   └── route.ts          # Enrollment endpoints
│       └── s3-upload/
│           └── route.ts          # File upload endpoints
│
├── components/                   # Reusable React Components
│   ├── ui/                       # UI Components (Radix + Tailwind)
│   │   ├── button.tsx            # <Button />
│   │   ├── card.tsx              # <Card />
│   │   ├── input.tsx             # <Input />
│   │   ├── select.tsx            # <Select />
│   │   ├── dialog.tsx            # <Dialog />
│   │   ├── table.tsx             # <Table />
│   │   └── ... (20+ more)
│   │
│   ├── dashboard-layout.tsx      # Layout wrapper
│   ├── sidebar.tsx               # Teacher sidebar
│   ├── header.tsx                # Teacher header
│   │
│   ├── student/                  # Student-specific components
│   │   ├── student-sidebar.tsx   # Student sidebar
│   │   ├── student-header.tsx    # Student header
│   │   └── ... (other student components)
│   │
│   ├── teacher/                  # Teacher-specific components
│   │   ├── classes-page.tsx
│   │   ├── assignments-page.tsx
│   │   ├── student-progress-page.tsx
│   │   ├── analytics-dashboard.tsx
│   │   └── ... (other teacher components)
│   │
│   └── ... (other shared components)
│
├── lib/                          # Utility Code
│   ├── mongodb.ts                # Database connection
│   ├── utils.ts                  # Helper functions
│   ├── models/                   # Mongoose schemas
│   │   ├── User.ts               # User model
│   │   ├── Course.ts             # Course model
│   │   ├── Enrollment.ts         # Enrollment model
│   │   ├── Grade.ts              # Grade model
│   │   └── ... (other models)
│   ├── auth/
│   │   └── rbac.ts               # Role-based access control
│   ├── aws/
│   │   └── s3.ts                 # AWS S3 integration
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── utils/
│       └── errorHandler.ts       # Error handling
│
├── hooks/                        # Custom React Hooks
│   └── use-toast.ts              # Toast notifications
│
├── i18n/                         # Internationalization
│   ├── en.ts                     # English translations
│   ├── vi.ts                     # Vietnamese translations
│   └── useLanguage.ts            # Language context
│
├── public/                       # Static assets
│   └── media/                    # Images, videos, etc.
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── next.config.mjs               # Next.js config
└── middleware.ts                 # Route protection
```

---

## 🔀 How Routing Works

### File-Based Routing

Next.js has **automatic routing** based on file structure:

```
File Structure                    URL
─────────────────                ─────────────
app/page.tsx                      /
app/auth/login/page.tsx           /auth/login
app/auth/register/page.tsx        /auth/register
app/dashboard/page.tsx            /dashboard
app/dashboard/teacher/page.tsx    /dashboard/teacher
app/dashboard/student/page.tsx    /dashboard/student

No need to configure routes!
Just create folders and files.
```

### Route Groups (Invisible Organization)

```
app/dashboard/
├── (teacher)/
│   ├── layout.tsx     → Different layout for teachers
│   └── page.tsx       → URL: /dashboard
│
└── (student)/
    ├── layout.tsx     → Different layout for students
    └── page.tsx       → URL: /dashboard

Parentheses () don't appear in URLs!
Same URL (/dashboard) shows different layouts
Middleware decides which one based on user role
```

### Protected Routes

```
┌─────────────────────────┐
│ User visits /dashboard  │
└──────────────────┬──────┘
                   ↓
┌─────────────────────────┐
│ middleware.ts runs      │
│ - Check for user role   │
│ - Check cookie/token    │
└──────────────────┬──────┘
                   ↓
        ┌──────────┴──────────┐
        ↓                     ↓
   ┌─────────┐           ┌──────────┐
   │ Teacher?│           │ Student? │
   └────┬────┘           └────┬─────┘
        ↓                     ↓
  /dashboard/teacher    /dashboard/student
```

---

## ⚛️ React Components

### What is a Component?

A **component** is a reusable piece of UI:

```jsx
// Simple component
function WelcomeCard() {
  return (
    <div className="bg-white p-5 rounded-lg">
      <h1 className="text-2xl font-bold">Welcome!</h1>
      <p>Nice to see you again.</p>
    </div>
  );
}

// Using the component multiple times
export default function Dashboard() {
  return (
    <div>
      <WelcomeCard />
      <WelcomeCard />
      <WelcomeCard />
    </div>
  );
}
```

**Benefits:**
- ✅ Reusable - Use same code many times
- ✅ Maintainable - Update once, updates everywhere
- ✅ Testable - Test component in isolation
- ✅ Readable - Code is organized and clear

### Component Hierarchy

```
App (root)
├── Header
├── DashboardLayout
│   ├── Sidebar
│   │   ├── NavLink
│   │   └── NavLink
│   └── MainContent
│       ├── ClassCard
│       ├── ClassCard
│       └── ClassCard
└── Footer
```

### Server Components vs Client Components

```typescript
// Server Component (default)
// Runs on server, renders to HTML
export default function ServerComponent() {
  const data = await getDataFromDatabase();
  return <div>{data}</div>;
}

// Client Component
// Runs in browser, interactive
"use client";
export default function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Teacher asks:** "Why two types?"
- **Server Components:** Faster, more secure (database secrets stay on server)
- **Client Components:** Interactive (buttons, forms, real-time updates)

---

## 🎨 Styling with TailwindCSS

### How It Works

Instead of writing CSS, you add classes to HTML:

```jsx
// Traditional CSS
<div className="card">
  <h2 className="title">Hello</h2>
  <p className="description">Learn CSS the hard way</p>
</div>

<style>
  .card { background: white; padding: 20px; }
  .title { font-size: 20px; font-weight: bold; }
  .description { color: #666; }
</style>

// TailwindCSS (utility-first)
<div className="bg-white p-5 rounded-lg shadow">
  <h2 className="text-xl font-bold">Hello</h2>
  <p className="text-gray-500">Learn with Tailwind</p>
</div>
```

**Common Tailwind classes:**
```
Layout:
- p-5        → padding: 20px
- m-3        → margin: 12px
- w-full     → width: 100%
- h-32       → height: 128px

Colors:
- bg-white   → background: white
- text-blue-600 → text color: blue
- border-gray-200 → border color

Typography:
- text-lg    → font-size: 18px
- font-bold  → font-weight: bold
- text-center → text-align: center

Responsive:
- md:w-1/2   → width: 50% on medium+ screens
- hidden lg:block → hidden except on large screens
```

---

## 🔌 API Communication

### Server Actions (Recommended)

**What they are:** Functions that run on the server but can be called from client

```typescript
// lib/actions/course.ts
"use server"

import { connectToDatabase } from "@/lib/mongodb";
import Course from "@/lib/models/Course";

export async function getCourses(teacherId: string) {
  await connectToDatabase();
  const courses = await Course.find({ teacherId });
  return courses;
}

// app/dashboard/teacher/page.tsx
import { getCourses } from "@/lib/actions/course";

export default async function TeacherDashboard() {
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

**Why use Server Actions?**
- ✅ Direct database access (no API call overhead)
- ✅ Secrets stay on server (API keys hidden)
- ✅ Simpler code (no fetch, no error handling)
- ✅ Better performance (no HTTP round-trip)

### Traditional Fetch (Still Used)

```typescript
// Client component calling backend API
"use client"

import { useEffect, useState } from "react";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    // Fetch from backend API
    fetch("http://localhost:8080/api/courses")
      .then(res => res.json())
      .then(data => setCourses(data));
  }, []);
  
  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
}
```

---

## 🔐 Authentication & Authorization

### Login Flow

```
1. User fills login form
   └─ email: "john@example.com"
   └─ password: "secret123"

2. Form submits to /api/login endpoint

3. Backend validates:
   └─ Find user by email
   └─ Check password
   └─ Return user data with role

4. Frontend stores role:
   └─ localStorage.setItem("userRole", "teacher")

5. Redirect to dashboard:
   └─ Next.js redirects to /dashboard/teacher

6. Middleware checks:
   └─ Read userRole from localStorage
   └─ Verify access to route
   └─ Allow or block
```

### Role-Based Access Control

```typescript
// lib/auth/rbac.ts
export async function requireRole(
  user: any,
  ...allowedRoles: string[]
) {
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden - insufficient permissions");
  }
  
  return user;
}

// Usage in server action
export async function createCourse(data: any) {
  "use server"
  
  const user = await getCurrentUser();
  await requireRole(user, "Teacher", "Admin");
  
  // Only teachers and admins reach here
  const course = await Course.create(data);
  return course;
}
```

---

## 📱 Responsive Design

Project Rewood works on **all screen sizes**:

```
Mobile (320px)           Tablet (768px)        Desktop (1024px+)
┌──────────┐            ┌──────────────┐      ┌──────────────────┐
│ ☰ Menu   │            │ Menu  Sidebar│      │  Sidebar       │
│          │            │              │      │                 │
│ Content  │            │ Content      │      │    Content      │
│          │            │              │      │                 │
└──────────┘            └──────────────┘      └──────────────────┘

TailwindCSS Breakpoints:
- sm: 640px (small devices)
- md: 768px (tablets)
- lg: 1024px (desktops)
- xl: 1280px (large screens)
- 2xl: 1536px (very large screens)

Example usage:
<div className="w-full md:w-1/2 lg:w-1/3">
  Full width on mobile
  50% width on tablets
  33% width on desktops
</div>
```

---

## 🌍 Internationalization (i18n)

Project Rewood supports **multiple languages**:

```typescript
// i18n/en.ts
export const en = {
  dashboard: "Dashboard",
  courses: "Courses",
  students: "Students",
  logout: "Logout"
};

// i18n/vi.ts
export const vi = {
  dashboard: "Bảng điều khiển",
  courses: "Khóa học",
  students: "Sinh viên",
  logout: "Đăng xuất"
};

// hooks/useLanguage.ts
export function useLanguage() {
  const [lang, setLang] = useState("en");
  
  return {
    lang,
    setLang,
    t: lang === "en" ? en : vi
  };
}

// Usage in component
"use client"
export default function Header() {
  const { t, lang, setLang } = useLanguage();
  
  return (
    <div>
      <h1>{t.dashboard}</h1>
      <button onClick={() => setLang(lang === "en" ? "vi" : "en")}>
        {lang === "en" ? "中文" : "English"}
      </button>
    </div>
  );
}
```

---

## 🗄️ Mongoose Models in Frontend

**Wait, why are database models in the frontend?**

```typescript
// frontend/lib/models/User.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ["Student", "Teacher", "Admin"] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
```

**Why?** Because Next.js frontend uses **Server Actions** that directly connect to MongoDB! So the frontend needs the schema.

```
Traditional Setup              Project Rewood Setup
Frontend → API → Backend       Frontend → MongoDB
  (fetch)   (HTTP)             (direct, via Server Actions)

Backend → MongoDB
```

---

## 🚨 Common Frontend Tasks

### Creating a New Page

1. Create folder: `app/dashboard/student/new-feature/`
2. Create file: `page.tsx`
3. Add content:

```typescript
export default function NewFeaturePage() {
  return (
    <div>
      <h1>New Feature</h1>
      {/* Content here */}
    </div>
  );
}
```

URL: `/dashboard/student/new-feature` ✅

### Creating a Reusable Component

1. Create file: `components/ClassCard.tsx`
2. Build component:

```typescript
interface ClassCardProps {
  className: string;
  teacher: string;
  students: number;
}

export function ClassCard({ className, teacher, students }: ClassCardProps) {
  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h3 className="font-bold">{className}</h3>
      <p className="text-gray-600">{teacher}</p>
      <p className="text-sm">{students} students</p>
    </div>
  );
}
```

3. Use it:

```typescript
import { ClassCard } from "@/components/ClassCard";

export default function Classes() {
  return (
    <div>
      <ClassCard className="Chinese 101" teacher="Jane" students={25} />
      <ClassCard className="Chinese 102" teacher="John" students={18} />
    </div>
  );
}
```

### Calling a Server Action

```typescript
// app/actions/course.ts
"use server"
export async function createCourse(formData: FormData) {
  const title = formData.get("title");
  // Save to database
  return { success: true };
}

// app/dashboard/teacher/page.tsx
import { createCourse } from "@/app/actions/course";

export default function CreateCourse() {
  return (
    <form action={createCourse}>
      <input name="title" placeholder="Course title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 📊 State Management

### useState for Simple State

```typescript
"use client"
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### useEffect for Side Effects

```typescript
"use client"
import { useEffect, useState } from "react";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    // Run when component mounts
    fetch("/api/students")
      .then(res => res.json())
      .then(data => setStudents(data));
  }, []); // Empty dependency = run once on mount
  
  return (
    <div>
      {students.map(student => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  );
}
```

---

## ✅ What You've Learned

You now understand:
- ✅ Frontend folder structure
- ✅ How Next.js routing works
- ✅ React components and hierarchy
- ✅ TailwindCSS styling
- ✅ API communication (Server Actions & fetch)
- ✅ Authentication & authorization
- ✅ Responsive design
- ✅ Internationalization
- ✅ Common frontend tasks

---

## 🎯 Next Step

Ready to learn how the backend processes requests?

**[→ Read Document 5: Backend Explained](5_BACKEND_EXPLAINED.md)**

Or go back to **[Welcome Guide](1_WELCOME_START_HERE.md)**
