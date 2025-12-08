package com.hrms.dto;

public class UserDTO {
    private Long id;
    private String email;
    private String role;
    private String name;
    private Boolean active;

    // Constructors
    public UserDTO() {
    }

    public UserDTO(Long id, String email, String role, String name, Boolean active) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.name = name;
        this.active = active;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}

