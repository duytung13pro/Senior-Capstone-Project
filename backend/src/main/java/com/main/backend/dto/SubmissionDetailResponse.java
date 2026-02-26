package com.main.backend.dto;

public class SubmissionDetailResponse {
    private String content;

    public SubmissionDetailResponse(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }
}