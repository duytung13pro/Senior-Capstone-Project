package com.main.backend.dto;

public class SubmissionStateResponse {
    private  String submissionId;

    private String studentId;
    private String studentName;
    private String email;
    private boolean submitted;

    public SubmissionStateResponse(String submissionId,String studentId,String studentName,String email, boolean submitted) {
        this.submissionId = submissionId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.email = email;
        this.submitted = submitted;

    }

    public String getSubmissionId() 
    {
        return submissionId;
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
