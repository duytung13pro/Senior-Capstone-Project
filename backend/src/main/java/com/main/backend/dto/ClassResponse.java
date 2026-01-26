package com.main.backend.dto;

import com.main.backend.model.Class;
import com.main.backend.model.ClassLevel;

import java.time.Instant;

// Control what data is sent to the client
// When a class object is returned from backend
public class ClassResponse {

    private String id;
    private String name;
    private ClassLevel level;
    private String time;
    private String days;
    private String description;
    private Instant createdAt;

    public ClassResponse(Class c) {
        this.id = c.getId();
        this.name = c.getName();
        this.level = c.getLevel();
        this.time = c.getTime();
        this.days = c.getDays();
        this.description = c.getDescription();
        this.createdAt = c.getCreatedAt();
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
