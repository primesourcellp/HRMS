package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "job_postings")
public class JobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String position;

    @Column(name = "job_type", nullable = false)
    private String jobType; // FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP

    @Column(name = "experience_required")
    private String experienceRequired;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "posted_date", nullable = false)
    private LocalDate postedDate;

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN, CLOSED, ON_HOLD

    @Column(name = "no_of_vacancies")
    private Integer noOfVacancies;

    @Column(name = "posted_by")
    private Long postedBy; // User ID who posted

    // Constructors
    public JobPosting() {
        this.postedDate = LocalDate.now();
    }

    public JobPosting(Long id, String title, String department, String position, String jobType,
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
        this.postedDate = postedDate != null ? postedDate : LocalDate.now();
        this.closingDate = closingDate;
        this.status = status != null ? status : "OPEN";
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

