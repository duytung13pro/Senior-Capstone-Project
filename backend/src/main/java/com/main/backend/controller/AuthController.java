package com.main.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.main.backend.model.User;
import com.main.backend.repository.UserRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Where request for registering an account is received
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userRepository.save(user);
    }
    // Where request for logging in is received
    @PostMapping("/login")
    public User login(@RequestBody User loginRequest) {
        return userRepository
                .findByEmail(loginRequest.getEmail())
                .filter(user -> user.getPassword().equals(loginRequest.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }
        
}
