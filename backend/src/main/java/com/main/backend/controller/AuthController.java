package com.main.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.main.backend.dto.LoginRequest;
import com.main.backend.dto.LoginResponse;
import com.main.backend.dto.RegisterRequest;
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
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        System.out.println("ROLE RECEIVED: " + req.getRole());

        String email = req.getEmail();

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setPhone(req.getPhone());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());
        user.setRole(req.getRole());

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true));
    }

    // Where request for logging in is received
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {

        String email = req.getEmail();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !user.getPassword().equals(req.getPassword())) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid credentials"));
        }

        LoginResponse response = new LoginResponse(
            user.getId(),
            user.getEmail(),
            user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}