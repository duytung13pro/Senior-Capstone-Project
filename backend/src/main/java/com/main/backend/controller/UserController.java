package com.main.backend.controller;

import com.main.backend.dto.UpdateProfileRequest;
import com.main.backend.dto.UserProfileResponse;
import com.main.backend.model.User;
import com.main.backend.repository.UserRepository;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users") 
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
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


}
