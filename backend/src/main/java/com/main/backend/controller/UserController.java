package com.main.backend.controller;

import com.main.backend.dto.AllStudentResponse;
import com.main.backend.dto.UpdateProfileRequest;
import com.main.backend.dto.UserProfileResponse;
import com.main.backend.model.User;
import com.main.backend.repository.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(originPatterns = { "http://localhost:*", "http://127.0.0.1:*" })
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private boolean isStudentRole(String role) {
        return role != null && role.equalsIgnoreCase("student");
    }

    @GetMapping("/{id:[a-fA-F0-9]{24}}")
    public UserProfileResponse getUserProfile(@PathVariable String id) {
        User user = userRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserProfileResponse(user);
    }

    @PatchMapping("/{id}")
    public UserProfileResponse updateUserProfile(@PathVariable String id, @RequestBody UpdateProfileRequest req) {
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
    public ResponseEntity<?> uploadAvatar(@PathVariable String userId, @RequestParam("file") MultipartFile file) {
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

        } catch (IOException e) {
            // File system error
            return ResponseEntity
                    .status(500)
                    .body("Failed to save avatar file");

        } catch (RuntimeException e) {
            // User not found or other logical error
            return ResponseEntity
                    .status(400)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/students")
    public List<AllStudentResponse> getAllStudents() {
        return userRepository.findAll().stream()
                .flatMap(user -> {
                    try {
                        if (!isStudentRole(user.getRole())) {
                            return Stream.empty();
                        }

                        return Stream.of(new AllStudentResponse(
                                user.getId() == null ? "" : user.getId(),
                                user.getFirstName() == null ? "" : user.getFirstName(),
                                user.getLastName() == null ? "" : user.getLastName(),
                                user.getEmail() == null ? "" : user.getEmail()));
                    } catch (Exception ignored) {
                        return Stream.empty();
                    }
                })
                .filter(student -> !student.id().isBlank())
                .toList();
    }

}