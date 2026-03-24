package com.main.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.LessonPlan;

public interface LessonPlanRepository extends MongoRepository<LessonPlan, String> {
    List<LessonPlan> findByTeacherIdOrderByDateAsc(String teacherId);

    List<LessonPlan> findByClassId(String classId);

    void deleteByClassId(String classId);

    List<LessonPlan> findByClassIdAndTemplateFalseAndStatusInOrderByDateDesc(
            String classId,
            Collection<String> statuses);
}
