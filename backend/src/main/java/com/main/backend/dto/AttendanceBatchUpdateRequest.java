package com.main.backend.dto;

import java.util.List;

public class AttendanceBatchUpdateRequest {
    private String date;
    private List<AttendanceStatusUpdateRequest> records;

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public List<AttendanceStatusUpdateRequest> getRecords() {
        return records;
    }

    public void setRecords(List<AttendanceStatusUpdateRequest> records) {
        this.records = records;
    }
}
