package com.main.backend.controller;
import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.SubmitAssignmentRequest;
import com.main.backend.model.Assignment;
import com.main.backend.model.Class;
import com.main.backend.model.Role;
import com.main.backend.model.Submission;
import com.main.backend.model.User;
import com.main.backend.repository.AssignmentRepository;
import com.main.backend.repository.ClassRepository;
import com.main.backend.repository.SubmissionRepository;
import com.main.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/submission")
@CrossOrigin(origins = "http://localhost:3000")
public class SubmissionController {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    public SubmissionController(ClassRepository classRepository, UserRepository userRepository, AssignmentRepository assignmentRepository, SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
    }    

    // Submit a submission for an assignment
    // if submission already exist, update its content
    @PostMapping("/{assignmentId}/submit")
    public ResponseEntity<?> submit(@PathVariable String assignmentId, @RequestBody SubmitAssignmentRequest req) 
    {
        // Assignment not exists yet
        if(!submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, req.getStudentId())){
            Submission submission = new Submission(assignmentId, req.getStudentId(), req.getContent(), Instant.now());
            submissionRepository.save(submission);
            return ResponseEntity.ok().build();
        }
        // Already exists
        else{
            Submission existingSubmission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, req.getStudentId());
            existingSubmission.setContent(req.getContent());
            submissionRepository.save(existingSubmission);
            return ResponseEntity.ok().build();

        }
    }

}
     // Create an assignment for class {classId}
     //@PutMapping("/{assignmentId}/missing-submission")
     //public String getMissingSubmission(@PathVariable String assignmentId) 
     //{
     //   Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow(() -> new RuntimeException("Assignment not found"));
     //   Class c = classRepository.findById(assignment.getClassId()).orElseThrow(() -> new RuntimeException("Class not found"));
     //   // Get all student from class
     //   List<String> stuentIds = c.getStudentIds();
     //   // get student who have submitted
//
     //   // get student who have not submitted
     //   assignment.setDetail(RequestBody.getDetail());
     //   assignmentRepository.save(assignment);
     //   return assignment.getDetail();
//
     //}

