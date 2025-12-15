package com.hrms.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ApplicantDTO {
    private Long id;
    private Long jobPostingId;
    private String name;
    private String email;
    private String phone;
    private String resumePath;
    private String coverLetter;
    private LocalDateTime appliedDate;
    private String status;
    private Double screeningScore;
    private LocalDate interviewDate;
    private String interviewFeedback;
    private String offerLetterPath;

    // Constructors
    public ApplicantDTO() {
    }

    public ApplicantDTO(Long id, Long jobPostingId, String name, String email, String phone,
                       String resumePath, String coverLetter, LocalDateTime appliedDate, String status,
                       Double screeningScore, LocalDate interviewDate, String interviewFeedback,
                       String offerLetterPath) {
        this.id = id;
        this.jobPostingId = jobPostingId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.resumePath = resumePath;
        this.coverLetter = coverLetter;
        this.appliedDate = appliedDate;
        this.status = status;
        this.screeningScore = screeningScore;
        this.interviewDate = interviewDate;
        this.interviewFeedback = interviewFeedback;
        this.offerLetterPath = offerLetterPath;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJobPostingId() {
        return jobPostingId;
    }

    public void setJobPostingId(Long jobPostingId) {
        this.jobPostingId = jobPostingId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getResumePath() {
        return resumePath;
    }

    public void setResumePath(String resumePath) {
        this.resumePath = resumePath;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }

    public LocalDateTime getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDateTime appliedDate) {
        this.appliedDate = appliedDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getScreeningScore() {
        return screeningScore;
    }

    public void setScreeningScore(Double screeningScore) {
        this.screeningScore = screeningScore;
    }

    public LocalDate getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(LocalDate interviewDate) {
        this.interviewDate = interviewDate;
    }

    public String getInterviewFeedback() {
        return interviewFeedback;
    }

    public void setInterviewFeedback(String interviewFeedback) {
        this.interviewFeedback = interviewFeedback;
    }

    public String getOfferLetterPath() {
        return offerLetterPath;
    }

    public void setOfferLetterPath(String offerLetterPath) {
        this.offerLetterPath = offerLetterPath;
    }
}

