package com.main.backend.controller;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.main.backend.dto.AddStudentRequest;
import com.main.backend.dto.AllStudentResponse;
import com.main.backend.dto.AssignmentListItemResponse;
import com.main.backend.dto.AssignmentSubmissionOverviewResponse;
import com.main.backend.dto.AssignmentSubmissionStudentResponse;
import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.CreateAssignmentRequest;
import com.main.backend.dto.CreateAssignmentRespond;
import com.main.backend.dto.CreateClassRequest;
import com.main.backend.dto.EnrollClassRequest;
import com.main.backend.dto.GradeAssignmentSubmissionRequest;
import com.main.backend.dto.GradeAssignmentSubmissionResponse;
import com.main.backend.model.Assignment;
import com.main.backend.model.AssignmentSubmission;
import com.main.backend.model.Class;
import com.main.backend.model.User;
import com.main.backend.repository.AssignmentRepository;
import com.main.backend.repository.AssignmentSubmissionRepository;
import com.main.backend.repository.ClassRepository;
import com.main.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(originPatterns = { "http://localhost:*", "http://127.0.0.1:*" })
public class ClassController {

        private static boolean isBlank(String value) {
                return value == null || value.trim().isEmpty();
        }

        private User resolveStudentFromRequest(AddStudentRequest req) {
                if (req != null && !isBlank(req.getStudentId())) {
                        return userRepository.findById(req.getStudentId().trim())
                                        .orElseThrow(() -> new RuntimeException("Student not found"));
                }

                if (req != null && !isBlank(req.getStudentEmail())) {
                        return userRepository.findByEmail(req.getStudentEmail().trim().toLowerCase())
                                        .orElseThrow(() -> new RuntimeException("Student not found"));
                }

                throw new RuntimeException("studentId or studentEmail is required");
        }

        private boolean isStudentRole(String role) {
                return role != null && role.equalsIgnoreCase("student");
        }

        private List<String> getOrInitStudentIds(Class c) {
                if (c.getStudentIds() == null) {
                        c.setStudentIds(new ArrayList<>());
                }
                return c.getStudentIds();
        }

        private List<String> normalizeStudentIds(List<String> studentIds) {
                if (studentIds == null || studentIds.isEmpty()) {
                        return Collections.emptyList();
                }

                return studentIds.stream()
                                .filter(Objects::nonNull)
                                .map(String::trim)
                                .filter(id -> !id.isEmpty())
                                .distinct()
                                .toList();
        }

        private Class findClassOrThrow(String classId) {
                if (classId == null || classId.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId is required");
                }

                return classRepository.findById(classId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Class not found"));
        }

        private final ClassRepository classRepository;
        private final UserRepository userRepository;
        private final AssignmentRepository assignmentRepository;
        private final AssignmentSubmissionRepository assignmentSubmissionRepository;

        public ClassController(ClassRepository classRepository, UserRepository userRepository,
                        AssignmentRepository assignmentRepository,
                        AssignmentSubmissionRepository assignmentSubmissionRepository) {
                this.userRepository = userRepository;
                this.classRepository = classRepository;
                this.assignmentRepository = assignmentRepository;
                this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        }

        @PostMapping("/create")
        public ResponseEntity<?> createClass(@RequestBody CreateClassRequest req) {

                Class c = new Class();
                c.setName(req.getName());
                c.setLevel(req.getLevel());
                c.setTime(req.getTime());
                c.setDays(req.getDays());
                c.setDescription(req.getDescription());
                c.setRoom(req.getRoom());
                c.setMaxStudents(req.getMaxStudents());
                c.setStartDate(req.getStartDate());
                c.setEndDate(req.getEndDate());
                c.setTeacherId(req.getTeacherId());

                classRepository.save(c);

                return ResponseEntity.ok(new ClassResponse(c));
        }

        // API endpoint to see all of a teacher's classes
        @GetMapping("/my")
        public List<ClassResponse> getMyClasses(@RequestParam String teacherId) {

                return classRepository
                                .findByTeacherId(teacherId)
                                .stream()
                                .map(ClassResponse::new)
                                .collect(Collectors.toList());
        }

        @GetMapping("/all")
        public List<ClassResponse> getAllClasses() {
                return classRepository.findAll().stream()
                                .map(ClassResponse::new)
                                .collect(Collectors.toList());
        }

        @GetMapping("/enrolled")
        public List<ClassResponse> getEnrolledClasses(@RequestParam String studentId) {
                return classRepository.findByStudentIdsContaining(studentId).stream()
                                .map(ClassResponse::new)
                                .collect(Collectors.toList());
        }

        @GetMapping("/available")
        public List<ClassResponse> getAvailableClasses(@RequestParam String studentId) {
                return classRepository.findAll().stream()
                                .filter(c -> !getOrInitStudentIds(c).contains(studentId))
                                .filter(c -> c.getMaxStudents() == null
                                                || getOrInitStudentIds(c).size() < c.getMaxStudents())
                                .map(ClassResponse::new)
                                .collect(Collectors.toList());
        }

        @PostMapping("/enroll")
        public ResponseEntity<?> enrollClass(@RequestBody EnrollClassRequest req) {
                if (req.getClassId() == null || req.getClassId().isBlank() || req.getStudentId() == null
                                || req.getStudentId().isBlank()) {
                        return ResponseEntity.badRequest().body("classId and studentId are required");
                }

                String classId = Objects.requireNonNull(req.getClassId());
                String studentId = Objects.requireNonNull(req.getStudentId());

                Class c = findClassOrThrow(classId);

                User student = userRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                if (!isStudentRole(student.getRole())) {
                        return ResponseEntity.badRequest().body("Only student accounts can enroll");
                }

                List<String> studentIds = getOrInitStudentIds(c);

                if (studentIds.contains(student.getId())) {
                        return ResponseEntity.ok(Map.of("message", "Already enrolled"));
                }

                if (c.getMaxStudents() != null && studentIds.size() >= c.getMaxStudents()) {
                        return ResponseEntity.badRequest().body("Class is full");
                }

                studentIds.add(student.getId());
                classRepository.save(c);

                return ResponseEntity.ok(new ClassResponse(c));
        }

        // API endpoint when adding a student to class
        @PostMapping("/add-student")
        public ResponseEntity<?> addStudentToClass(@RequestBody AddStudentRequest req) {
                if (req == null || isBlank(req.getClassId())) {
                        return ResponseEntity.badRequest().body("classId is required");
                }

                // Get the class
                Class c = findClassOrThrow(req.getClassId());

                // Get the student
                final User student;
                try {
                        student = resolveStudentFromRequest(req);
                } catch (RuntimeException error) {
                        return ResponseEntity.badRequest().body(error.getMessage());
                }

                // Only users with role "STUDENT" are allowed to enroll
                if (!isStudentRole(student.getRole())) {
                        return ResponseEntity.badRequest()
                                        .body("User is not a student");
                }

                List<String> studentIds = getOrInitStudentIds(c);

                // Check if student is not enroll yet
                if (!studentIds.contains(student.getId())) {
                        if (c.getMaxStudents() != null && studentIds.size() >= c.getMaxStudents()) {
                                return ResponseEntity.badRequest().body("Class is full");
                        }
                        // Add student to class then save
                        studentIds.add(student.getId());
                        classRepository.save(c);
                }

                return ResponseEntity.ok().build();
        }

        // API endpoint to remove a student from a class
        @PostMapping("/remove-student")
        public ResponseEntity<?> removeStudentFromClass(@RequestBody AddStudentRequest req) {
                if (req == null || isBlank(req.getClassId())) {
                        return ResponseEntity.badRequest().body("classId is required");
                }

                // Get the class
                Class c = findClassOrThrow(req.getClassId());

                // Get the student
                final User student;
                try {
                        student = resolveStudentFromRequest(req);
                } catch (RuntimeException error) {
                        return ResponseEntity.badRequest().body(error.getMessage());
                }

                // Only students can be removed
                if (!isStudentRole(student.getRole())) {
                        return ResponseEntity.badRequest()
                                        .body("User is not a student");
                }

                // Remove student if enrolled
                boolean removed = getOrInitStudentIds(c).remove(student.getId());

                if (!removed) {
                        return ResponseEntity.badRequest()
                                        .body("Student is not enrolled in this class");
                }

                classRepository.save(Objects.requireNonNull(c));

                return ResponseEntity.ok().build();
        }

        // API endpod to receive info about a specific class based on classId
        @GetMapping("/{classId}")
        public ClassResponse getClass(@PathVariable String classId) {
                Class c = findClassOrThrow(classId);

                return new ClassResponse(c);
        }

        private List<Class> getTeacherClasses(String teacherId) {
                return classRepository.findByTeacherId(teacherId);
        }

        @GetMapping("/student-count")
        public int getStudentCount(@RequestParam String teacherId) {
                return getTeacherClasses(teacherId)
                                .stream()
                                .flatMap(c -> c.getStudentIds().stream())
                                .collect(Collectors.toSet()) // remove duplicates
                                .size();
        }

        // Find students who have not enrolled in classs {classId} yet
        @GetMapping("/{classId}/not-in-class-students")
        public List<AllStudentResponse> getStudentNotInClass(@PathVariable String classId) {
                // Find class
                Class c = findClassOrThrow(classId);

                // Find students
                List<String> enrolledStudentIds = getOrInitStudentIds(c);

                return userRepository.findAll().stream()
                                .filter(user -> isStudentRole(user.getRole()))
                                .filter(user -> !enrolledStudentIds.contains(user.getId()))
                                .map(user -> new AllStudentResponse(
                                                user.getId(),
                                                user.getFirstName(),
                                                user.getLastName(),
                                                user.getEmail()))
                                .toList();
        }

        @GetMapping("/{classId}/in-class-students")
        public List<AllStudentResponse> getStudentsInClass(@PathVariable String classId) {
                // Get the class
                Class c = findClassOrThrow(classId);

                // 2. Get enrolled student IDs
                List<String> studentIds = getOrInitStudentIds(c);

                if (studentIds.isEmpty()) {
                        return Collections.emptyList();
                }

                List<String> normalizedStudentIds = normalizeStudentIds(studentIds);

                if (normalizedStudentIds.isEmpty()) {
                        return Collections.emptyList();
                }

                // 3. Fetch users by IDs and map to response
                return userRepository.findAllById(normalizedStudentIds).stream()
                                .filter(user -> isStudentRole(user.getRole()))
                                .map(user -> new AllStudentResponse(
                                                user.getId(),
                                                user.getFirstName(),
                                                user.getLastName(),
                                                user.getEmail()))
                                .toList();
        }

        // Create an assignment for class {classId}
        @PostMapping("/{classId}/create-assignment")
        public ResponseEntity<CreateAssignmentRespond> createAssignment(@PathVariable String classId,
                        @RequestBody CreateAssignmentRequest req) {
                findClassOrThrow(classId);

                Assignment assignment = new Assignment();
                assignment.setClassId(classId);
                assignment.setTitle(req.getTitle());
                assignment.setDescription(req.getDescription());
                assignment.setDeadline(LocalDateTime.parse(req.getDeadline()).atZone(ZoneId.systemDefault())
                                .toInstant());

                assignment.setMaxScore(req.getMaxScore());

                assignmentRepository.save(assignment);

                // Get the class
                // 2. Get enrolled student IDs
                return ResponseEntity.ok(new CreateAssignmentRespond(assignment, 0));

        } // Create an assignment for class {classId}

        @GetMapping("/{classId}/assignments")
        public List<AssignmentListItemResponse> getAssignments(@PathVariable String classId) {
                findClassOrThrow(classId);
                return assignmentRepository.findByClassId(classId).stream()
                                .map(assignment -> {
                                        long submittedCount = assignmentSubmissionRepository
                                                        .countByAssignmentId(assignment.getId());
                                        return new AssignmentListItemResponse(assignment, submittedCount);
                                })
                                .toList();

        }

        @GetMapping("/{classId}/assignments/{assignmentId}/submissions")
        public AssignmentSubmissionOverviewResponse getAssignmentSubmissionOverview(
                        @PathVariable String classId,
                        @PathVariable String assignmentId) {
                Class c = findClassOrThrow(classId);
                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Assignment not found"));

                if (!classId.equals(assignment.getClassId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Assignment does not belong to this class");
                }

                List<String> normalizedStudentIds = normalizeStudentIds(getOrInitStudentIds(c));

                Map<String, AssignmentSubmission> latestSubmissionByStudent = new HashMap<>();
                for (AssignmentSubmission submission : assignmentSubmissionRepository.findByAssignmentId(assignmentId)) {
                        if (submission == null || submission.getStudentId() == null
                                        || submission.getStudentId().isBlank()) {
                                continue;
                        }

                        String studentId = submission.getStudentId().trim();
                        AssignmentSubmission existing = latestSubmissionByStudent.get(studentId);

                        if (existing == null) {
                                latestSubmissionByStudent.put(studentId, submission);
                                continue;
                        }

                        if (existing.getSubmittedAt() == null && submission.getSubmittedAt() != null) {
                                latestSubmissionByStudent.put(studentId, submission);
                                continue;
                        }

                        if (existing.getSubmittedAt() != null && submission.getSubmittedAt() != null
                                        && submission.getSubmittedAt().isAfter(existing.getSubmittedAt())) {
                                latestSubmissionByStudent.put(studentId, submission);
                        }
                }

                Set<String> studentIdsForOverview = new LinkedHashSet<>();
                studentIdsForOverview.addAll(normalizedStudentIds);
                studentIdsForOverview.addAll(latestSubmissionByStudent.keySet());

                if (studentIdsForOverview.isEmpty()) {
                        return new AssignmentSubmissionOverviewResponse(
                                        assignmentId,
                                        classId,
                                        0,
                                        0,
                                        Collections.emptyList());
                }

                Map<String, User> studentUserById = userRepository.findAllById(studentIdsForOverview).stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toMap(User::getId, user -> user, (left, right) -> left));

                List<AssignmentSubmissionStudentResponse> studentRows = studentIdsForOverview.stream()
                                .map(studentId -> {
                                        AssignmentSubmission submission = latestSubmissionByStudent.get(studentId);
                                        boolean submitted = submission != null;
                                        User user = studentUserById.get(studentId);

                                        String firstName = user != null && user.getFirstName() != null ? user.getFirstName() : "";
                                        String lastName = user != null && user.getLastName() != null ? user.getLastName() : "";
                                        String email = user != null && user.getEmail() != null ? user.getEmail() : "";

                                        return new AssignmentSubmissionStudentResponse(
                                                        studentId,
                                                        firstName,
                                                        lastName,
                                                        email,
                                                        submitted,
                                                        submission != null ? submission.getSubmittedAt() : null,
                                                        submission != null && submission.isLate(),
                                                        submission != null ? submission.getScore() : null);
                                })
                                .toList();

                long submittedCount = studentRows.stream().filter(AssignmentSubmissionStudentResponse::isSubmitted)
                                .count();

                return new AssignmentSubmissionOverviewResponse(
                                assignmentId,
                                classId,
                                submittedCount,
                                studentRows.size(),
                                studentRows);
        }

        @PutMapping("/{classId}/assignments/{assignmentId}/submissions/{studentId}/grade")
        public GradeAssignmentSubmissionResponse gradeAssignmentSubmission(
                        @PathVariable String classId,
                        @PathVariable String assignmentId,
                        @PathVariable String studentId,
                        @RequestBody GradeAssignmentSubmissionRequest req) {
                findClassOrThrow(classId);

                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Assignment not found"));

                if (!classId.equals(assignment.getClassId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Assignment does not belong to this class");
                }

                if (isBlank(studentId)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "studentId is required");
                }

                if (req == null || req.getScore() == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "score is required");
                }

                int score = req.getScore();
                int maxScore = assignment.getMaxScore() > 0 ? assignment.getMaxScore() : 100;

                if (score < 0 || score > maxScore) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "score must be between 0 and " + maxScore);
                }

                AssignmentSubmission submission = assignmentSubmissionRepository
                                .findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(assignmentId, studentId.trim());

                if (submission == null) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                                        "Submission not found for this student");
                }

                submission.setScore(score);
                submission.setFeedback(req.getFeedback() == null ? null : req.getFeedback().trim());
                AssignmentSubmission savedSubmission = assignmentSubmissionRepository.save(submission);

                return new GradeAssignmentSubmissionResponse(
                                savedSubmission.getId(),
                                assignmentId,
                                classId,
                                savedSubmission.getStudentId(),
                                savedSubmission.getScore(),
                                savedSubmission.getFeedback(),
                                savedSubmission.getSubmittedAt(),
                                savedSubmission.isLate());
        }
}