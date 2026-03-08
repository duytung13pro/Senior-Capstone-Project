package com.main.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.Class;


public interface ClassRepository extends MongoRepository<Class, String> {

    // Find all classes owned by a specific teacher
    List<Class> findByTeacherId(String teacherId);

    // Find all classes where a specific student is enrolled
    List<Class> findByStudentIdsContaining(String studentId);
}