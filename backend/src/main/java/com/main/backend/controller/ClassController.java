package com.main.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.main.backend.dto.AddStudentRequest;
import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.CreateClassRequest;
import com.main.backend.model.Class;
import com.main.backend.model.Role;
import com.main.backend.model.User;
import com.main.backend.repository.ClassRepository;
import com.main.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "http://localhost:3000")
public class ClassController {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    public ClassController(ClassRepository classRepository, UserRepository userRepository) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
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
    // API endpod to receive info about a specific class based on classId
    @GetMapping("/{classId}")
    public ClassResponse getClass(@PathVariable String classId) {
    Class c = classRepository
        .findById(classId)
        .orElseThrow(() -> new RuntimeException("Class not found"));

    return new ClassResponse(c);
}


}
