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
public class AssignmentController {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;

    public AssignmentController(ClassRepository classRepository, UserRepository userRepository, AssignmentRepository assignmentRepository) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.assignmentRepository = assignmentRepository;
    }    

    // API endpoint to View detail of an appointment
}
