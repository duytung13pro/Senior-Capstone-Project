package com.main.backend.dto;

import java.time.Instant;

import com.main.backend.model.Assignment;

// Class to represent data to be sent when creating a new class
public class CreateAssignmentRespond {

    private String id;
    private String classId;

    private String title;
    private String description;
    private Instant deadline;
    private int maxScore;

    private Instant createdAt;

    public CreateAssignmentRespond(Assignment assignment) {
        this.id = assignment.getId();
        this.classId = assignment.getClassId();
        this.title = assignment.getTitle();
        this.description = assignment.getDescription();
        this.deadline = assignment.getDeadline();
        this.maxScore = assignment.getMaxScore();
        this.createdAt = assignment.getCreatedAt();
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
}
