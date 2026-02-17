package com.main.backend.model;

import java.time.Instant;

public class Submission {
    private String id;
    private String assignmentId;
    private String studentId;
    private Integer score;        // null if not graded
    private Instant submittedAt;
    private boolean late;
    private String feedback;

    // Default constructor
    public Submission() {}

    // Constructor for new submission
    public Submission(String assignmentId, String studentId, Instant submittedAt, boolean late) {
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.submittedAt = submittedAt;
        this.late = late;
        this.score = null;
        this.feedback = null;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public String getStudentId() {
        return studentId;
    }

    public Integer getScore() {
        return score;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public boolean isLate() {
        return late;
    }

    public String getFeedback() {
        return feedback;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public void setLate(boolean late) {
        this.late = late;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}