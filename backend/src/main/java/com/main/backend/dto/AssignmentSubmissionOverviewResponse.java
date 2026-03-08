package com.main.backend.dto;

import java.util.List;

public class AssignmentSubmissionOverviewResponse {
    private String assignmentId;
    private String classId;
    private long submittedCount;
    private long totalStudents;
    private List<AssignmentSubmissionStudentResponse> students;

    public AssignmentSubmissionOverviewResponse(
            String assignmentId,
            String classId,
            long submittedCount,
            long totalStudents,
            List<AssignmentSubmissionStudentResponse> students) {
        this.assignmentId = assignmentId;
        this.classId = classId;
        this.submittedCount = submittedCount;
        this.totalStudents = totalStudents;
        this.students = students;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public String getClassId() {
        return classId;
    }

    public long getSubmittedCount() {
        return submittedCount;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public List<AssignmentSubmissionStudentResponse> getStudents() {
        return students;
    }
}
