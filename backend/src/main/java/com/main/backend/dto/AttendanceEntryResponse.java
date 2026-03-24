package com.main.backend.dto;

import java.time.Instant;

import com.main.backend.model.AttendanceEntry;

public class AttendanceEntryResponse {
    private String id;
    private String classId;
    private String studentId;
    private String date;
    private String status;
    private Instant updatedAt;

    public AttendanceEntryResponse(AttendanceEntry entry) {
        this.id = entry.getId();
        this.classId = entry.getClassId();
        this.studentId = entry.getStudentId();
        this.date = entry.getDate();
        this.status = entry.getStatus();
        this.updatedAt = entry.getUpdatedAt();
    }

    public String getId() {
        return id;
    }

    public String getClassId() {
        return classId;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getDate() {
        return date;
    }

    public String getStatus() {
        return status;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
