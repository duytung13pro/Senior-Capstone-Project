package com.main.backend.dto;

public class SubmissionStateResponse {
    private String studentId;
    private String studentName;
    private String email;
    private boolean submitted;

    public SubmissionStateResponse(String studentId,String studentName,String email, boolean submitted) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.email = email;
        this.submitted = submitted;

    }


    public String getStudentId() 
    {
        return studentId;
    }    
    public String getStudentName() 
    {
        return studentName;
    }    
    public String getEmail() 
    {
        return email;
    }
    public boolean getSubmitted() 
    {
        return submitted;
    }        
}
