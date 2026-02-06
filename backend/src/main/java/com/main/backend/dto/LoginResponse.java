package com.main.backend.dto;

import com.main.backend.model.Role;

public class LoginResponse {

    private String id;
    private String email;
    private Role role;

    public LoginResponse() {}

    public LoginResponse(String id, String email, Role role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public String getId() {
        return id;
    }
    
    public String getEmail() {
        return email;
    }
    
    public Role getRole() {
        return role;
    }

}
