# Database Explained: Where Data Lives

## 🎯 One-Sentence Summary

**MongoDB is a document database that stores all project data (users, courses, grades, messages, etc.) in a flexible, JSON-like format.**

---

## 📊 Database Architecture

```
┌────────────────────────────────────┐
│   APPLICATION (Frontend/Backend)   │
│   Requests data, sends queries    │
└─────────────────┬──────────────────┘
                  │
           Database queries
           (Collections)
                  │
┌─────────────────▼──────────────────┐
│      MONGODB DATABASE              │
│  (Runs on localhost:27018)         │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ COLLECTION: users            │ │
│  │ └─ document 1: User record   │ │
│  │ └─ document 2: User record   │ │
│  │ └─ document 3: User record   │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ COLLECTION: courses          │ │
│  │ └─ document 1: Course record │ │
│  │ └─ document 2: Course record │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ COLLECTION: grades           │ │
│  │ └─ document 1: Grade record  │ │
│  │ └─ document 2: Grade record  │ │
│  └──────────────────────────────┘ │
│                                    │
│  ... (more collections)            │
│                                    │
└────────────────────────────────────┘
```

---

## 🗄️ Collections in Project Rewood

### 1. **USERS Collection**

Stores information about all users (teachers, students, admins).

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "password": "hashed_password_here",
  "name": "John Teacher",
  "role": "Teacher",
  "phoneNumber": "+1-234-567-8900",
  "profilePicture": "https://...",
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-02-01T15:45:00Z")
}
```

**Common Queries:**
```javascript
// Find user by email
db.users.findOne({ email: "john@example.com" })

// Find all teachers
db.users.find({ role: "Teacher" })

// Find teachers created after Jan 2024
db.users.find({ 
  role: "Teacher",
  createdAt: { $gte: ISODate("2024-01-01") }
})

// Count all students
db.users.countDocuments({ role: "Student" })
```

### 2. **COURSES Collection**

Stores course information.

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "title": "Chinese 101: Beginner",
  "description": "Learn basic Mandarin Chinese",
  "teacherId": ObjectId("507f1f77bcf86cd799439011"),
  "level": "Beginner",
  "duration": 40,
  "maxStudents": 30,
  "moduleIds": [
    ObjectId("507f1f77bcf86cd799439013"),
    ObjectId("507f1f77bcf86cd799439014")
  ],
  "enrollmentIds": [
    ObjectId("507f1f77bcf86cd799439015"),
    ObjectId("507f1f77bcf86cd799439016")
  ],
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-02-01T15:45:00Z")
}
```

**Common Queries:**
```javascript
// Find all courses
db.courses.find({})

// Find courses by teacher
db.courses.find({ teacherId: ObjectId("507f1f77bcf86cd799439011") })

// Find beginner courses
db.courses.find({ level: "Beginner" })

// Count courses per level
db.courses.aggregate([
  { $group: { _id: "$level", count: { $sum: 1 } } }
])
```

### 3. **ENROLLMENTS Collection**

Links students to courses (many-to-many relationship).

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "studentId": ObjectId("507f1f77bcf86cd799439020"),
  "courseId": ObjectId("507f1f77bcf86cd799439012"),
  "enrolledAt": ISODate("2024-01-20T08:00:00Z"),
  "progress": 35,
  "status": "active",
  "completedAt": null
}
```

**Common Queries:**
```javascript
// Find all courses for a student
db.enrollments.find({ studentId: ObjectId("...") })

// Find all students in a course
db.enrollments.find({ courseId: ObjectId("...") })

// Count students per course
db.enrollments.aggregate([
  { $group: { _id: "$courseId", studentCount: { $sum: 1 } } }
])

// Find completed courses for student
db.enrollments.find({ 
  studentId: ObjectId("..."),
  status: "completed"
})
```

### 4. **ASSIGNMENTS Collection**

Stores assignment/homework/quiz information.

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439030"),
  "title": "Chapter 5 Vocabulary Quiz",
  "description": "Test your knowledge of Chapter 5 vocabulary",
  "type": "quiz",
  "courseId": ObjectId("507f1f77bcf86cd799439012"),
  "teacherId": ObjectId("507f1f77bcf86cd799439011"),
  "dueDate": ISODate("2024-02-10T23:59:00Z"),
  "maxScore": 100,
  "createdAt": ISODate("2024-02-01T10:00:00Z")
}
```

**Common Queries:**
```javascript
// Find assignments for a course
db.assignments.find({ courseId: ObjectId("...") })

// Find overdue assignments
db.assignments.find({ dueDate: { $lt: new Date() } })

// Find assignments by teacher
db.assignments.find({ teacherId: ObjectId("...") })
```

### 5. **SUBMISSIONS Collection**

Stores student submissions for assignments.

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439040"),
  "assignmentId": ObjectId("507f1f77bcf86cd799439030"),
  "studentId": ObjectId("507f1f77bcf86cd799439020"),
  "submittedAt": ISODate("2024-02-08T14:30:00Z"),
  "filePath": "submissions/assign30_student20_submission.pdf",
  "status": "submitted",
  "isLate": false,
  "grade": null,
  "feedback": null,
  "gradedAt": null
}
```

**Common Queries:**
```javascript
// Find submissions for assignment
db.submissions.find({ assignmentId: ObjectId("...") })

// Find submissions from student
db.submissions.find({ studentId: ObjectId("...") })

// Find ungraded submissions
db.submissions.find({ grade: { $eq: null } })

// Find late submissions
db.submissions.find({ isLate: true })
```

### 6. **GRADES Collection**

Stores course grades for students.

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439050"),
  "studentId": ObjectId("507f1f77bcf86cd799439020"),
  "courseId": ObjectId("507f1f77bcf86cd799439012"),
  "category": "midterm",
  "score": 85,
  "maxScore": 100,
  "percentage": 85,
  "recordedAt": ISODate("2024-02-01T10:00:00Z")
}
```

**Common Queries:**
```javascript
// Get student's grades in a course
db.grades.find({ 
  studentId: ObjectId("..."),
  courseId: ObjectId("...")
})

// Calculate student's GPA
db.grades.aggregate([
  { 
    $match: { studentId: ObjectId("...") }
  },
  { 
    $group: { 
      _id: "$studentId",
      avgGrade: { $avg: "$percentage" }
    }
  }
])
```

### 7. **MESSAGES Collection**

Stores messages between users.

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439060"),
  "senderId": ObjectId("507f1f77bcf86cd799439011"),
  "recipientId": ObjectId("507f1f77bcf86cd799439020"),
  "content": "Hi John, here's feedback on your assignment",
  "subject": "Assignment Feedback",
  "sentAt": ISODate("2024-02-02T15:30:00Z"),
  "isRead": false,
  "readAt": null
}
```

**Common Queries:**
```javascript
// Get conversation between teacher and student
db.messages.find({
  $or: [
    { senderId: ObjectId("teacher"), recipientId: ObjectId("student") },
    { senderId: ObjectId("student"), recipientId: ObjectId("teacher") }
  ]
})

// Find unread messages
db.messages.find({ 
  recipientId: ObjectId("..."),
  isRead: false 
})
```

### 8. **FLASHCARDS Collection** (AI Generated)

Stores flashcards for spaced repetition.

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439070"),
  "studentId": ObjectId("507f1f77bcf86cd799439020"),
  "courseId": ObjectId("507f1f77bcf86cd799439012"),
  "front": "你好 (hello)",
  "back": "A greeting meaning 'hello' or 'how are you'",
  "audioFilePath": "tts/flashcard_70_audio.mp3",
  "interval": 1,
  "repetition": 0,
  "easeFactor": 2.5,
  "nextReviewDate": ISODate("2024-02-03T00:00:00Z"),
  "createdAt": ISODate("2024-02-01T10:00:00Z"),
  "lastReviewedAt": null
}
```

**Spaced Repetition Algorithm (SM-2):**
```
When student reviews flashcard:
- Correct? → Increase interval, increase ease
- Wrong?   → Reset interval, decrease ease

nextReviewDate = today + interval days

Example progression:
Day 1: Review               (interval = 1)
Day 2: Review (correct)     (interval = 3)
Day 5: Review (correct)     (interval = 7)
Day 12: Review (correct)    (interval = 16)
Day 28: Review (correct)    (interval = 42)
...
```

---

## 🔑 Key Database Concepts

### Collections (Tables)

Like spreadsheet sheets, but flexible:

```
Traditional SQL Table (rigid)
┌──────────────────────────┐
│ users                    │
├──────────────────────────┤
│ id    │ name  │ email    │
│ 1     │ John  │ j@...    │
│ 2     │ Jane  │ ja@...   │
└──────────────────────────┘
All rows have same columns

MongoDB Collection (flexible)
{
  "name": "John",
  "email": "j@..."
}
{
  "name": "Jane",
  "email": "ja@...",
  "age": 25,
  "phone": "123-456-7890"
}
Different documents can have different fields!
```

### Documents

Like rows, but as JSON objects:

```json
One user document:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "name": "John",
  "role": "Teacher",
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```

### Fields

Like columns, but flexible:

```
Every document has:
- _id: Unique identifier (MongoDB auto-generates)
- email, name, role, createdAt: Regular fields
- Can add new fields anytime
- Different documents can have different fields
```

### Indexes

Speed up queries (like a book index):

```javascript
// Without index: MongoDB scans every document
db.users.find({ email: "john@example.com" }) // Slow

// With index: MongoDB finds directly
db.users.createIndex({ email: 1 }) // Create index
db.users.find({ email: "john@example.com" }) // Fast!
```

---

## 📝 Common Database Operations

### Create (Insert)

```javascript
// Insert one document
db.users.insertOne({
  email: "john@example.com",
  name: "John Teacher",
  role: "Teacher",
  createdAt: new Date()
})

// Insert multiple documents
db.courses.insertMany([
  {
    title: "Chinese 101",
    level: "Beginner",
    duration: 40
  },
  {
    title: "Chinese 202",
    level: "Intermediate",
    duration: 50
  }
])
```

### Read (Find)

```javascript
// Find all documents
db.users.find({})

// Find with condition
db.users.find({ role: "Student" })

// Find with multiple conditions (AND)
db.users.find({ 
  role: "Student",
  createdAt: { $gte: ISODate("2024-01-01") }
})

// Find with multiple conditions (OR)
db.courses.find({
  $or: [
    { level: "Beginner" },
    { level: "Intermediate" }
  ]
})

// Find one
db.users.findOne({ email: "john@example.com" })

// Find with projection (select specific fields)
db.users.find(
  { role: "Teacher" },
  { name: 1, email: 1, _id: 0 } // Return name, email; hide _id
)

// Find with sorting
db.courses.find({}).sort({ createdAt: -1 }) // Newest first

// Find with limit
db.courses.find({}).limit(10) // First 10 courses

// Find with skip (pagination)
db.courses.find({}).skip(20).limit(10) // Courses 21-30
```

### Update

```javascript
// Update one document
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { name: "John Doe" } }
)

// Update multiple documents
db.users.updateMany(
  { role: "Student" },
  { $set: { status: "active" } }
)

// Replace entire document
db.users.replaceOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    email: "newemail@example.com",
    name: "New Name",
    role: "Teacher"
  }
)
```

### Delete

```javascript
// Delete one document
db.users.deleteOne({ email: "john@example.com" })

// Delete multiple documents
db.courses.deleteMany({ level: "Deprecated" })
```

---

## 🔗 Data Relationships

### One-to-Many (Teacher → Courses)

```
One teacher creates many courses

Teacher Document:
{ _id: 1, name: "Jane" }

Course Documents:
{ courseId: 1, title: "Course A", teacherId: 1 }
{ courseId: 2, title: "Course B", teacherId: 1 }
{ courseId: 3, title: "Course C", teacherId: 1 }

Query:
Find all courses by teacher:
db.courses.find({ teacherId: 1 })
```

### Many-to-Many (Students ↔ Courses)

```
Many students, many courses
Each student enrolls in multiple courses
Each course has multiple students

Enrollment Collection (junction table):
{ studentId: 1, courseId: 1 }
{ studentId: 1, courseId: 2 }
{ studentId: 2, courseId: 1 }
{ studentId: 3, courseId: 2 }

Query:
Find courses for student 1:
db.enrollments.find({ studentId: 1 })
  .then({ courseId: each result })
  .then(lookup courses)
```

### Nested Data (Embedding)

MongoDB allows embedding data:

```json
// Flattened (traditional)
Teacher: { _id: 1, name: "Jane" }
Address: { _id: 1, street: "123 Main St", teacherId: 1 }

// Embedded (MongoDB way)
Teacher: {
  _id: 1,
  name: "Jane",
  address: {
    street: "123 Main St",
    city: "Boston",
    zipCode: "02101"
  }
}

// Query embedded field
db.teachers.find({ "address.city": "Boston" })
```

---

## 📊 Aggregation Pipeline

Complex data analysis:

```javascript
// Get average grade by course
db.grades.aggregate([
  // Stage 1: Match grades from 2024
  {
    $match: {
      recordedAt: { $gte: ISODate("2024-01-01") }
    }
  },
  // Stage 2: Group by course and calculate average
  {
    $group: {
      _id: "$courseId",
      averageScore: { $avg: "$score" },
      studentCount: { $sum: 1 }
    }
  },
  // Stage 3: Sort by average score
  {
    $sort: { averageScore: -1 }
  }
])

// Result:
[
  { _id: "course1", averageScore: 82.5, studentCount: 25 },
  { _id: "course2", averageScore: 78.0, studentCount: 30 },
  ...
]
```

---

## 🔒 Backup & Recovery

### Backup Database

```bash
# Backup all data
mongodump \
  --uri mongodb://localhost:27017 \
  --out /backup/mongodb_backup

# Backup specific collection
mongodump \
  --uri mongodb://localhost:27017 \
  --db rewood \
  --collection users \
  --out /backup/mongodb_backup
```

### Restore Database

```bash
# Restore all data
mongorestore \
  --uri mongodb://localhost:27017 \
  /backup/mongodb_backup

# Restore specific collection
mongorestore \
  --uri mongodb://localhost:27017 \
  --db rewood \
  --collection users \
  /backup/mongodb_backup/rewood/users.bson
```

---

## 🔐 Security Best Practices

```javascript
// 1. Validate all input
// ❌ Never trust user input
db.users.find({ email: userProvidedEmail })

// ✅ Validate before querying
if (!isValidEmail(userProvidedEmail)) {
  throw new Error("Invalid email");
}
db.users.find({ email: userProvidedEmail })

// 2. Use password hashing
// ❌ Store plaintext passwords
{ email: "john@example.com", password: "secret123" }

// ✅ Store hashed passwords
{ email: "john@example.com", password: hash("secret123") }

// 3. Limit query results
// ❌ No limit - could return millions
db.users.find({ role: "Student" })

// ✅ Always limit
db.users.find({ role: "Student" }).limit(100)

// 4. Create indexes on frequently queried fields
db.users.createIndex({ email: 1 })
db.courses.createIndex({ teacherId: 1 })
db.enrollments.createIndex({ studentId: 1, courseId: 1 })
```

---

## 📈 Performance Tips

```javascript
// 1. Use indexes
db.users.createIndex({ email: 1 })

// 2. Avoid scanning all documents
// ❌ Slow
db.users.find({}).then(filter in application)

// ✅ Fast
db.users.find({ role: "Teacher" })

// 3. Project only needed fields
// ❌ Returns all fields
db.users.find({ role: "Teacher" })

// ✅ Returns only needed fields
db.users.find(
  { role: "Teacher" },
  { name: 1, email: 1 }
)

// 4. Batch inserts
// ❌ Slow - 1000 separate inserts
for (let i = 0; i < 1000; i++) {
  db.users.insertOne(data[i])
}

// ✅ Fast - one batch insert
db.users.insertMany(data)
```

---

## ✅ What You've Learned

You now understand:
- ✅ MongoDB basics
- ✅ Collections and documents
- ✅ All data collections in Project Rewood
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Data relationships
- ✅ Querying and filtering
- ✅ Aggregation pipeline
- ✅ Backup and recovery
- ✅ Security best practices
- ✅ Performance optimization

---

## 🎯 Next Step

Ready to learn about the AI Service?

**[→ Read Document 7: AI Service Guide](7_AI_SERVICE_GUIDE.md)**

Or go back to **[Welcome Guide](1_WELCOME_START_HERE.md)**
