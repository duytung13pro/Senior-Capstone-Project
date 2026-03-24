package com.main.backend.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.main.backend.dto.AddStudentRequest;
import com.main.backend.dto.AllStudentResponse;
import com.main.backend.dto.AttendanceBatchUpdateRequest;
import com.main.backend.dto.AttendanceEntryResponse;
import com.main.backend.dto.AttendanceStatusUpdateRequest;
import com.main.backend.dto.AssignmentListItemResponse;
import com.main.backend.dto.AssignmentSubmissionOverviewResponse;
import com.main.backend.dto.AssignmentSubmissionStudentResponse;
import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.CreateAssignmentRequest;
import com.main.backend.dto.CreateAssignmentRespond;
import com.main.backend.dto.CreateClassRequest;
import com.main.backend.dto.EnrollClassRequest;
import com.main.backend.dto.EraseClassesRequest;
import com.main.backend.dto.GradeAssignmentSubmissionRequest;
import com.main.backend.dto.GradeAssignmentSubmissionResponse;
import com.main.backend.dto.SubmitAssignmentRequest;
import com.main.backend.model.AttendanceEntry;
import com.main.backend.model.Assignment;
import com.main.backend.model.AssignmentSubmission;
import com.main.backend.model.Class;
import com.main.backend.model.User;
import com.main.backend.repository.AttendanceEntryRepository;
import com.main.backend.repository.AssignmentRepository;
import com.main.backend.repository.AssignmentSubmissionRepository;
import com.main.backend.repository.ClassRepository;
import com.main.backend.repository.LessonPlanRepository;
import com.main.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(originPatterns = { "http://localhost:*", "http://127.0.0.1:*" })
public class ClassController {

        private static final Set<String> ALLOWED_ATTENDANCE_STATUSES = Set.of(
                        "Present",
                        "Late",
                        "Absent",
                        "Excused");

        private static final Set<String> ALLOWED_ANNOUNCEMENT_STATUSES = Set.of(
                        "Draft",
                        "Published");

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

        private List<Class.ResourceLink> getOrInitResources(Class c) {
                if (c.getResources() == null) {
                        c.setResources(new ArrayList<>());
                }
                return c.getResources();
        }

        private List<Class.AnnouncementEntry> getOrInitAnnouncements(Class c) {
                if (c.getAnnouncements() == null) {
                        c.setAnnouncements(new ArrayList<>());
                }
                return c.getAnnouncements();
        }

        private List<Class.ModuleEntry> getOrInitModules(Class c) {
                if (c.getModules() == null) {
                        c.setModules(new ArrayList<>());
                }
                return c.getModules();
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

        private String normalizeAttendanceDateOrThrow(String date) {
                if (date == null || date.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "date is required in yyyy-MM-dd format");
                }

                try {
                        LocalDate parsed = LocalDate.parse(date.trim());
                        return parsed.toString();
                } catch (Exception ignored) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Invalid date format. Expected yyyy-MM-dd");
                }
        }

        private String normalizeAttendanceStatusOrThrow(String status) {
                if (status == null || status.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "status is required");
                }

                String normalized = status.trim();
                for (String allowed : ALLOWED_ATTENDANCE_STATUSES) {
                        if (allowed.equalsIgnoreCase(normalized)) {
                                return allowed;
                        }
                }

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid status. Use Present, Late, Absent, or Excused");
        }

        private String normalizeAnnouncementStatusOrThrow(String status) {
                if (status == null || status.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "status is required");
                }

                String normalized = status.trim();
                for (String allowed : ALLOWED_ANNOUNCEMENT_STATUSES) {
                        if (allowed.equalsIgnoreCase(normalized)) {
                                return allowed;
                        }
                }

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid status. Use Draft or Published");
        }

        private Map<String, Object> announcementToMap(Class ownerClass, Class.AnnouncementEntry entry) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", entry.getId());
                row.put("title", entry.getTitle());
                row.put("content", entry.getContent());
                row.put("status", entry.getStatus());
                row.put("target", entry.getTarget());
                row.put("pinned", entry.getPinned());
                row.put("createdAt", entry.getCreatedAt());
                row.put("updatedAt", entry.getUpdatedAt());
                row.put("classId", ownerClass.getId());
                row.put("className", ownerClass.getName());
                return row;
        }

        private AttendanceEntry upsertAttendanceEntry(
                        String classId,
                        List<String> normalizedStudentIds,
                        String date,
                        String studentId,
                        String status) {
                String normalizedStudentId = studentId == null ? "" : studentId.trim();
                if (normalizedStudentId.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "studentId is required");
                }

                if (!normalizedStudentIds.contains(normalizedStudentId)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Student is not enrolled in this class");
                }

                AttendanceEntry existing = attendanceEntryRepository
                                .findTopByClassIdAndDateAndStudentId(classId, date, normalizedStudentId);

                AttendanceEntry entry = existing == null ? new AttendanceEntry() : existing;
                entry.setClassId(classId);
                entry.setDate(date);
                entry.setStudentId(normalizedStudentId);
                entry.setStatus(status);
                entry.setUpdatedAt(Instant.now());

                return attendanceEntryRepository.save(entry);
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
        private final AttendanceEntryRepository attendanceEntryRepository;
        private final AssignmentRepository assignmentRepository;
        private final AssignmentSubmissionRepository assignmentSubmissionRepository;
        private final LessonPlanRepository lessonPlanRepository;

        public ClassController(ClassRepository classRepository, UserRepository userRepository,
                        AttendanceEntryRepository attendanceEntryRepository,
                        AssignmentRepository assignmentRepository,
                        AssignmentSubmissionRepository assignmentSubmissionRepository,
                        LessonPlanRepository lessonPlanRepository) {
                this.userRepository = userRepository;
                this.classRepository = classRepository;
                this.attendanceEntryRepository = attendanceEntryRepository;
                this.assignmentRepository = assignmentRepository;
                this.assignmentSubmissionRepository = assignmentSubmissionRepository;
                this.lessonPlanRepository = lessonPlanRepository;
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

        @DeleteMapping("/erase")
        public ResponseEntity<?> eraseClasses(@RequestBody EraseClassesRequest req) {
                if (req == null || isBlank(req.getTeacherId())) {
                        return ResponseEntity.badRequest().body("teacherId is required");
                }

                List<String> normalizedClassIds = req.getClassIds() == null
                                ? Collections.emptyList()
                                : req.getClassIds().stream()
                                                .filter(Objects::nonNull)
                                                .map(String::trim)
                                                .filter(id -> !id.isEmpty())
                                                .distinct()
                                                .toList();

                if (normalizedClassIds.isEmpty()) {
                        return ResponseEntity.badRequest().body("classIds is required");
                }

                String teacherId = req.getTeacherId().trim();
                List<Class> targetClasses = classRepository.findAllById(normalizedClassIds);

                if (targetClasses.size() != normalizedClassIds.size()) {
                        Set<String> foundIds = targetClasses.stream()
                                        .map(Class::getId)
                                        .filter(Objects::nonNull)
                                        .collect(Collectors.toSet());

                        List<String> missingIds = normalizedClassIds.stream()
                                        .filter(id -> !foundIds.contains(id))
                                        .toList();

                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of(
                                                        "message", "Some classes were not found",
                                                        "missingClassIds", missingIds));
                }

                List<String> unauthorizedClassIds = targetClasses.stream()
                                .filter(c -> !teacherId.equals(c.getTeacherId()))
                                .map(Class::getId)
                                .filter(Objects::nonNull)
                                .toList();

                if (!unauthorizedClassIds.isEmpty()) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                        .body(Map.of(
                                                        "message", "You can only erase your own classes",
                                                        "unauthorizedClassIds", unauthorizedClassIds));
                }

                for (Class classroom : targetClasses) {
                        String classId = classroom.getId();
                        if (isBlank(classId)) {
                                continue;
                        }

                        List<Assignment> assignments = assignmentRepository.findByClassId(classId);
                        for (Assignment assignment : assignments) {
                                if (assignment.getId() == null || assignment.getId().isBlank()) {
                                        continue;
                                }
                                assignmentSubmissionRepository.deleteByAssignmentId(assignment.getId());
                        }

                        assignmentRepository.deleteByClassId(classId);
                        attendanceEntryRepository.deleteByClassId(classId);
                        lessonPlanRepository.deleteByClassId(classId);
                        classRepository.deleteById(classId);
                }

                return ResponseEntity.ok(Map.of(
                                "message", "Classes erased successfully",
                                "deletedClassIds", normalizedClassIds,
                                "deletedCount", normalizedClassIds.size()));
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

        @DeleteMapping("/{classId}/drop")
        public ResponseEntity<?> dropClassForStudent(@PathVariable String classId,
                        @RequestBody(required = false) AddStudentRequest req) {
                AddStudentRequest safeReq = req != null ? req : new AddStudentRequest();
                safeReq.setClassId(classId);

                final User student;
                try {
                        student = resolveStudentFromRequest(safeReq);
                } catch (RuntimeException error) {
                        return ResponseEntity.badRequest().body(error.getMessage());
                }

                if (!isStudentRole(student.getRole())) {
                        return ResponseEntity.badRequest().body("User is not a student");
                }

                Class c = findClassOrThrow(classId);
                boolean removed = getOrInitStudentIds(c).remove(student.getId());

                if (!removed) {
                        return ResponseEntity.badRequest().body("Student is not enrolled in this class");
                }

                classRepository.save(c);
                return ResponseEntity.ok(Map.of("message", "Dropped class successfully"));
        }

        // API endpod to receive info about a specific class based on classId
        @GetMapping("/{classId}")
        public ClassResponse getClass(@PathVariable String classId) {
                Class c = findClassOrThrow(classId);

                return new ClassResponse(c);
        }

        @GetMapping("/{classId}/resources")
        public List<Class.ResourceLink> getClassResources(@PathVariable String classId) {
                Class c = findClassOrThrow(classId);
                return getOrInitResources(c);
        }

        @GetMapping("/{classId}/modules")
        public List<Class.ModuleEntry> getClassModules(@PathVariable String classId) {
                Class c = findClassOrThrow(classId);
                return getOrInitModules(c).stream()
                                .sorted(Comparator.comparing(
                                                module -> module.getOrder() == null ? Integer.MAX_VALUE : module.getOrder()))
                                .toList();
        }

        @PostMapping("/{classId}/modules")
        public ClassResponse addClassModule(@PathVariable String classId, @RequestBody Map<String, String> req) {
                Class c = findClassOrThrow(classId);

                String title = req != null && req.get("title") != null ? req.get("title").trim() : "";
                if (title.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
                }

                List<Class.ModuleEntry> modules = getOrInitModules(c);
                int nextOrder = modules.stream()
                                .map(Class.ModuleEntry::getOrder)
                                .filter(Objects::nonNull)
                                .max(Integer::compareTo)
                                .orElse(0) + 1;

                Class.ModuleEntry module = new Class.ModuleEntry();
                module.setId(UUID.randomUUID().toString());
                module.setTitle(title);
                module.setOrder(nextOrder);

                modules.add(module);
                c.setModules(modules);
                classRepository.save(c);

                return new ClassResponse(c);
        }

        @DeleteMapping("/{classId}/modules/{moduleId}")
        public ClassResponse deleteClassModule(@PathVariable String classId, @PathVariable String moduleId) {
                Class c = findClassOrThrow(classId);
                List<Class.ModuleEntry> modules = getOrInitModules(c);

                String normalizedModuleId = moduleId == null ? "" : moduleId.trim();
                boolean removed = modules.removeIf(module ->
                                module != null
                                                && module.getId() != null
                                                && module.getId().trim().equals(normalizedModuleId));

                if (!removed) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
                }

                int orderCounter = 1;
                for (Class.ModuleEntry module : modules) {
                        if (module == null) {
                                continue;
                        }
                        module.setOrder(orderCounter++);
                }

                c.setModules(modules);
                classRepository.save(c);
                return new ClassResponse(c);
        }

        @GetMapping("/{classId}/announcements")
        public List<Class.AnnouncementEntry> getClassAnnouncements(@PathVariable String classId) {
                Class c = findClassOrThrow(classId);
                return getOrInitAnnouncements(c).stream()
                                .sorted(Comparator.comparing(
                                                Class.AnnouncementEntry::getUpdatedAt,
                                                Comparator.nullsLast(Comparator.naturalOrder()))
                                                .reversed())
                                .toList();
        }

        @GetMapping("/announcements/my")
        public List<Map<String, Object>> getTeacherAnnouncements(@RequestParam String teacherId) {
                if (teacherId == null || teacherId.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teacherId is required");
                }

                List<Class> classes = classRepository.findByTeacherId(teacherId.trim());
                Map<String, Map<String, Object>> dedupById = new LinkedHashMap<>();

                for (Class c : classes) {
                        List<Class.AnnouncementEntry> announcements = getOrInitAnnouncements(c);
                        for (Class.AnnouncementEntry entry : announcements) {
                                if (entry == null || entry.getId() == null || entry.getId().isBlank()) {
                                        continue;
                                }

                                String key = entry.getId().trim();
                                Map<String, Object> current = dedupById.get(key);
                                Instant currentUpdatedAt = current != null ? (Instant) current.get("updatedAt") : null;
                                Instant nextUpdatedAt = entry.getUpdatedAt();

                                boolean shouldReplace = current == null
                                                || (nextUpdatedAt != null
                                                                && (currentUpdatedAt == null
                                                                                || nextUpdatedAt.isAfter(currentUpdatedAt)));

                                if (shouldReplace) {
                                        dedupById.put(key, announcementToMap(c, entry));
                                }
                        }
                }

                return dedupById.values().stream()
                                .sorted((left, right) -> {
                                        Instant leftValue = (Instant) left.get("updatedAt");
                                        Instant rightValue = (Instant) right.get("updatedAt");
                                        if (leftValue == null && rightValue == null) {
                                                return 0;
                                        }
                                        if (leftValue == null) {
                                                return 1;
                                        }
                                        if (rightValue == null) {
                                                return -1;
                                        }
                                        return rightValue.compareTo(leftValue);
                                })
                                .toList();
        }

        @PostMapping("/announcements")
        public Map<String, Object> createAnnouncement(@RequestBody Map<String, Object> req) {
                String teacherId = req != null && req.get("teacherId") != null
                                ? req.get("teacherId").toString().trim()
                                : "";
                String targetClassId = req != null && req.get("targetClassId") != null
                                ? req.get("targetClassId").toString().trim()
                                : "all";
                String title = req != null && req.get("title") != null ? req.get("title").toString().trim() : "";
                String content = req != null && req.get("content") != null
                                ? req.get("content").toString().trim()
                                : "";
                String status = normalizeAnnouncementStatusOrThrow(
                                req != null && req.get("status") != null ? req.get("status").toString() : null);
                boolean pinned = req != null && req.get("pinned") != null
                                ? Boolean.parseBoolean(req.get("pinned").toString())
                                : false;

                if (teacherId.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teacherId is required");
                }

                if (title.isEmpty() || content.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title and content are required");
                }

                Instant now = Instant.now();
                String announcementId = UUID.randomUUID().toString();

                if (targetClassId.equalsIgnoreCase("all")) {
                        List<Class> classes = classRepository.findByTeacherId(teacherId);
                        if (classes.isEmpty()) {
                                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "No classes found for this teacher");
                        }

                        for (Class c : classes) {
                                Class.AnnouncementEntry announcement = new Class.AnnouncementEntry();
                                announcement.setId(announcementId);
                                announcement.setTitle(title);
                                announcement.setContent(content);
                                announcement.setStatus(status);
                                announcement.setTarget("All Classes");
                                announcement.setPinned(pinned);
                                announcement.setCreatedAt(now);
                                announcement.setUpdatedAt(now);

                                List<Class.AnnouncementEntry> announcements = getOrInitAnnouncements(c);
                                announcements.add(0, announcement);
                                c.setAnnouncements(announcements);
                        }

                        classRepository.saveAll(classes);

                        Map<String, Object> response = new HashMap<>();
                        response.put("id", announcementId);
                        response.put("status", status);
                        response.put("target", "All Classes");
                        response.put("createdAt", now);
                        return response;
                }

                Class c = findClassOrThrow(targetClassId);
                if (!teacherId.equals(c.getTeacherId())) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "You are not allowed to create announcements for this class");
                }

                Class.AnnouncementEntry announcement = new Class.AnnouncementEntry();
                announcement.setId(announcementId);
                announcement.setTitle(title);
                announcement.setContent(content);
                announcement.setStatus(status);
                announcement.setTarget(c.getName());
                announcement.setPinned(pinned);
                announcement.setCreatedAt(now);
                announcement.setUpdatedAt(now);

                List<Class.AnnouncementEntry> announcements = getOrInitAnnouncements(c);
                announcements.add(0, announcement);
                c.setAnnouncements(announcements);
                classRepository.save(c);

                Map<String, Object> response = new HashMap<>();
                response.put("id", announcementId);
                response.put("status", status);
                response.put("target", c.getName());
                response.put("createdAt", now);
                return response;
        }

        @PutMapping("/announcements/{announcementId}")
        public Map<String, Object> updateAnnouncement(
                        @PathVariable String announcementId,
                        @RequestBody Map<String, Object> req) {
                String normalizedAnnouncementId = announcementId == null ? "" : announcementId.trim();
                if (normalizedAnnouncementId.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "announcementId is required");
                }

                String teacherId = req != null && req.get("teacherId") != null
                                ? req.get("teacherId").toString().trim()
                                : "";
                String title = req != null && req.get("title") != null ? req.get("title").toString().trim() : "";
                String content = req != null && req.get("content") != null
                                ? req.get("content").toString().trim()
                                : "";
                String status = normalizeAnnouncementStatusOrThrow(
                                req != null && req.get("status") != null ? req.get("status").toString() : null);
                boolean pinned = req != null && req.get("pinned") != null
                                ? Boolean.parseBoolean(req.get("pinned").toString())
                                : false;

                if (teacherId.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teacherId is required");
                }

                if (title.isEmpty() || content.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title and content are required");
                }

                List<Class> classes = classRepository.findByTeacherId(teacherId);
                if (classes.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No classes found for this teacher");
                }

                List<Class> touchedClasses = new ArrayList<>();
                Class ownerClass = null;
                Class.AnnouncementEntry updatedEntry = null;
                Instant now = Instant.now();

                for (Class c : classes) {
                        List<Class.AnnouncementEntry> announcements = getOrInitAnnouncements(c);
                        boolean changed = false;

                        for (Class.AnnouncementEntry entry : announcements) {
                                if (entry == null || entry.getId() == null) {
                                        continue;
                                }

                                if (!entry.getId().trim().equals(normalizedAnnouncementId)) {
                                        continue;
                                }

                                entry.setTitle(title);
                                entry.setContent(content);
                                entry.setStatus(status);
                                entry.setPinned(pinned);
                                entry.setUpdatedAt(now);
                                changed = true;

                                if (ownerClass == null) {
                                        ownerClass = c;
                                        updatedEntry = entry;
                                }
                        }

                        if (changed) {
                                c.setAnnouncements(announcements);
                                touchedClasses.add(c);
                        }
                }

                if (touchedClasses.isEmpty() || ownerClass == null || updatedEntry == null) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found");
                }

                classRepository.saveAll(touchedClasses);
                return announcementToMap(ownerClass, updatedEntry);
        }

        @DeleteMapping("/announcements/{announcementId}")
        public ResponseEntity<?> deleteAnnouncement(
                        @PathVariable String announcementId,
                        @RequestParam String teacherId) {
                String normalizedAnnouncementId = announcementId == null ? "" : announcementId.trim();
                String normalizedTeacherId = teacherId == null ? "" : teacherId.trim();

                if (normalizedAnnouncementId.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "announcementId is required");
                }

                if (normalizedTeacherId.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teacherId is required");
                }

                List<Class> classes = classRepository.findByTeacherId(normalizedTeacherId);
                if (classes.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No classes found for this teacher");
                }

                List<Class> touchedClasses = new ArrayList<>();

                for (Class c : classes) {
                        List<Class.AnnouncementEntry> announcements = getOrInitAnnouncements(c);
                        boolean removed = announcements.removeIf(entry ->
                                        entry != null
                                                        && entry.getId() != null
                                                        && entry.getId().trim().equals(normalizedAnnouncementId));
                        if (removed) {
                                c.setAnnouncements(announcements);
                                touchedClasses.add(c);
                        }
                }

                if (touchedClasses.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found");
                }

                classRepository.saveAll(touchedClasses);
                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{classId}/resources")
        public ClassResponse addClassResource(@PathVariable String classId, @RequestBody Map<String, String> req) {
                Class c = findClassOrThrow(classId);

                String title = req != null && req.get("title") != null ? req.get("title").trim() : "";
                String url = req != null && req.get("url") != null ? req.get("url").trim() : "";

                if (title.isEmpty() || url.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title and url are required");
                }

                Class.ResourceLink resource = new Class.ResourceLink();
                resource.setId(UUID.randomUUID().toString());
                resource.setTitle(title);
                resource.setUrl(url);
                resource.setCreatedAt(Instant.now());

                List<Class.ResourceLink> resources = getOrInitResources(c);
                resources.add(resource);
                c.setResources(resources);
                classRepository.save(c);

                return new ClassResponse(c);
        }

        @DeleteMapping("/{classId}/resources/{resourceId}")
        public ClassResponse deleteClassResource(@PathVariable String classId, @PathVariable String resourceId) {
                Class c = findClassOrThrow(classId);

                List<Class.ResourceLink> resources = getOrInitResources(c);
                boolean removed = resources.removeIf(resource ->
                        resource != null
                                && resource.getId() != null
                                && resource.getId().trim().equals(resourceId.trim()));

                if (!removed) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
                }

                c.setResources(resources);
                classRepository.save(c);

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

        @GetMapping("/{classId}/attendance")
        public List<AttendanceEntryResponse> getClassAttendanceByDate(
                        @PathVariable String classId,
                        @RequestParam String date) {
                findClassOrThrow(classId);
                String normalizedDate = normalizeAttendanceDateOrThrow(date);

                return attendanceEntryRepository.findByClassIdAndDate(classId, normalizedDate).stream()
                                .map(AttendanceEntryResponse::new)
                                .toList();
        }

        @GetMapping("/{classId}/attendance/history")
        public List<AttendanceEntryResponse> getClassAttendanceHistory(@PathVariable String classId) {
                findClassOrThrow(classId);

                return attendanceEntryRepository.findByClassId(classId).stream()
                                .sorted(
                                                Comparator.comparing(AttendanceEntry::getDate).reversed()
                                                                .thenComparing(AttendanceEntry::getStudentId,
                                                                                Comparator.nullsLast(String::compareTo)))
                                .map(AttendanceEntryResponse::new)
                                .toList();
        }

        @PostMapping("/{classId}/attendance")
        public AttendanceEntryResponse upsertClassAttendance(
                        @PathVariable String classId,
                        @RequestBody AttendanceStatusUpdateRequest req) {
                Class c = findClassOrThrow(classId);
                String normalizedDate = normalizeAttendanceDateOrThrow(req != null ? req.getDate() : null);
                String normalizedStatus = normalizeAttendanceStatusOrThrow(req != null ? req.getStatus() : null);
                List<String> normalizedStudentIds = normalizeStudentIds(getOrInitStudentIds(c));

                AttendanceEntry saved = upsertAttendanceEntry(
                                classId,
                                normalizedStudentIds,
                                normalizedDate,
                                req != null ? req.getStudentId() : null,
                                normalizedStatus);

                return new AttendanceEntryResponse(saved);
        }

        @PostMapping("/{classId}/attendance/batch")
        public List<AttendanceEntryResponse> upsertClassAttendanceBatch(
                        @PathVariable String classId,
                        @RequestBody AttendanceBatchUpdateRequest req) {
                Class c = findClassOrThrow(classId);
                String normalizedDate = normalizeAttendanceDateOrThrow(req != null ? req.getDate() : null);
                List<AttendanceStatusUpdateRequest> records = req != null && req.getRecords() != null
                                ? req.getRecords()
                                : Collections.emptyList();

                if (records.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "records is required");
                }

                List<String> normalizedStudentIds = normalizeStudentIds(getOrInitStudentIds(c));
                List<AttendanceEntryResponse> responses = new ArrayList<>();

                for (AttendanceStatusUpdateRequest item : records) {
                        String normalizedStatus = normalizeAttendanceStatusOrThrow(
                                        item != null ? item.getStatus() : null);

                        AttendanceEntry saved = upsertAttendanceEntry(
                                        classId,
                                        normalizedStudentIds,
                                        normalizedDate,
                                        item != null ? item.getStudentId() : null,
                                        normalizedStatus);

                        responses.add(new AttendanceEntryResponse(saved));
                }

                return responses;
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

        @GetMapping("/{classId}/assignments/{assignmentId}")
        public AssignmentListItemResponse getAssignmentById(
                        @PathVariable String classId,
                        @PathVariable String assignmentId) {
                findClassOrThrow(classId);

                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Assignment not found"));

                if (!classId.equals(assignment.getClassId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Assignment does not belong to this class");
                }

                long submittedCount = assignmentSubmissionRepository.countByAssignmentId(assignment.getId());
                return new AssignmentListItemResponse(assignment, submittedCount);
        }

        @PutMapping("/{classId}/assignments/{assignmentId}")
        public AssignmentListItemResponse updateAssignment(
                        @PathVariable String classId,
                        @PathVariable String assignmentId,
                        @RequestBody CreateAssignmentRequest req) {
                findClassOrThrow(classId);

                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Assignment not found"));

                if (!classId.equals(assignment.getClassId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Assignment does not belong to this class");
                }

                if (req == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Request body is required");
                }

                String title = req.getTitle() == null ? "" : req.getTitle().trim();
                if (title.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "title is required");
                }

                String description = req.getDescription() == null ? "" : req.getDescription().trim();
                if (description.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "description is required");
                }

                if (isBlank(req.getDeadline())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "deadline is required");
                }

                int maxScore = req.getMaxScore() > 0 ? req.getMaxScore() : 100;

                assignment.setTitle(title);
                assignment.setDescription(description);
                assignment.setDeadline(LocalDateTime.parse(req.getDeadline()).atZone(ZoneId.systemDefault()).toInstant());
                assignment.setMaxScore(maxScore);

                Assignment saved = assignmentRepository.save(assignment);
                long submittedCount = assignmentSubmissionRepository.countByAssignmentId(saved.getId());
                return new AssignmentListItemResponse(saved, submittedCount);
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

        @PostMapping("/{classId}/assignments/{assignmentId}/submit")
        public ResponseEntity<?> submitAssignment(
                        @PathVariable String classId,
                        @PathVariable String assignmentId,
                        @RequestBody SubmitAssignmentRequest req) {
                Class c = findClassOrThrow(classId);

                Assignment assignment = assignmentRepository.findById(assignmentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Assignment not found"));

                if (!classId.equals(assignment.getClassId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Assignment does not belong to this class");
                }

                if (req == null || isBlank(req.getStudentId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "studentId is required");
                }

                String studentId = req.getStudentId().trim();

                User student = userRepository.findById(studentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Student not found"));

                if (!isStudentRole(student.getRole())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Only students can submit assignments");
                }

                List<String> enrolledStudentIds = normalizeStudentIds(getOrInitStudentIds(c));
                if (!enrolledStudentIds.contains(studentId)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Student is not enrolled in this class");
                }

                Instant submittedAt = Instant.now();
                boolean late = assignment.getDeadline() != null && submittedAt.isAfter(assignment.getDeadline());

                AssignmentSubmission submission = assignmentSubmissionRepository
                                .findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(assignmentId, studentId);

                if (submission == null) {
                        submission = new AssignmentSubmission();
                        submission.setAssignmentId(assignmentId);
                        submission.setStudentId(studentId);
                }

                submission.setSubmittedAt(submittedAt);
                submission.setLate(late);
                submission.setScore(null);
                submission.setFeedback(null);

                AssignmentSubmission savedSubmission = assignmentSubmissionRepository.save(submission);

                return ResponseEntity.ok(Map.of(
                                "id", savedSubmission.getId(),
                                "assignmentId", assignmentId,
                                "classId", classId,
                                "studentId", studentId,
                                "submitted", true,
                                "submittedAt", savedSubmission.getSubmittedAt(),
                                "late", savedSubmission.isLate()));
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