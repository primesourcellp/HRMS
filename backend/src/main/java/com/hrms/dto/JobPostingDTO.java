package com.hrms.dto;

import java.time.LocalDate;

public class JobPostingDTO {
    private Long id;
    private String title;
    private String department;
    private String position;
    private String jobType;
    private String experienceRequired;
    private String description;
    private String requirements;
    private LocalDate postedDate;
    private LocalDate closingDate;
    private String status;
    private Integer noOfVacancies;
    private Long postedBy;

    // Constructors
    public JobPostingDTO() {
    }

    public JobPostingDTO(Long id, String title, String department, String position, String jobType,
                        String experienceRequired, String description, String requirements,
                        LocalDate postedDate, LocalDate closingDate, String status,
                        Integer noOfVacancies, Long postedBy) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.position = position;
        this.jobType = jobType;
        this.experienceRequired = experienceRequired;
        this.description = description;
        this.requirements = requirements;
        this.postedDate = postedDate;
        this.closingDate = closingDate;
        this.status = status;
        this.noOfVacancies = noOfVacancies;
        this.postedBy = postedBy;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getExperienceRequired() {
        return experienceRequired;
    }

    public void setExperienceRequired(String experienceRequired) {
        this.experienceRequired = experienceRequired;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public LocalDate getPostedDate() {
        return postedDate;
    }

    public void setPostedDate(LocalDate postedDate) {
        this.postedDate = postedDate;
    }

    public LocalDate getClosingDate() {
        return closingDate;
    }

    public void setClosingDate(LocalDate closingDate) {
        this.closingDate = closingDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getNoOfVacancies() {
        return noOfVacancies;
    }

    public void setNoOfVacancies(Integer noOfVacancies) {
        this.noOfVacancies = noOfVacancies;
    }

    public Long getPostedBy() {
        return postedBy;
    }

    public void setPostedBy(Long postedBy) {
        this.postedBy = postedBy;
    }
}

