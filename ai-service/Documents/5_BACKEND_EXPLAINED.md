# Backend Explained: The Brain of the System

## 🎯 One-Sentence Summary

**The backend is a Java/Spring Boot server that processes requests from the frontend, enforces business rules, validates data, and talks to the database.**

---

## 🏗️ Backend Architecture

```
┌────────────────────────────────────┐
│ FRONTEND (Next.js/React)           │
│ Client sends HTTP Request          │
└─────────────────┬──────────────────┘
                  │
            HTTP POST/GET/PUT/DELETE
                  │
┌─────────────────▼──────────────────┐
│   SPRING BOOT BACKEND SERVER       │
│   (Runs on localhost:8080)         │
│                                    │
│  ┌─────────────────────────────┐  │
│  │  1. HTTP Request Router     │  │
│  │  Matches URL to controller  │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │  2. Controller              │  │
│  │  Handles business logic     │  │
│  │  Validates input            │  │
│  │  Checks permissions         │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │  3. Service Layer           │  │
│  │  Complex operations         │  │
│  │  Business rules             │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │  4. Data Access Layer       │  │
│  │  Database queries           │  │
│  │  Data transformation        │  │
│  └─────────────────────────────┘  │
└─────────────────┬──────────────────┘
                  │
            HTTP Response (JSON)
                  │
┌─────────────────▼──────────────────┐
│ FRONTEND (Next.js/React)           │
│ Receives response & updates UI     │
└────────────────────────────────────┘
```

---

## 📁 Backend Folder Structure

```
backend/
├── src/main/java/com/main/backend/
│   │
│   ├── BackendApplication.java       # Main entry point
│   │
│   ├── controller/                   # Handle HTTP requests
│   │   ├── AuthController.java       # Login/Register
│   │   ├── CourseController.java     # Course endpoints
│   │   ├── StudentController.java    # Student endpoints
│   │   ├── TeacherController.java    # Teacher endpoints
│   │   ├── AssignmentController.java # Assignment endpoints
│   │   ├── GradeController.java      # Grade endpoints
│   │   ├── MessageController.java    # Message endpoints
│   │   └── ... (other controllers)
│   │
│   ├── model/                        # Data models (database documents)
│   │   ├── User.java                 # User model
│   │   ├── Course.java               # Course model
│   │   ├── Enrollment.java           # Enrollment model
│   │   ├── Assignment.java           # Assignment model
│   │   ├── Submission.java           # Submission model
│   │   ├── Grade.java                # Grade model
│   │   ├── Message.java              # Message model
│   │   ├── Schedule.java             # Schedule model
│   │   └── ... (other models)
│   │
│   ├── repository/                   # Database access
│   │   ├── UserRepository.java       # User queries
│   │   ├── CourseRepository.java     # Course queries
│   │   ├── EnrollmentRepository.java # Enrollment queries
│   │   └── ... (other repositories)
│   │
│   ├── service/                      # Business logic
│   │   ├── UserService.java          # User operations
│   │   ├── CourseService.java        # Course operations
│   │   ├── EnrollmentService.java    # Enrollment operations
│   │   ├── AuthService.java          # Authentication logic
│   │   ├── GradeService.java         # Grade operations
│   │   └── ... (other services)
│   │
│   ├── config/                       # Configuration
│   │   ├── CorsConfig.java           # Cross-origin settings
│   │   ├── MongoConfig.java          # Database config
│   │   └── ... (other configs)
│   │
│   ├── exception/                    # Error handling
│   │   ├── CustomException.java      # Custom exceptions
│   │   └── ExceptionHandler.java     # Global error handler
│   │
│   ├── dto/                          # Data Transfer Objects
│   │   ├── LoginRequest.java         # Login request format
│   │   ├── LoginResponse.java        # Login response format
│   │   ├── CourseDTO.java            # Course DTO
│   │   └── ... (other DTOs)
│   │
│   └── util/                         # Helper utilities
│       ├── JwtUtil.java              # JWT token handling
│       ├── ValidationUtil.java       # Input validation
│       └── ... (other utilities)
│
├── src/main/resources/
│   └── application.properties        # Configuration file
│
├── pom.xml                           # Maven dependencies
├── Dockerfile                        # Docker configuration
└── mvnw                              # Maven wrapper
```

---

## 🔄 How Backend Processes a Request

Let's trace what happens when a student submits an assignment:

```
STEP 1: FRONTEND SENDS REQUEST
┌────────────────────────────────┐
Frontend (Client)
POST /api/assignments/submit
{
  "assignmentId": "assign123",
  "studentId": "student456",
  "file": "solution.pdf",
  "submittedAt": "2024-02-01"
}
└────────────────────────────────┘
            ↓
         Network
            ↓
┌────────────────────────────────┐
STEP 2: SPRING BOOT ROUTER RECEIVES
Matches URL: /api/assignments/submit
Finds matching @PostMapping
Routes to: AssignmentController.submitAssignment()
└────────────────────────────────┘
            ↓
┌────────────────────────────────┐
STEP 3: CONTROLLER LAYER
@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
  
  @PostMapping("/submit")
  public ResponseEntity<?> submitAssignment(
    @RequestBody SubmissionRequest request) {
    
    // 1. Validate input
    if (request.getAssignmentId() == null) {
      return ResponseEntity.badRequest()
        .body("Assignment ID required");
    }
    
    // 2. Check permission
    User user = getCurrentUser();
    if (!user.getRole().equals("Student")) {
      return ResponseEntity.status(403)
        .body("Only students can submit");
    }
    
    // 3. Call service layer
    Submission result = assignmentService.submitAssignment(request);
    
    // 4. Return response
    return ResponseEntity.ok(result);
  }
}
└────────────────────────────────┘
            ↓
┌────────────────────────────────┐
STEP 4: SERVICE LAYER
AssignmentService.submitAssignment()

// Complex business logic
- Check if assignment exists
- Check if deadline passed
- Check if already submitted
- Save file to storage
- Create submission record
- Notify teacher
- Update student progress
└────────────────────────────────┘
            ↓
┌────────────────────────────────┐
STEP 5: REPOSITORY (DATA ACCESS)
submissionRepository.save(submission)
↓
Save to MongoDB
db.submissions.insertOne({
  _id: ObjectId(),
  assignmentId: "assign123",
  studentId: "student456",
  filePath: "...",
  grade: null,
  feedback: null,
  submittedAt: new Date()
})
└────────────────────────────────┘
            ↓
┌────────────────────────────────┐
STEP 6: SEND RESPONSE BACK
ResponseEntity.ok({
  "success": true,
  "submissionId": "submission789",
  "message": "Assignment submitted successfully"
})
└────────────────────────────────┘
            ↓
         Network
            ↓
┌────────────────────────────────┐
STEP 7: FRONTEND RECEIVES
Updates UI: "Assignment submitted!"
Refreshes student dashboard
└────────────────────────────────┘
```

---

## 🎯 Controllers: Handling Requests

A **controller** is a Java class that handles HTTP requests.

### Example: Authentication Controller

```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
  
  @Autowired
  private AuthService authService;
  
  // Register new user
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    try {
      User user = authService.register(
        request.getEmail(),
        request.getPassword(),
        request.getName(),
        request.getRole()
      );
      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.badRequest()
        .body("Registration failed: " + e.getMessage());
    }
  }
  
  // Login user
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
      User user = authService.login(
        request.getEmail(),
        request.getPassword()
      );
      return ResponseEntity.ok(new LoginResponse(
        user.getId(),
        user.getEmail(),
        user.getRole()
      ));
    } catch (Exception e) {
      return ResponseEntity.status(401)
        .body("Invalid credentials");
    }
  }
}
```

### Example: Course Controller

```java
@RestController
@RequestMapping("/api/courses")
public class CourseController {
  
  @Autowired
  private CourseService courseService;
  
  // Get all courses
  @GetMapping
  public ResponseEntity<List<Course>> getAllCourses() {
    List<Course> courses = courseService.getAllCourses();
    return ResponseEntity.ok(courses);
  }
  
  // Get specific course
  @GetMapping("/{id}")
  public ResponseEntity<Course> getCourse(@PathVariable String id) {
    Course course = courseService.getCourseById(id);
    if (course != null) {
      return ResponseEntity.ok(course);
    }
    return ResponseEntity.notFound().build();
  }
  
  // Create new course (teacher only)
  @PostMapping
  public ResponseEntity<?> createCourse(
    @RequestBody CourseRequest request,
    @RequestAttribute("userId") String teacherId) {
    
    // Check if user is teacher
    User user = userService.getUserById(teacherId);
    if (!"Teacher".equals(user.getRole())) {
      return ResponseEntity.status(403)
        .body("Only teachers can create courses");
    }
    
    Course course = courseService.createCourse(
      request.getTitle(),
      request.getDescription(),
      teacherId
    );
    return ResponseEntity.status(201).body(course);
  }
  
  // Update course
  @PutMapping("/{id}")
  public ResponseEntity<?> updateCourse(
    @PathVariable String id,
    @RequestBody CourseRequest request) {
    Course course = courseService.updateCourse(id, request);
    return ResponseEntity.ok(course);
  }
  
  // Delete course
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteCourse(@PathVariable String id) {
    courseService.deleteCourse(id);
    return ResponseEntity.ok("Course deleted");
  }
}
```

---

## 💾 Models: Data Structure

A **model** represents a data object stored in MongoDB:

```java
@Document(collection = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
  
  @Id
  private String id;
  
  @Indexed(unique = true)
  private String email;
  
  private String password;
  private String name;
  private String role; // "Teacher", "Student", "Admin", "Center"
  
  private String phoneNumber;
  private String profilePicture;
  
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  
  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }
  
  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}

@Document(collection = "courses")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Course {
  
  @Id
  private String id;
  
  private String title;
  private String description;
  private String teacherId; // Reference to User
  private String level; // "Beginner", "Intermediate", "Advanced"
  
  private int duration; // In hours
  private int maxStudents;
  
  private List<String> moduleIds; // References to Module
  private List<String> enrollmentIds; // References to Enrollment
  
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
```

---

## 🗄️ Repositories: Database Access

A **repository** handles database queries:

```java
// Spring Data MongoDB automatically creates queries
public interface UserRepository 
  extends MongoRepository<User, String> {
  
  // Automatic method - find by email
  User findByEmail(String email);
  
  // Automatic method - find by role
  List<User> findByRole(String role);
  
  // Automatic method - exists check
  boolean existsByEmail(String email);
  
  // Custom query
  @Query("{ 'role': ?0, 'createdAt': { $gte: ?1 } }")
  List<User> findNewUsersByRole(String role, LocalDateTime date);
}

public interface CourseRepository 
  extends MongoRepository<Course, String> {
  
  // Find courses by teacher
  List<Course> findByTeacherId(String teacherId);
  
  // Find courses by level
  List<Course> findByLevel(String level);
  
  // Count total courses
  long countByLevel(String level);
}
```

---

## ⚙️ Services: Business Logic

A **service** contains complex business logic:

```java
@Service
public class CourseService {
  
  @Autowired
  private CourseRepository courseRepository;
  
  @Autowired
  private EnrollmentRepository enrollmentRepository;
  
  public List<Course> getAllCourses() {
    return courseRepository.findAll();
  }
  
  public Course getCourseById(String id) {
    return courseRepository.findById(id)
      .orElse(null);
  }
  
  public Course createCourse(
    String title,
    String description,
    String teacherId) {
    
    // Validate input
    if (title == null || title.isEmpty()) {
      throw new IllegalArgumentException("Title required");
    }
    
    // Create new course
    Course course = new Course();
    course.setTitle(title);
    course.setDescription(description);
    course.setTeacherId(teacherId);
    course.setCreatedAt(LocalDateTime.now());
    
    // Save to database
    return courseRepository.save(course);
  }
  
  public void enrollStudent(String courseId, String studentId) {
    Course course = courseRepository.findById(courseId)
      .orElseThrow(() -> new RuntimeException("Course not found"));
    
    // Check if already enrolled
    Enrollment existing = enrollmentRepository
      .findByStudentIdAndCourseId(studentId, courseId);
    
    if (existing != null) {
      throw new RuntimeException("Already enrolled");
    }
    
    // Create enrollment
    Enrollment enrollment = new Enrollment();
    enrollment.setStudentId(studentId);
    enrollment.setCourseId(courseId);
    enrollment.setEnrolledAt(LocalDateTime.now());
    
    enrollmentRepository.save(enrollment);
  }
}
```

---

## 🔐 Authentication & Authorization

### How Login Works

```java
@Service
public class AuthService {
  
  @Autowired
  private UserRepository userRepository;
  
  public User login(String email, String password) {
    // 1. Find user by email
    User user = userRepository.findByEmail(email);
    
    // 2. Check if user exists
    if (user == null) {
      throw new RuntimeException("User not found");
    }
    
    // 3. Check password
    // TODO: Should use bcrypt! Currently plaintext (SECURITY ISSUE)
    if (!user.getPassword().equals(password)) {
      throw new RuntimeException("Invalid password");
    }
    
    // 4. User is authenticated!
    return user;
  }
  
  public User register(
    String email,
    String password,
    String name,
    String role) {
    
    // Check if email already exists
    if (userRepository.existsByEmail(email)) {
      throw new RuntimeException("Email already registered");
    }
    
    // TODO: Hash password with bcrypt
    User user = new User();
    user.setEmail(email);
    user.setPassword(password); // SECURITY: Should be hashed!
    user.setName(name);
    user.setRole(role);
    
    return userRepository.save(user);
  }
}
```

### Role-Based Access Control

```java
// Check role in controller
@PostMapping("/courses")
public ResponseEntity<?> createCourse(
  @RequestBody CourseRequest request,
  @RequestAttribute("userRole") String role) {
  
  // Only teachers can create courses
  if (!"Teacher".equals(role)) {
    return ResponseEntity.status(403)
      .body("Only teachers can create courses");
  }
  
  // Create course...
  return ResponseEntity.ok(course);
}

// Or use a custom annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
  String[] value();
}

@Aspect
@Component
public class RoleCheckAspect {
  
  @Before("@annotation(requireRole)")
  public void checkRole(JoinPoint joinPoint, RequireRole requireRole) {
    String userRole = getUserRole(); // Get from request
    
    boolean hasRole = Arrays.asList(requireRole.value())
      .contains(userRole);
    
    if (!hasRole) {
      throw new UnauthorizedException("Insufficient permissions");
    }
  }
}

// Usage
@PostMapping("/courses")
@RequireRole({"Teacher", "Admin"})
public ResponseEntity<?> createCourse(@RequestBody CourseRequest request) {
  // Only executed if user is teacher or admin
}
```

---

## 🔄 REST API Endpoints

### Authentication Endpoints

```
POST /api/auth/register
Request:
{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Teacher",
  "role": "Teacher"
}

Response (201):
{
  "id": "user123",
  "email": "john@example.com",
  "name": "John Teacher",
  "role": "Teacher"
}

---

POST /api/auth/login
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "id": "user123",
  "email": "john@example.com",
  "role": "Teacher"
}
```

### Course Endpoints

```
GET /api/courses
Response (200):
[
  {
    "id": "course123",
    "title": "Chinese 101",
    "teacherId": "user123",
    "level": "Beginner",
    "createdAt": "2024-01-15"
  },
  ...
]

---

GET /api/courses/course123
Response (200):
{
  "id": "course123",
  "title": "Chinese 101",
  "description": "Learn basic Chinese",
  "teacherId": "user123",
  "moduleIds": ["module1", "module2"],
  "enrollmentIds": ["enrollment1", "enrollment2"]
}

---

POST /api/courses
Request:
{
  "title": "Chinese 101",
  "description": "Learn basic Chinese",
  "level": "Beginner"
}

Response (201):
{
  "id": "course123",
  "title": "Chinese 101",
  "teacherId": "teacher-user-id",
  "createdAt": "2024-02-01"
}

---

PUT /api/courses/course123
Request:
{
  "title": "Chinese 101 - Updated",
  "description": "Updated description"
}

Response (200):
{
  "id": "course123",
  "title": "Chinese 101 - Updated",
  "updatedAt": "2024-02-01"
}

---

DELETE /api/courses/course123
Response (200):
{
  "message": "Course deleted successfully"
}
```

---

## 🚀 Running the Backend

### Locally (Development)

```bash
# Navigate to backend
cd backend

# Run with Maven
mvn spring-boot:run

# Runs on http://localhost:8080
```

### With Docker

```bash
# Build
docker build -t backend .

# Run
docker run -p 8008:8080 backend

# Runs on http://localhost:8008
```

---

## 📊 Common Backend Patterns

### Dependency Injection

```java
// Before: Tightly coupled
public class CourseService {
  private CourseRepository repo = new CourseRepository();
  // Hard to test, can't swap implementations
}

// After: Spring auto-injects
@Service
public class CourseService {
  @Autowired
  private CourseRepository repo; // Spring provides instance
  // Easy to test, can mock/swap implementations
}
```

### Exception Handling

```java
// Global exception handler
@RestControllerAdvice
public class ExceptionHandler {
  
  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<?> handleNotFound(EntityNotFoundException e) {
    return ResponseEntity.status(404)
      .body(Map.of("error", "Not found"));
  }
  
  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<?> handleUnauthorized(UnauthorizedException e) {
    return ResponseEntity.status(401)
      .body(Map.of("error", "Unauthorized"));
  }
  
  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> handleGeneric(Exception e) {
    return ResponseEntity.status(500)
      .body(Map.of("error", "Internal server error"));
  }
}
```

### Validation

```java
public class CourseRequest {
  @NotBlank(message = "Title is required")
  private String title;
  
  @NotNull(message = "Level is required")
  private String level;
  
  @Min(value = 1, message = "Duration must be at least 1 hour")
  private int duration;
}

@PostMapping
public ResponseEntity<?> createCourse(
  @Valid @RequestBody CourseRequest request) {
  // Automatically validates; returns 400 if invalid
  return ResponseEntity.ok(courseService.create(request));
}
```

---

## 🔧 Configuration

### application.properties

```properties
# Spring Boot
spring.application.name=RewoodBackend
server.port=8080

# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/rewood
spring.data.mongodb.database=rewood

# CORS
cors.allowed.origins=http://localhost:3000
cors.allowed.methods=GET,POST,PUT,DELETE
cors.allowed.headers=*

# Logging
logging.level.root=INFO
logging.level.com.main.backend=DEBUG
```

---

## ✅ What You've Learned

You now understand:
- ✅ Backend architecture and layers
- ✅ How controllers handle requests
- ✅ How services implement business logic
- ✅ How repositories access databases
- ✅ Models and data structure
- ✅ Authentication & authorization
- ✅ REST API design
- ✅ Common Spring Boot patterns
- ✅ Exception handling
- ✅ Configuration

---

## 🎯 Next Step

Ready to learn how data is stored?

**[→ Read Document 6: Database Explained](6_DATABASE_EXPLAINED.md)**

Or go back to **[Welcome Guide](1_WELCOME_START_HERE.md)**
