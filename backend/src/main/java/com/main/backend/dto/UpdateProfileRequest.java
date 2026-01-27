package com.main.backend.dto;

public class UpdateProfileRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    public String getFirstName() {
        return firstName;
    }
    public String getLastName() {
        return lastName;
    }
    public String getEmail() {
        return email;
    }
    public String getPhone() {
        return phone;
    }
}
