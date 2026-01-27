package com.main.backend.controller;

import com.main.backend.dto.UserProfileResponse;
import com.main.backend.model.User;
import com.main.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

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
}
