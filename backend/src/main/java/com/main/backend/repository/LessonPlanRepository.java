package com.main.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.LessonPlan;

public interface LessonPlanRepository extends MongoRepository<LessonPlan, String> {
    List<LessonPlan> findByTeacherIdOrderByDateAsc(String teacherId);
}
