package com.main.backend.dto;

import java.lang.reflect.Array;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class CreateLessonPlanRequest {
    private String teacherId;
    private String classId;
    private String moduleId;
    private String title;
    private String date;
    private String status;
    private String objectives;
    private String activities;
    private String materials;
    private String assessment;
    private boolean template;

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getObjectives() {
        return objectives;
    }

    public void setObjectives(Object objectives) {
        this.objectives = normalizeTextField(objectives);
    }

    public String getActivities() {
        return activities;
    }

    public void setActivities(Object activities) {
        this.activities = normalizeTextField(activities);
    }

    public String getMaterials() {
        return materials;
    }

    public void setMaterials(Object materials) {
        this.materials = normalizeTextField(materials);
    }

    public String getAssessment() {
        return assessment;
    }

    public void setAssessment(Object assessment) {
        this.assessment = normalizeTextField(assessment);
    }

    public boolean isTemplate() {
        return template;
    }

    public void setTemplate(boolean template) {
        this.template = template;
    }

    private String normalizeTextField(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof String textValue) {
            return textValue;
        }

        if (value instanceof List<?> listValue) {
            return listValue.stream()
                    .map(item -> item == null ? "" : String.valueOf(item).trim())
                    .filter(item -> !item.isBlank())
                    .collect(Collectors.joining("\n"));
        }

        if (value.getClass().isArray()) {
            int length = Array.getLength(value);
            StringBuilder normalized = new StringBuilder();
            for (int index = 0; index < length; index++) {
                Object item = Array.get(value, index);
                String itemText = item == null ? "" : String.valueOf(item).trim();
                if (itemText.isBlank()) {
                    continue;
                }

                if (normalized.length() > 0) {
                    normalized.append("\n");
                }
                normalized.append(itemText);
            }
            return normalized.toString();
        }

        if (value instanceof Map<?, ?> mapValue) {
            return mapValue.values().stream()
                    .map(item -> item == null ? "" : String.valueOf(item).trim())
                    .filter(item -> !item.isBlank())
                    .collect(Collectors.joining("\n"));
        }

        return String.valueOf(value);
    }
}
