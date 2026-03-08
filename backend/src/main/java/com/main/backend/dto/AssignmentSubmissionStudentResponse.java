package com.main.backend.dto;

import java.time.Instant;

public class AssignmentSubmissionStudentResponse {
    private String studentId;
    private String firstName;
    private String lastName;
    private String email;
    private boolean submitted;
    private Instant submittedAt;
    private boolean late;
    private Integer score;

    public AssignmentSubmissionStudentResponse(
            String studentId,
            String firstName,
            String lastName,
            String email,
            boolean submitted,
            Instant submittedAt,
            boolean late,
            Integer score) {
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.submitted = submitted;
        this.submittedAt = submittedAt;
        this.late = late;
        this.score = score;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public boolean isSubmitted() {
        return submitted;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public boolean isLate() {
        return late;
    }

    public Integer getScore() {
        return score;
    }
}
