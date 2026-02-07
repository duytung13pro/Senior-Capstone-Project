package com.main.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String password;
    private String avatarUrl;
    private Role role;


        // We need getters so that MongoDB can access these fields and write them to the database
        public String getId() {
            return id;
        }
    
        public String getEmail() {
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

        public Role getRole(){
            return role;
        } 

        public void setRole(Role role){
            this.role = role;
        }



        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public void setAvatarUrl(String avatarUrl ){
            this.avatarUrl = avatarUrl;
        }
        
        public String getAvatarUrl(){
            return avatarUrl;
        }
    }