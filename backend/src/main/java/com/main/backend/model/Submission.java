package com.main.backend.model;

import java.time.Instant;

public class Submission {
    private String id;
    private String assignmentId;
    private String studentId;
    private String content;
    private Integer score;        // null if not graded
    private Instant submittedAt;
    private String status ;
    private String feedback;

    // Default constructor
    public Submission() {}

    // Constructor for new submission
    public Submission(String assignmentId, String studentId, String content, Instant submittedAt) {
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.submittedAt = submittedAt;
        this.content = content;
        this.status = null;
        this.score = null;
        this.feedback = null;
    }

    // Getters
    public String getId() {
        return id;
    }
    public String getContent() {
        return content;
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

    public String getStatus() {
        return status;
    }

    public String getFeedback() {
        return feedback;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }
    public void setContent(String content) {
        this.content = content;
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

    public void setStatus(String status) {
        this.status = status;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}