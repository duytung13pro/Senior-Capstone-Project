package com.main.backend.dto;

import java.util.List;

public class EraseClassesRequest {
    private String teacherId;
    private List<String> classIds;

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public List<String> getClassIds() {
        return classIds;
    }

    public void setClassIds(List<String> classIds) {
        this.classIds = classIds;
    }
}