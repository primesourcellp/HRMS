package com.hrms.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "peer_reviews")
public class PeerReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "reviewee_id", nullable = false)
    private Long revieweeId;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Column(nullable = false)
    private Boolean anonymous;

    @Column(name = "review_date", nullable = false)
    private LocalDateTime reviewDate;

    @Column(name = "review_period")
    private String reviewPeriod;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", insertable = false, updatable = false)
    @JsonIgnore
    private Employee reviewer;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", insertable = false, updatable = false)
    @JsonIgnore
    private Employee reviewee;

    // Constructors
    public PeerReview() {
    }

    public PeerReview(Long id, Long reviewerId, Long revieweeId, Integer rating, 
                   String feedback, String strengths, String improvements, 
                   Boolean anonymous, LocalDateTime reviewDate, String reviewPeriod,
                   Employee reviewer, Employee reviewee) {
        this.id = id;
        this.reviewerId = reviewerId;
        this.revieweeId = revieweeId;
        this.rating = rating;
        this.feedback = feedback;
        this.strengths = strengths;
        this.improvements = improvements;
        this.anonymous = anonymous;
        this.reviewDate = reviewDate;
        this.reviewPeriod = reviewPeriod;
        this.reviewer = reviewer;
        this.reviewee = reviewee;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(Long reviewerId) {
        this.reviewerId = reviewerId;
    }

    public Long getRevieweeId() {
        return revieweeId;
    }

    public void setRevieweeId(Long revieweeId) {
        this.revieweeId = revieweeId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getImprovements() {
        return improvements;
    }

    public void setImprovements(String improvements) {
        this.improvements = improvements;
    }

    public Boolean getAnonymous() {
        return anonymous;
    }

    public void setAnonymous(Boolean anonymous) {
        this.anonymous = anonymous;
    }

    public LocalDateTime getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDateTime reviewDate) {
        this.reviewDate = reviewDate;
    }

    public String getReviewPeriod() {
        return reviewPeriod;
    }

    public void setReviewPeriod(String reviewPeriod) {
        this.reviewPeriod = reviewPeriod;
    }

    public Employee getReviewer() {
        return reviewer;
    }

    public void setReviewer(Employee reviewer) {
        this.reviewer = reviewer;
    }

    public Employee getReviewee() {
        return reviewee;
    }

    public void setReviewee(Employee reviewee) {
        this.reviewee = reviewee;
    }
}
