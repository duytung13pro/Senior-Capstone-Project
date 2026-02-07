
package com.main.backend.dto;

import com.main.backend.model.User;
import com.main.backend.model.Role;

public class UserProfileResponse {

    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Role role;
    private String avatarUrl;


    public UserProfileResponse(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.avatarUrl = user.getAvatarUrl();
    }

    
    public String getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public Role getRole() { return role; }
    public String getAvatarUrl(){return avatarUrl;}
}