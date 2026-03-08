package com.main.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String name;
    private String phone;
    private String email;
    private String password;
    private String avatarUrl;
    private String role;

    // We need getters so that MongoDB can access these fields and write them to the
    // database
    public String getId() {
        return id;
    }

    public String getEmail() {
        if (email == null) {
            return "";
        }
        return email.toLowerCase().trim();
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFirstName() {
        if (firstName != null && !firstName.isBlank()) {
            return firstName;
        }
        if (name != null && !name.isBlank()) {
            return name;
        }
        return "";
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        if (lastName != null && !lastName.isBlank()) {
            return lastName;
        }
        return "";
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }
}