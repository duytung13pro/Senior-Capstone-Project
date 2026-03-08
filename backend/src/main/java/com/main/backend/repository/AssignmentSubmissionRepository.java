package com.main.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.AssignmentSubmission;

public interface AssignmentSubmissionRepository extends MongoRepository<AssignmentSubmission, String> {
    long countByAssignmentId(String assignmentId);
    List<AssignmentSubmission> findByAssignmentId(String assignmentId);
    AssignmentSubmission findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(String assignmentId, String studentId);
}
