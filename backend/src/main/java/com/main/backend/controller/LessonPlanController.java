package com.main.backend.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.main.backend.dto.CreateLessonPlanRequest;
import com.main.backend.model.LessonPlan;
import com.main.backend.repository.LessonPlanRepository;

@RestController
@RequestMapping("/api/lesson-plans")
@CrossOrigin(origins = "http://localhost:3000")
public class LessonPlanController {

    private final LessonPlanRepository lessonPlanRepository;

    public LessonPlanController(LessonPlanRepository lessonPlanRepository) {
        this.lessonPlanRepository = lessonPlanRepository;
    }

    @GetMapping
    public List<LessonPlan> getLessonPlans(@RequestParam String teacherId) {
        return lessonPlanRepository.findByTeacherIdOrderByDateAsc(teacherId);
    }

    @PostMapping
    public ResponseEntity<LessonPlan> createLessonPlan(@RequestBody CreateLessonPlanRequest req) {
        LessonPlan lessonPlan = new LessonPlan();

        lessonPlan.setTeacherId(req.getTeacherId());
        lessonPlan.setClassId(req.getClassId());
        lessonPlan.setTitle(req.getTitle());
        lessonPlan.setDate(parseDate(req.getDate()));
        lessonPlan.setStatus(resolveStatus(req.getStatus(), req.isTemplate()));
        lessonPlan.setObjectives(req.getObjectives());
        lessonPlan.setActivities(req.getActivities());
        lessonPlan.setMaterials(req.getMaterials());
        lessonPlan.setAssessment(req.getAssessment());
        lessonPlan.setTemplate(req.isTemplate());
        lessonPlan.setCreatedAt(Instant.now());
        lessonPlan.setUpdatedAt(Instant.now());

        lessonPlanRepository.save(lessonPlan);

        return ResponseEntity.ok(lessonPlan);
    }

    @DeleteMapping("/{lessonPlanId}")
    public ResponseEntity<?> deleteLessonPlan(@PathVariable String lessonPlanId, @RequestParam String teacherId) {
        LessonPlan lessonPlan = lessonPlanRepository
            .findById(lessonPlanId)
            .orElseThrow(() -> new RuntimeException("Lesson plan not found"));

        if (!lessonPlan.getTeacherId().equals(teacherId)) {
            return ResponseEntity.badRequest().body("Cannot delete another teacher's lesson plan");
        }

        lessonPlanRepository.deleteById(lessonPlanId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{lessonPlanId}/duplicate")
    public ResponseEntity<LessonPlan> duplicateLessonPlan(@PathVariable String lessonPlanId, @RequestParam String teacherId) {
        LessonPlan original = lessonPlanRepository
            .findById(lessonPlanId)
            .orElseThrow(() -> new RuntimeException("Lesson plan not found"));

        if (!original.getTeacherId().equals(teacherId)) {
            return ResponseEntity.badRequest().build();
        }

        LessonPlan copy = new LessonPlan();
        copy.setTeacherId(original.getTeacherId());
        copy.setClassId(original.getClassId());
        copy.setTitle(original.getTitle() + " (Copy)");
        copy.setDate(original.getDate());
        copy.setStatus(original.getStatus());
        copy.setObjectives(original.getObjectives());
        copy.setActivities(original.getActivities());
        copy.setMaterials(original.getMaterials());
        copy.setAssessment(original.getAssessment());
        copy.setTemplate(original.isTemplate());
        copy.setCreatedAt(Instant.now());
        copy.setUpdatedAt(Instant.now());

        lessonPlanRepository.save(copy);
        return ResponseEntity.ok(copy);
    }

    private Instant parseDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            return Instant.now();
        }

        try {
            return Instant.parse(rawDate);
        } catch (Exception ignored) {
            return LocalDate.parse(rawDate).atStartOfDay(ZoneId.systemDefault()).toInstant();
        }
    }

    private String resolveStatus(String status, boolean template) {
        if (status != null && !status.isBlank()) {
            return status;
        }
        return template ? "Template" : "Draft";
    }
}
