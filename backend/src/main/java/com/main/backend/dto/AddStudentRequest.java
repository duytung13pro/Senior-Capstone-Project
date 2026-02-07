package com.main.backend.dto;

// Class to store data to be sent when adding students to a class
public class AddStudentRequest {
    private String classId;
    private String studentEmail;

    public AddStudentRequest() {}

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