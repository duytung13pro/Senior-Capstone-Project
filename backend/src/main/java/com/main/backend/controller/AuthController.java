package com.main.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> register(@RequestBody User loginRequest) {
    
        // Check for duplicated username
        if (userRepository.existsByEmail(loginRequest.getEmail())) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Email already registered"));
        }
    
        User user = new User();
        user.setEmail(loginRequest.getEmail());
        user.setPassword(loginRequest.getPassword());
    
        userRepository.save(user);
    
        return ResponseEntity.ok(user);
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
