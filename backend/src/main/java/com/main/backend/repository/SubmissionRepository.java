package com.main.backend.repository;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.main.backend.model.Submission;


public interface SubmissionRepository extends MongoRepository<Submission, String> {
    List<Submission> findByAssignmentId(String assignmentId);

}
