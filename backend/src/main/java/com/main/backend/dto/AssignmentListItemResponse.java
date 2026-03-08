package com.main.backend.dto;

import java.time.Instant;

import com.main.backend.model.Assignment;

public class AssignmentListItemResponse {
    private String id;
    private String classId;
    private String title;
    private String description;
    private Instant deadline;
    private int maxScore;
    private Instant createdAt;
    private long submittedCount;

    public AssignmentListItemResponse(Assignment assignment, long submittedCount) {
        this.id = assignment.getId();
        this.classId = assignment.getClassId();
        this.title = assignment.getTitle();
        this.description = assignment.getDescription();
        this.deadline = assignment.getDeadline();
        this.maxScore = assignment.getMaxScore();
        this.createdAt = assignment.getCreatedAt();
        this.submittedCount = submittedCount;
    }

    public String getId() {
        return id;
    }

    public String getClassId() {
        return classId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Instant getDeadline() {
        return deadline;
    }

    public int getMaxScore() {
        return maxScore;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public long getSubmittedCount() {
        return submittedCount;
    }
}
