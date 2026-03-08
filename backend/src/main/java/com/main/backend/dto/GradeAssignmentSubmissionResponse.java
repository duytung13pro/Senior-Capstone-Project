package com.main.backend.dto;

import java.time.Instant;

public class GradeAssignmentSubmissionResponse {
    private String submissionId;
    private String assignmentId;
    private String classId;
    private String studentId;
    private Integer score;
    private String feedback;
    private Instant submittedAt;
    private boolean late;

    public GradeAssignmentSubmissionResponse(
            String submissionId,
            String assignmentId,
            String classId,
            String studentId,
            Integer score,
            String feedback,
            Instant submittedAt,
            boolean late) {
        this.submissionId = submissionId;
        this.assignmentId = assignmentId;
        this.classId = classId;
        this.studentId = studentId;
        this.score = score;
        this.feedback = feedback;
        this.submittedAt = submittedAt;
        this.late = late;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public String getClassId() {
        return classId;
    }

    public String getStudentId() {
        return studentId;
    }

    public Integer getScore() {
        return score;
    }

    public String getFeedback() {
        return feedback;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public boolean isLate() {
        return late;
    }
}
