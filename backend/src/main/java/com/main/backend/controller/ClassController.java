package com.main.backend.controller;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.main.backend.dto.AddStudentRequest;
import com.main.backend.dto.AllStudentResponse;
import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.CreateAssignmentRequest;
import com.main.backend.dto.CreateAssignmentRespond;
import com.main.backend.dto.CreateClassRequest;
import com.main.backend.model.Assignment;
import com.main.backend.model.Class;
import com.main.backend.model.Role;
import com.main.backend.model.User;
import com.main.backend.repository.AssignmentRepository;
import com.main.backend.repository.ClassRepository;
import com.main.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "http://localhost:3000")
public class ClassController {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;

    public ClassController(ClassRepository classRepository, UserRepository userRepository, AssignmentRepository assignmentRepository) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.assignmentRepository = assignmentRepository;
    }    
    @PostMapping("/create")
    public ResponseEntity<?> createClass(@RequestBody CreateClassRequest req) {

        Class c = new Class();
        c.setName(req.getName());
        c.setLevel(req.getLevel());
        c.setTime(req.getTime());
        c.setDays(req.getDays());
        c.setDescription(req.getDescription());
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

    // API endpoint when adding a student to class
    @PostMapping("/add-student")
    public ResponseEntity<?> addStudentToClass(@RequestBody AddStudentRequest req) {
        // Get the class
        
        Class c = classRepository
            .findById(req.getClassId())
            .orElseThrow(() -> new RuntimeException("Class not found"));
        
        // Get the student
        User student = userRepository
            .findByEmail(req.getStudentEmail())
            .orElseThrow(() -> new RuntimeException("Student not found"));

        // Only users with role "STUDENT" are allowed to enroll
        if (student.getRole() != Role.STUDENT) {
            return ResponseEntity.badRequest()
                .body("User is not a student");
        }
        
        // Check if student is not enroll yet
        if (!c.getStudentIds().contains(student.getId())) 
            {
            // Add student to class then save
            c.getStudentIds().add(student.getId());
            classRepository.save(c);
            }

        return ResponseEntity.ok().build();
    }

    // API endpoint to remove a student from a class
    @PostMapping("/remove-student")
    public ResponseEntity<?> removeStudentFromClass(@RequestBody AddStudentRequest req) {

        // Get the class
        Class c = classRepository
            .findById(req.getClassId())
            .orElseThrow(() -> new RuntimeException("Class not found"));

        // Get the student
        User student = userRepository
            .findByEmail(req.getStudentEmail())
            .orElseThrow(() -> new RuntimeException("Student not found"));

        // Only students can be removed
        if (student.getRole() != Role.STUDENT) {
            return ResponseEntity.badRequest()
                .body("User is not a student");
        }

        // Remove student if enrolled
        boolean removed = c.getStudentIds().remove(student.getId());

        if (!removed) {
            return ResponseEntity.badRequest()
                .body("Student is not enrolled in this class");
        }

        classRepository.save(c);

        return ResponseEntity.ok().build();
    }

    // API endpod to receive info about a specific class based on classId
    @GetMapping("/{classId}")
    public ClassResponse getClass(@PathVariable String classId) {
    Class c = classRepository
        .findById(classId)
        .orElseThrow(() -> new RuntimeException("Class not found"));

    return new ClassResponse(c);
}

    private List<Class> getTeacherClasses(String teacherId) 
    {
        return classRepository.findByTeacherId(teacherId);
    }
    @GetMapping("/student-count")
    public int getStudentCount(@RequestParam String teacherId) 
    {        
    return getTeacherClasses(teacherId)
        .stream()
        .flatMap(c -> c.getStudentIds().stream())
        .collect(Collectors.toSet()) // remove duplicates
        .size();
    }

// Find students who have not enrolled in classs {classId} yet
@GetMapping("/{classId}/not-in-class-students")
    public List<AllStudentResponse> getStudentNotInClass(@PathVariable String classId) 
        {
            // Find class
            Class c = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
            
            // Find students
            List<String> enrolledStudentIds = c.getStudentIds();

            return userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.STUDENT)
                .filter(user -> !enrolledStudentIds.contains(user.getId()))
                .map(user -> new AllStudentResponse(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getEmail()
                ))
                .toList();
        }
    @GetMapping("/{classId}/in-class-students")
    public List<AllStudentResponse> getStudentsInClass(@PathVariable String classId) 
    {
        // Get the class
        Class c = classRepository.findById(classId)
            .orElseThrow(() -> new RuntimeException("Class not found"));

        // 2. Get enrolled student IDs
        List<String> studentIds = c.getStudentIds();

        // 3. Fetch users by IDs and map to response
        return userRepository.findAllById(studentIds).stream()
            .filter(user -> user.getRole() == Role.STUDENT)
            .map(user -> new AllStudentResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
            ))
            .toList();
    }

    // Create an assignment for class {classId}
    @PostMapping("/{classId}/create-assignment")
    public ResponseEntity<CreateAssignmentRespond> createAssignment(@PathVariable String classId,  @RequestBody CreateAssignmentRequest req) 
    {
        Assignment assignment = new Assignment();
        assignment.setClassId(classId);
        assignment.setTitle(req.getTitle());
        assignment.setDescription(req.getDescription());
        assignment.setDeadline(LocalDateTime.parse(req.getDeadline()).atZone(ZoneId.systemDefault())
        .toInstant()
);

        assignment.setMaxScore(req.getMaxScore());

        assignmentRepository.save(assignment);

        // Get the class
        // 2. Get enrolled student IDs
        return ResponseEntity.ok(new CreateAssignmentRespond(assignment));


    }    // Create an assignment for class {classId}
    @GetMapping("/{classId}/assignments")
    public List<Assignment> getAssignments(@PathVariable String classId) 
    {
        return assignmentRepository.findByClassId(classId);

    }

    // Get all classes (student course catalog)
    @GetMapping("/all")
    public List<ClassResponse> getAllClasses() 
    {
        return classRepository
            .findAll()
            .stream()
            .map(ClassResponse::new)
            .collect(Collectors.toList());
    }

}
