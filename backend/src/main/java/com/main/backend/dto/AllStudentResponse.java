package com.main.backend.dto;

public record AllStudentResponse(
    String id,
    String firstName,
    String lastName,
    String email
) {}