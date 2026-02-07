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
}