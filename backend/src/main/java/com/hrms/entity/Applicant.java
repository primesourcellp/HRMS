package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applicants")
public class Applicant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_posting_id", nullable = false)
    private Long jobPostingId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "resume_path")
    private String resumePath;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "applied_date", nullable = false)
    private LocalDateTime appliedDate;

    @Column(nullable = false)
    private String status = "APPLIED"; // APPLIED, SCREENED, SHORTLISTED, INTERVIEWED, SELECTED, REJECTED

    @Column(name = "screening_score")
    private Double screeningScore;

    @Column(name = "interview_date")
    private LocalDate interviewDate;

    @Column(name = "interview_feedback", columnDefinition = "TEXT")
    private String interviewFeedback;

    @Column(name = "offer_letter_path")
    private String offerLetterPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", insertable = false, updatable = false)
    private JobPosting jobPosting;

    // Constructors
    public Applicant() {
        this.appliedDate = LocalDateTime.now();
    }

    public Applicant(Long id, Long jobPostingId, String name, String email, String phone,
                    String resumePath, String coverLetter, LocalDateTime appliedDate, String status,
                    Double screeningScore, LocalDate interviewDate, String interviewFeedback,
                    String offerLetterPath, JobPosting jobPosting) {
        this.id = id;
        this.jobPostingId = jobPostingId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.resumePath = resumePath;
        this.coverLetter = coverLetter;
        this.appliedDate = appliedDate != null ? appliedDate : LocalDateTime.now();
        this.status = status != null ? status : "APPLIED";
        this.screeningScore = screeningScore;
        this.interviewDate = interviewDate;
        this.interviewFeedback = interviewFeedback;
        this.offerLetterPath = offerLetterPath;
        this.jobPosting = jobPosting;
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

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public void setJobPosting(JobPosting jobPosting) {
        this.jobPosting = jobPosting;
    }
}

