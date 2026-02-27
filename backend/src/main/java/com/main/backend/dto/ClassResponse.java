package com.main.backend.dto;

import com.main.backend.model.Class;
import com.main.backend.model.ClassLevel;

import java.time.Instant;
import java.util.List;

// Control what data is sent to the client
// When a class object is returned from backend
public class ClassResponse {

    private String id;
    private String name;
    private ClassLevel level;
    private String time;
    private String days;
    private String description;
    private String room;
    private Integer maxStudents;
    private String startDate;
    private String endDate;
    private Instant createdAt;
    private List<String> studentIds;

    public ClassResponse(Class c) {
        this.id = c.getId();
        this.name = c.getName();
        this.level = c.getLevel();
        this.time = c.getTime();
        this.days = c.getDays();
        this.description = c.getDescription();
        this.room = c.getRoom();
        this.maxStudents = c.getMaxStudents();
        this.startDate = c.getStartDate();
        this.endDate = c.getEndDate();
        this.createdAt = c.getCreatedAt();
        this.studentIds = c.getStudentIds();
    }

    public List<String> getStudentIds() {
        return studentIds;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public ClassLevel getLevel() {
        return level;
    }

    public String getTime() {
        return time;
    }

    public String getDays() {
        return days;
    }

    public String getDescription() {
        return description;
    }

    public String getRoom() {
        return room;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public String getStartDate() {
        return startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}