package com.main.backend.controller;

import com.main.backend.dto.AddStudentRequest;
import com.main.backend.dto.AllStudentResponse;
import com.main.backend.dto.StudentEnrolledClassResponse;
import com.main.backend.dto.UpdateProfileRequest;
import com.main.backend.dto.UserProfileResponse;
import com.main.backend.model.Role;
import com.main.backend.model.User;
import com.main.backend.repository.AssignmentRepository;
import com.main.backend.repository.ClassRepository;
import com.main.backend.repository.UserRepository;
import com.main.backend.model.Class;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users") 
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final AssignmentRepository assignmentRepository;

    public UserController(ClassRepository classRepository, UserRepository userRepository, AssignmentRepository assignmentRepository) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @GetMapping("/{id}")
    public UserProfileResponse getUserProfile(@PathVariable String id) {
        User user = userRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserProfileResponse(user);
    }
    @PatchMapping("/{id}")
    public UserProfileResponse updateUserProfile(@PathVariable String id,@RequestBody UpdateProfileRequest req) 
    {
        User user = userRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());

        userRepository.save(user);

        return new UserProfileResponse(user);
    }

    @PostMapping("/{userId}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable String userId,@RequestParam("file") MultipartFile file) 
    {
    try {
        // 1. Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Ensure upload directory exists
        Path uploadDir = Paths.get("uploads/avatars");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // 3. Generate safe filename
        String filename = userId + "_" + file.getOriginalFilename();
        Path filePath = uploadDir.resolve(filename);

        // 4. Save file to disk
        Files.write(filePath, file.getBytes());

        // 5. Save avatar path to DB
        user.setAvatarUrl("/uploads/avatars/" + filename);
        userRepository.save(user);

        // 6. Return updated profile
        return ResponseEntity.ok(new UserProfileResponse(user));

    } 
    catch (IOException e) 
    {
        // File system error
        return ResponseEntity
                .status(500)
                .body("Failed to save avatar file");

    } 
    catch (RuntimeException e) 
    {
        // User not found or other logical error
        return ResponseEntity
                .status(400)
                .body(e.getMessage());
    }
}    
    @GetMapping("/students")
    public List<AllStudentResponse> getAllStudents() {
        return userRepository.findAll().stream()
            .filter(user -> user.getRole() == Role.STUDENT)
            .map(user -> new AllStudentResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
            ))
            .toList();
    }

    // Endpoint to receive a list of classId that students are enrolled in
    @GetMapping("/{id}/enrolled-course")
    public List<String> getUserEnrolledClass(@PathVariable String id) {
        List<String> enrolledClassId = classRepository.findAll().stream().filter(c -> c.getStudentIds().contains(id))
                                        .map(c -> c.getId()).toList();
        return enrolledClassId;
    }

    // API endpoint when  a student enroll to class
    @PostMapping("/{studentid}/{classId}/enroll")
    public ResponseEntity<?> enrollStudents(@PathVariable String studentId, @PathVariable String classId) {
        // Get the class
        
        Class c = classRepository.findById(classId).orElseThrow(() -> new RuntimeException("Class not found"));
        
        // Check if student is not enroll yet
        c.getStudentIds().add(studentId);
            classRepository.save(c);
            

        return ResponseEntity.ok().build();
    }



}
