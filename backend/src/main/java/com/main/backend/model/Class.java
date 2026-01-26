package com.main.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "classes")
public class Class {

    @Id
    private String id;

    private String name;

    private ClassLevel level;

    // Example: "9:00AM - 10:10AM"
    private String time;

    // Example: "Mon / Wed / Fri"
    private String days;

    private String description;

    // Teacher who owns this class
    private String teacherId;

    private Instant createdAt = Instant.now();

    public Class() {}

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ClassLevel getLevel() {
        return level;
    }

    public void setLevel(ClassLevel level) {
        this.level = level;
    }

    public String getTime() {
        return time;
    }
    
    public void setTime(String time) {
        this.time = time;
    }

    public String getDays() {
        return days;
    }
    
    public void setDays(String days) {
        this.days = days;
    }

    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }

    public String getTeacherId() {
        return teacherId;
    }
    
    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
