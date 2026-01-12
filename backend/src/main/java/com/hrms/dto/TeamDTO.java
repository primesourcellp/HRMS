package com.hrms.dto;

import java.time.LocalDate;
import java.util.List;

public class TeamDTO {
    private Long id;
    private String name;
    private String description;
    private Long createdBy;
    private LocalDate createdDate;
    private List<TeamMemberDTO> members;

    // Constructors
    public TeamDTO() {
    }

    public TeamDTO(Long id, String name, String description, Long createdBy, LocalDate createdDate, List<TeamMemberDTO> members) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.members = members;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDate createdDate) {
        this.createdDate = createdDate;
    }

    public List<TeamMemberDTO> getMembers() {
        return members;
    }

    public void setMembers(List<TeamMemberDTO> members) {
        this.members = members;
    }
}

