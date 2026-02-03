package com.main.backend.dto;

public class RemoveStudentRequest {
    private String classId;
    private String studentEmail;
    public RemoveStudentRequest() {}

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }
}
