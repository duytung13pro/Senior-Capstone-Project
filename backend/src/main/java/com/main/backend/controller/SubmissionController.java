package com.main.backend.controller;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.SubmissionDetailResponse;
import com.main.backend.dto.SubmissionStateResponse;
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
    // fetch content of a submission
    @GetMapping("/get-detail/{assignmentId}/{userId}")
    public SubmissionDetailResponse submit(@PathVariable String assignmentId,@PathVariable String userId) 
    {
        // Submission not exists yet
        if(!submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, userId)){
            SubmissionDetailResponse result = new SubmissionDetailResponse("");
            return result;
        }
        // Already exists
        else{
            Submission existingSubmission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, userId);
            SubmissionDetailResponse result = new SubmissionDetailResponse(existingSubmission.getContent());
            return result;

        }
    }
@GetMapping("/{assignmentId}/submission-state")
public List<SubmissionStateResponse> getSubmisisonState(@PathVariable String assignmentId)
{
    Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Assignment not found"));

    Class c = classRepository.findById(assignment.getClassId())
            .orElseThrow(() -> new RuntimeException("Class not found"));

    // all submissions for this assignment
    List<Submission> submissions = submissionRepository.findByAssignmentId(assignmentId);

    // IMPORTANT: map studentId -> submission
    Map<String, Submission> submissionMap =
            submissions.stream()
                    .collect(Collectors.toMap(Submission::getStudentId, s -> s));

    List<User> students = userRepository.findByIdIn(c.getStudentIds());

    return students.stream().map(s -> {

        Submission sub = submissionMap.get(s.getId());

        return new SubmissionStateResponse(
                sub != null ? sub.getId() : null,
                s.getId(),
                s.getFirstName() + " " + s.getLastName(),
                s.getEmail(),
                sub != null
        );

    }).toList();
}
}

