# Application Architecture

## Directory Structure

```
/app
├── auth                          # Authentication pages
│   ├── layout.tsx                  # Auth layout wrapper
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── register/
│   │   └── page.tsx                # Registration page
│   └── forgot-password/
│       └── page.tsx                # Password reset page
│
├── dashboard                     # Shared dashboard wrapper
│   ├── layout.tsx                  # Dashboard wrapper layout
│   ├── page.tsx                    # Redirects to teacher portal (default)
│   │
│   ├── admin                     # Admin Portal (Full System Control)
│   │   ├── layout.tsx              # Admin layout
│   │   ├── page.tsx                # Admin dashboard
│   │   └── centers/                # Manage franchises [TODO]
│   │
│   ├── center                    # Center/Franchise Portal (Business-level)
│   │   ├── layout.tsx              # Center layout
│   │   ├── page.tsx                # Center dashboard
│   │   └── analytics/              # Business reports [TODO]
│   │
│   ├── teacher                   # Teacher Portal (Course Management)
│   │   ├── layout.tsx              # Teacher layout with sidebar
│   │   ├── page.tsx                # Teacher dashboard
│   │   ├── classes/
│   │   │   └── page.tsx            # Manage classes
│   │   ├── assignments/
│   │   │   └── page.tsx            # Create/manage assignments
│   │   ├── student-progress/
│   │   │   └── page.tsx            # Track student progress
│   │   ├── attendance/
│   │   │   └── page.tsx            # Mark attendance
│   │   ├── messages/
│   │   │   └── page.tsx            # Communicate with students
│   │   ├── announcements/
│   │   │   └── page.tsx            # Create announcements
│   │   ├── resources/
│   │   │   └── page.tsx            # Upload teaching materials
│   │   ├── lesson-plans/
│   │   │   └── page.tsx            # Plan lessons
│   │   ├── productivity/
│   │   │   └── page.tsx            # Notes and to-do lists
│   │   └── profile/
│   │       └── page.tsx            # Teacher settings
│   │
│   └── student                   # Student Portal (Learning)
│       ├── layout.tsx              # Student layout with sidebar
│       ├── loading.tsx             # Loading state
│       ├── page.tsx                # Student dashboard
│       ├── my-classes/
│       │   ├── page.tsx            # View enrolled courses
│       │   └── loading.tsx         # Loading state
│       ├── assignments/
│       │   ├── page.tsx            # View and submit assignments
│       │   └── loading.tsx         # Loading state
│       ├── messages/
│       │   ├── page.tsx            # Chat with instructors
│       │   └── loading.tsx         # Loading state
│       ├── grades/
│       │   └── page.tsx            # View grades and GPA
│       ├── schedule/
│       │   └── page.tsx            # Weekly class schedule
│       ├── analytics/
│       │   └── page.tsx            # Study progress analytics
│       ├── progress/
│       │   └── page.tsx            # Course completion progress
│       ├── resources/
│       │   ├── page.tsx            # Access learning materials
│       │   └── loading.tsx         # Loading state
│       └── profile/
│           └── page.tsx            # Student settings
│
├── api/                            # Backend API routes
│   ├── courses/
│   │   └── route.ts                # Course endpoints
│   ├── enrollments/
│   │   └── route.ts                # Enrollment endpoints
│   └── s3-upload/
│       └── route.ts                # File upload endpoints
│
├── (not-found)/
│   └── page.tsx                    # 404 page [TODO]
│
├── layout.tsx                      # Root layout
└── globals.css                     # Global styles

/components
├── ui/                             # Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── chart.tsx
│   └── ... (other shadcn components)
│
├── theme-provider.tsx              # Theme context
├── sidebar.tsx                     # Teacher portal sidebar
├── header.tsx                      # Teacher portal header
├── student/
│   ├── student-sidebar.tsx         # Student portal sidebar
│   └── student-header.tsx          # Student portal header
│
├── teacher/                        # Teacher-specific components
│   ├── classes-page.tsx
│   ├── assignments-page.tsx
│   ├── student-progress-page.tsx
│   ├── attendance-page.tsx
│   ├── messages-page.tsx
│   ├── announcements-page.tsx
│   ├── resources-page.tsx
│   ├── lesson-plans-page.tsx
│   ├── productivity-tools-page.tsx
│   ├── profile-page.tsx
│   ├── dashboard-page.tsx
│   ├── recent-classes.tsx
│   ├── upcoming-assignments.tsx
│   ├── student-attendance.tsx
│   ├── recent-messages.tsx
│   ├── notifications-panel.tsx
│   └── analytics-dashboard.tsx
│
└── student/                        # Student-specific components
    └── (student page components)

/lib
├── mongodb.ts                      # MongoDB connection (cached)
├── types/
│   └── index.ts                    # TypeScript type definitions
├── utils/
│   ├── errorHandler.ts             # Error handling utilities
│   └── utils.ts                    # General utilities
├── auth/
│   └── rbac.ts                     # Role-based access control
├── aws/
│   └── s3.ts                       # AWS S3 utilities
└── models/                         # Mongoose schemas
    ├── User.ts                     # User model (Student, Teacher, Admin)
    ├── Course.ts                   # Course model
    ├── Module.ts                   # Module/Lesson model
    ├── Enrollment.ts               # Enrollment model
    ├── Assignment.ts               # Assignment model
    ├── Submission.ts               # Student submission model
    ├── Grade.ts                    # Grade/Score model
    ├── Message.ts                  # Message model
    ├── Schedule.ts                 # Class schedule model
    ├── Resource.ts                 # Learning resource model
    ├── Notification.ts             # Notification model
    └── StudyAnalytics.ts           # Study analytics model

/app/actions                        # Server Actions
├── student.ts                      # Student-specific actions
├── courses.ts                      # Course actions
├── enrollment.ts                   # Enrollment actions
├── users.ts                        # User management actions
├── messages.ts                     # Messaging actions
├── schedule.ts                     # Schedule actions
└── resources.ts                    # Resource actions
```

## Portal Access URLs

### Authentication
- **Login**: `/login`
- **Register**: `/register`
- **Forgot Password**: `/forgot-password`

### Teacher Portal
- **Dashboard**: `/dashboard` (redirects to teacher)
- **Classes**: `/dashboard/classes`
- **Assignments**: `/dashboard/assignments`
- **Student Progress**: `/dashboard/student-progress`
- **Attendance**: `/dashboard/attendance`
- **Messages**: `/dashboard/messages`
- **Announcements**: `/dashboard/announcements`
- **Resources**: `/dashboard/resources`
- **Lesson Plans**: `/dashboard/lesson-plans`
- **Productivity**: `/dashboard/productivity`
- **Profile**: `/dashboard/profile`

### Student Portal
- **Dashboard**: `/dashboard/student`
- **My Classes**: `/dashboard/student/my-classes`
- **Assignments**: `/dashboard/student/assignments`
- **Messages**: `/dashboard/student/messages`
- **Grades**: `/dashboard/student/grades`
- **Schedule**: `/dashboard/student/schedule`
- **Analytics**: `/dashboard/student/analytics`
- **Progress**: `/dashboard/student/progress`
- **Resources**: `/dashboard/student/resources`
- **Profile**: `/dashboard/student/profile`

### Center Portal (Future)
- **Dashboard**: `/dashboard/center`
- **Analytics**: `/dashboard/center/analytics`

### Admin Portal (Future)
- **Dashboard**: `/dashboard/admin`
- **Manage Centers**: `/dashboard/admin/centers`

## Database Models

### User
- Role: Student, Teacher, Center Admin, Admin
- Profile information
- Authentication credentials (hashed)

### Course
- Title, description, level
- Instructor reference
- Modules/lessons
- Enrollment list

### Module
- Title, description
- Video content (AWS S3)
- Duration
- Order in course

### Enrollment
- Student reference
- Course reference
- Progress tracking
- Completion status

### Assignment
- Title, description, type (homework, quiz, project, exam)
- Course reference
- Deadline
- Instructions

### Submission
- Assignment reference
- Student reference
- Submitted files
- Grade
- Feedback

### Grade
- Student reference
- Course reference
- Subject/category
- Score
- Weight

### Message
- Sender reference
- Recipient reference
- Message content
- Read status
- Timestamp

### Schedule
- Course reference
- Day and time
- Duration
- Recurring

### Resource
- Title, type (video, PDF, link)
- URL or S3 link
- Course reference
- Tags

### Notification
- User reference
- Message
- Read status
- Timestamp

### StudyAnalytics
- Student reference
- Study time
- Performance metrics
- Achievements

## Backend API Endpoints

### Courses
- `GET /api/courses` - Fetch all courses
- `POST /api/courses` - Create course (Instructor only)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `GET /api/enrollments` - Fetch enrollments
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/:id` - Update progress

### S3 Upload
- `POST /api/s3-upload` - Get presigned URL

## Server Actions

### Student Actions
- `getStudentDashboard()` - Dashboard overview
- `submitAssignment()` - Submit assignment
- `getGrades()` - Fetch grades
- `trackProgress()` - Update learning progress

### Course Actions
- `createCourse()` - Create course (Instructor only)
- `updateCourse()` - Update course
- `deleteCourse()` - Delete course (Instructor only)
- `getCoursesByInstructor()` - Fetch instructor's courses

### Enrollment Actions
- `enrollStudent()` - Enroll in course
- `getStudentEnrollments()` - Fetch student's courses
- `updateProgress()` - Track lesson completion

### User Actions
- `deleteUser()` - Delete user (Admin only)
- `updateUserRole()` - Change user role (Admin only)

### Messaging Actions
- `sendMessage()` - Send message
- `getConversation()` - Fetch message thread
- `markAsRead()` - Mark message as read

### Schedule Actions
- `getSchedule()` - Fetch class schedule
- `createEvent()` - Create schedule event
- `setReminder()` - Set reminder

### Resource Actions
- `getResources()` - Fetch learning materials
- `downloadResource()` - Download file
- `bookmarkResource()` - Save to favorites

## Key Features

### Authentication & RBAC
- Multiple user roles (Student, Teacher, Center Admin, Admin)
- Role-based page access
- Permission-based API endpoints

### Teacher Features
- Dashboard with analytics
- Class management
- Assignment creation and grading
- Student progress tracking
- Attendance marking
- Messaging system
- Resource uploads to AWS S3
- Lesson planning tools
- Productivity tools

### Student Features
- Dashboard with enrolled courses
- Assignment submission
- Grade tracking
- Class schedule view
- Study analytics
- Message instructor
- Access learning resources
- Progress tracking

### Admin Features (Future)
- System-wide user management
- Analytics and reporting
- System configuration

### Center Features (Future)
- Business-level analytics
- Teacher and student management
- Revenue reporting

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Backend**: Next.js Server Actions, API Routes
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: AWS S3
- **Styling**: shadcn/ui components, Tailwind CSS
- **Form Validation**: Zod (via UI components)
- **Charts**: Recharts

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Future Enhancements

1. Real-time notifications with WebSocket
2. Video streaming optimization
3. Advanced analytics dashboard
4. Parent/Guardian portal
5. Mobile app development
6. Payment integration
7. AI-powered grading
8. Social learning features
