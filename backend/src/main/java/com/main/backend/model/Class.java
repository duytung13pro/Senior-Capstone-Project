package com.main.backend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "classes")
public class Class {

    public static class AnnouncementEntry {
        private String id;
        private String title;
        private String content;
        private String status;
        private String target;
        private Boolean pinned = false;
        private Instant createdAt = Instant.now();
        private Instant updatedAt = Instant.now();

        public AnnouncementEntry() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }

        public Boolean getPinned() {
            return pinned;
        }

        public void setPinned(Boolean pinned) {
            this.pinned = pinned;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public Instant getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    public static class ResourceLink {
        private String id;
        private String title;
        private String url;
        private Instant createdAt = Instant.now();

        public ResourceLink() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }
    }

    public static class ModuleEntry {
        private String id;
        private String title;
        private Integer order;

        public ModuleEntry() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public Integer getOrder() {
            return order;
        }

        public void setOrder(Integer order) {
            this.order = order;
        }
    }

    @Id
    private String id;

    private String name;

    private ClassLevel level;

    // Example: "9:00AM - 10:10AM"
    private String time;

    // Example: "Mon / Wed / Fri"
    private String days;

    private String description;

    private String room;

    private Integer maxStudents;

    private String startDate;

    private String endDate;

    // Teacher who owns this class
    private String teacherId;

    private Instant createdAt = Instant.now();

    // List of student user IDs enrolled in this class

    private List<String> studentIds = new ArrayList<>();

    private List<ResourceLink> resources = new ArrayList<>();

    private List<AnnouncementEntry> announcements = new ArrayList<>();

    private List<ModuleEntry> modules = new ArrayList<>();

    public Class() {
    }

    public String getId() {
        return id;
    }

    public int getStudentCount() {
        return studentIds.size();
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

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = maxStudents;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
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

    public List<String> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<String> studentIds) {
        this.studentIds = studentIds;
    }

    public List<ResourceLink> getResources() {
        return resources;
    }

    public void setResources(List<ResourceLink> resources) {
        this.resources = resources;
    }

    public List<AnnouncementEntry> getAnnouncements() {
        return announcements;
    }

    public void setAnnouncements(List<AnnouncementEntry> announcements) {
        this.announcements = announcements;
    }

    public List<ModuleEntry> getModules() {
        return modules;
    }

    public void setModules(List<ModuleEntry> modules) {
        this.modules = modules;
    }
}