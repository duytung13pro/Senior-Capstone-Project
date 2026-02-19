# Routing Architecture Explanation

## Why Separate `/app/dashboard/teacher` and `/app/dashboard/student`?

### Short Answer
They are **grouped by role**, not duplicated. Route groups (parentheses in Next.js) are invisible in URLs but create logical organization and enable:
- **Role-based middleware protection**
- **Different layouts per role**
- **Shared authentication wrapper**
- **Scalable architecture**

---

## How It Works

### Route Groups (Next.js Feature)
Route groups use parentheses `()` and do NOT appear in URLs:
- `/app/dashboard/teacher/page.tsx` → URL is `/` (teacher sees this)
- `/app/dashboard/student/page.tsx` → URL is `/` (student sees this)
- Middleware decides which one based on user role

### URL Structure
```
User Role    → Redirected To          → Sees URL
─────────────────────────────────────────────────
Teacher      → /dashboard/teacher → /
Student      → /dashboard/student → /
Admin        → /dashboard/admin   → /admin
Center       → /dashboard/center  → /center
```

### Middleware Flow
```
User Login
    ↓
Set role cookie (teacher/student/admin/center)
    ↓
Middleware checks role
    ↓
Redirects to correct route group
    ↓
Loads role-specific layout & components
```

---

## Key Differences Between Role Portals

Each role **MUST** have:

### 1. Different Layouts
```
/teacher/layout.tsx
- Teacher sidebar (Classes, Assignments, Students, Analytics)
- Teacher header
- Teacher-specific UI

/student/layout.tsx
- Student sidebar (My Classes, Assignments, Grades, Schedule)
- Student header  
- Student-specific UI

/admin/layout.tsx
- Admin sidebar (Users, Centers, Settings)
- Admin header
- Admin dashboard components

/center/layout.tsx
- Center sidebar (Analytics, Reports, Staff Management)
- Center header
- Franchise-level UI
```

### 2. Different Sidebars & Navigation
Each portal has **completely different** navigation menus:
- Teachers manage courses and students
- Students view their learning progress
- Admins manage system-wide operations
- Centers manage franchises and metrics

### 3. Different Permissions & RBAC
```
/teacher/page.tsx
- Only teachers can access
- Can create/edit courses
- Can view student progress
- Middleware blocks students from accessing

/student/page.tsx
- Only students can access
- Can view enrolled courses
- Can submit assignments
- Middleware blocks teachers from accessing
```

### 4. Different Components
- **Teacher**: ClassForm, GradeBook, StudentList
- **Student**: CourseCard, AssignmentSubmit, GradeView
- **Admin**: UserManagement, SystemSettings, ReportGenerator
- **Center**: FranchiseAnalytics, StaffDashboard, BusinessMetrics

---

## File Structure Clarity

```
/app/dashboard
├── /layout.tsx                 ← Shared wrapper (auth, theme, header)
├── /page.tsx                   ← Root redirect logic
│
├── /teacher
│   ├── /layout.tsx            ← Teacher-specific layout with sidebar
│   ├── /page.tsx              ← Teacher dashboard
│   ├── /classes
│   ├── /assignments
│   ├── /student-progress
│   └── ... teacher routes
│
├── /student
│   ├── /layout.tsx            ← Student-specific layout with sidebar
│   ├── /page.tsx              ← Student dashboard
│   ├── /my-classes
│   ├── /assignments
│   ├── /grades
│   └── ... student routes
│
├── /admin                    ← Empty, ready for implementation
│   ├── /layout.tsx            ← Admin-specific layout
│   ├── /page.tsx              ← Admin dashboard
│   └── /centers
│
└── /center                   ← Empty, ready for implementation
    ├── /layout.tsx            ← Center-specific layout
    ├── /page.tsx              ← Center dashboard
    └── /analytics
```

---

## Implementation Checklist

- [ ] Middleware correctly checks user role
- [ ] Each portal has unique `layout.tsx` with different sidebars
- [ ] Each sidebar uses role-specific navigation items
- [ ] Role-based Server Actions (RBAC middleware)
- [ ] Styling differences per role (optional but recommended)
- [ ] Admin portal fully implemented
- [ ] Center portal fully implemented

---

## Why This Architecture?

### ✅ Benefits
1. **Clear Separation** - No code confusion about who can do what
2. **Scalable** - Easy to add new roles (e.g., "parent", "reviewer")
3. **Maintainable** - Each team can work on their role independently
4. **Secure** - Middleware prevents unauthorized access
5. **User Experience** - Each role sees exactly what they need

### ❌ What NOT to Do
- ❌ Don't duplicate entire components between roles unnecessarily
- ❌ Don't use single layout for all roles
- ❌ Don't skip middleware checks
- ❌ Don't mix role logic in one "user portal"

---

## Next Steps

1. **Ensure unique layouts** - Each `/(role)/layout.tsx` must be different
2. **Implement full middleware** - Set user role on login (see `/middleware.ts`)
3. **Develop admin portal** - Full implementation with user/center management
4. **Develop center portal** - Franchise-level analytics and reporting
5. **Test role switching** - Verify users can't access other roles' pages

## Main Page
1. http://localhost:3000/ - Landing page
## Auth Pages
1. http://localhost:3000/auth/login - Login page
2. http://localhost:3000/auth/forgot-password - Forgot password
## Student Dashboard
Set localStorage: localStorage.setItem('role', 'STUDENT')

1. http://localhost:3000/dashboard/student - Main student dashboard
2. http://localhost:3000/dashboard/student/analytics - Analytics/Progress tracking
3. http://localhost:3000/dashboard/student/my-classes - My classes
4. http://localhost:3000/dashboard/student/assignments - Assignments
5. http://localhost:3000/dashboard/student/grades - Grades
6. http://localhost:3000/dashboard/student/progress - Progress
7. http://localhost:3000/dashboard/student/resources - Resources
8. http://localhost:3000/dashboard/student/messages - Messages
9. http://localhost:3000/dashboard/student/schedule - Schedule
10. http://localhost:3000/dashboard/student/profile - Profile
## Teacher Dashboard
Set localStorage: localStorage.setItem('role', 'TEACHER')

1. http://localhost:3000/dashboard/teacher - Main teacher dashboard
2. http://localhost:3000/dashboard/teacher/classes - Classes
3. http://localhost:3000/dashboard/teacher/student-progress - Student progress
4. http://localhost:3000/dashboard/teacher/lesson-plans - Lesson plans
5. http://localhost:3000/dashboard/teacher/announcements - Announcements
6. http://localhost:3000/dashboard/teacher/messages - Messages
7. http://localhost:3000/dashboard/teacher/attendance - Attendance
8. http://localhost:3000/dashboard/teacher/profile - Profile
## Admin Dashboard
Set localStorage: localStorage.setItem('role', 'ADMIN')

1. http://localhost:3000/dashboard/admin - Admin dashboard (may be WIP)
## Center Dashboard
Set localStorage: localStorage.setItem('role', 'CENTER')

1. http://localhost:3000/dashboard/center - Center dashboard (may be WIP)