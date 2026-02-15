package com.main.backend.dto;

public class StudentEnrolledClassResponse {
    
    private String classId;
    public StudentEnrolledClassResponse(String classId) 
    {
        this.classId = classId;
    }
    public String getClassId(){
        return classId;
    }

}
