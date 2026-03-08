package com.main.backend.repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.Assignment;


public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    List<Assignment> findByClassId(String classId);
    Optional<Assignment> findFirstByClassIdAndTitle(String classId, String title);

}