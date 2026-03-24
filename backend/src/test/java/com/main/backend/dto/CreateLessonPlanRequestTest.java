package com.main.backend.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

class CreateLessonPlanRequestTest {

    @Test
    void keepsStringValuesAsIs() {
        CreateLessonPlanRequest request = new CreateLessonPlanRequest();

        request.setObjectives("Line 1\nLine 2");

        assertEquals("Line 1\nLine 2", request.getObjectives());
    }

    @Test
    void normalizesListIntoNewlineDelimitedString() {
        CreateLessonPlanRequest request = new CreateLessonPlanRequest();

        request.setObjectives(Arrays.asList("Objective A", "", "Objective B", "   "));

        assertEquals("Objective A\nObjective B", request.getObjectives());
    }

    @Test
    void normalizesArrayIntoNewlineDelimitedString() {
        CreateLessonPlanRequest request = new CreateLessonPlanRequest();

        request.setActivities(new String[] { "Warm-up", "", "Practice" });

        assertEquals("Warm-up\nPractice", request.getActivities());
    }

    @Test
    void normalizesMapValuesIntoNewlineDelimitedString() {
        CreateLessonPlanRequest request = new CreateLessonPlanRequest();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("first", "Material A");
        payload.put("second", "");
        payload.put("third", "Material B");

        request.setMaterials(payload);

        assertEquals("Material A\nMaterial B", request.getMaterials());
    }

    @Test
    void keepsNullAsNull() {
        CreateLessonPlanRequest request = new CreateLessonPlanRequest();

        request.setAssessment(null);

        assertNull(request.getAssessment());
    }
}
