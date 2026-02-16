package com.main.backend.model;

import java.time.Instant;

public class AssignmentSubmission {
    private String id;
    private String assignmentId;
    private String studentId;
    private Integer score;        // null if not graded
    private Instant submittedAt;
    private boolean late;
    private String feedback;

    // Default constructor (no arguments)
    public AssignmentSubmission() {
    }

    // Constructor with all fields
    public AssignmentSubmission(String id, String assignmentId, String studentId, 
                               Integer score, Instant submittedAt, boolean late, 
                               String feedback) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.score = score;
        this.submittedAt = submittedAt;
        this.late = late;
        this.feedback = feedback;
    }

    // Constructor for new submission (without id and feedback, score null by default)
    public AssignmentSubmission(String assignmentId, String studentId, Instant submittedAt, boolean late) {
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.submittedAt = submittedAt;
        this.late = late;
        this.score = null;
        this.feedback = null;
    }

    // Constructor for submission with feedback but no score yet
    public AssignmentSubmission(String id, String assignmentId, String studentId, 
                               Instant submittedAt, boolean late, String feedback) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.submittedAt = submittedAt;
        this.late = late;
        this.feedback = feedback;
        this.score = null;
    }

    // Getters and setters...
    // (include all the getter and setter methods from previous response)
}