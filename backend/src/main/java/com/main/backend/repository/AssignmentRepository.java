package com.main.backend.repository;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.Assignment;
import com.main.backend.model.Class;


public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    List<Assignment> findByClassId(String classId);
    Class findClassById(String assignmentId);
}
