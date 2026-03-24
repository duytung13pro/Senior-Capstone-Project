package com.main.backend.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.main.backend.dto.CreateLessonPlanRequest;
import com.main.backend.model.LessonPlan;
import com.main.backend.repository.LessonPlanRepository;

@RestController
@RequestMapping("/api/lesson-plans")
@CrossOrigin(originPatterns = { "http://localhost:*", "http://127.0.0.1:*" })
public class LessonPlanController {

    private static final Set<String> STUDENT_VISIBLE_LESSON_STATUSES = Set.of(
            "Published",
            "Ready / Scheduled");

    private final LessonPlanRepository lessonPlanRepository;

    public LessonPlanController(
            LessonPlanRepository lessonPlanRepository) {
        this.lessonPlanRepository = lessonPlanRepository;
    }

    @GetMapping
    public List<LessonPlan> getLessonPlans(@RequestParam String teacherId) {
        return lessonPlanRepository.findByTeacherIdOrderByDateAsc(teacherId);
    }

    private boolean isStudentVisibleLesson(LessonPlan lessonPlan) {
        return lessonPlan != null
                && !lessonPlan.isTemplate()
                && lessonPlan.getClassId() != null
                && !lessonPlan.getClassId().isBlank()
                && STUDENT_VISIBLE_LESSON_STATUSES.contains(lessonPlan.getStatus());
    }

    @GetMapping("/class/{classId}")
    public List<LessonPlan> getClassLessons(@PathVariable String classId) {
        return lessonPlanRepository
                .findByClassIdAndTemplateFalseAndStatusInOrderByDateDesc(classId, STUDENT_VISIBLE_LESSON_STATUSES);
    }

    @GetMapping("/{lessonPlanId}")
    public ResponseEntity<?> getLessonPlanById(@PathVariable String lessonPlanId) {
        LessonPlan lessonPlan = lessonPlanRepository
                .findById(lessonPlanId)
                .orElse(null);

        if (!isStudentVisibleLesson(lessonPlan)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(lessonPlan);
    }

    @GetMapping("/class/{classId}/latest")
    public ResponseEntity<?> getLatestLessonForClass(@PathVariable String classId) {
        List<LessonPlan> lessons = lessonPlanRepository
                .findByClassIdAndTemplateFalseAndStatusInOrderByDateDesc(classId, STUDENT_VISIBLE_LESSON_STATUSES);

        if (lessons.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(lessons.get(0));
    }

    @PostMapping
    public ResponseEntity<LessonPlan> createLessonPlan(@RequestBody CreateLessonPlanRequest req) {
        LessonPlan lessonPlan = new LessonPlan();

        lessonPlan.setTeacherId(req.getTeacherId());
        lessonPlan.setClassId(req.getClassId());
        lessonPlan.setModuleId(req.getModuleId());
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

    @PostMapping("/assets/upload")
    public ResponseEntity<?> uploadLessonAsset(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is required");
            }

            Path uploadDir = Paths.get("uploads/lesson-assets");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFileName = file.getOriginalFilename() == null
                    ? "asset"
                    : file.getOriginalFilename().trim();
            String safeFileName = originalFileName
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + safeFileName;

            Path filePath = uploadDir.resolve(fileName);
            Files.write(filePath, file.getBytes());

            String relativeUrl = "/uploads/lesson-assets/" + fileName;
            String absoluteUrl = ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path(relativeUrl)
                    .toUriString();

            return ResponseEntity.ok(Map.of(
                    "url", absoluteUrl,
                    "relativeUrl", relativeUrl,
                    "name", originalFileName));
        } catch (Exception error) {
            return ResponseEntity.status(500).body("Failed to upload asset file");
        }
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
    public ResponseEntity<LessonPlan> duplicateLessonPlan(@PathVariable String lessonPlanId,
            @RequestParam String teacherId) {
        LessonPlan original = lessonPlanRepository
                .findById(lessonPlanId)
                .orElseThrow(() -> new RuntimeException("Lesson plan not found"));

        if (!original.getTeacherId().equals(teacherId)) {
            return ResponseEntity.badRequest().build();
        }

        LessonPlan copy = new LessonPlan();
        copy.setTeacherId(original.getTeacherId());
        copy.setClassId(original.getClassId());
        copy.setModuleId(original.getModuleId());
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

    @PutMapping("/{lessonPlanId}")
    public ResponseEntity<?> updateLessonPlan(@PathVariable String lessonPlanId,
            @RequestParam String teacherId,
            @RequestBody CreateLessonPlanRequest req) {
        LessonPlan lessonPlan = lessonPlanRepository
                .findById(lessonPlanId)
                .orElseThrow(() -> new RuntimeException("Lesson plan not found"));

        if (!lessonPlan.getTeacherId().equals(teacherId)) {
            return ResponseEntity.badRequest().body("Cannot update another teacher's lesson plan");
        }

        if (req.getClassId() != null) {
            lessonPlan.setClassId(req.getClassId());
        }
        if (req.getModuleId() != null) {
            lessonPlan.setModuleId(req.getModuleId());
        }
        if (req.getTitle() != null) {
            lessonPlan.setTitle(req.getTitle());
        }
        if (req.getDate() != null) {
            lessonPlan.setDate(parseDate(req.getDate()));
        }

        lessonPlan.setStatus(resolveStatus(req.getStatus(), req.isTemplate()));

        if (req.getObjectives() != null) {
            lessonPlan.setObjectives(req.getObjectives());
        }
        if (req.getActivities() != null) {
            lessonPlan.setActivities(req.getActivities());
        }
        if (req.getMaterials() != null) {
            lessonPlan.setMaterials(req.getMaterials());
        }
        if (req.getAssessment() != null) {
            lessonPlan.setAssessment(req.getAssessment());
        }

        lessonPlan.setTemplate(req.isTemplate());
        lessonPlan.setUpdatedAt(Instant.now());

        lessonPlanRepository.save(lessonPlan);
        return ResponseEntity.ok(lessonPlan);
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
