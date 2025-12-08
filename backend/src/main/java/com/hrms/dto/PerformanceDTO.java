package com.hrms.dto;

import java.time.LocalDate;

public class PerformanceDTO {
    private Long id;
    private Long employeeId;
    private LocalDate reviewDate;
    private String period;
    private Integer rating;
    private String goals;
    private String achievements;
    private String feedback;
    private String areasForImprovement;

    // Constructors
    public PerformanceDTO() {
    }

    public PerformanceDTO(Long id, Long employeeId, LocalDate reviewDate, String period,
                         Integer rating, String goals, String achievements, String feedback,
                         String areasForImprovement) {
        this.id = id;
        this.employeeId = employeeId;
        this.reviewDate = reviewDate;
        this.period = period;
        this.rating = rating;
        this.goals = goals;
        this.achievements = achievements;
        this.feedback = feedback;
        this.areasForImprovement = areasForImprovement;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDate getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDate reviewDate) {
        this.reviewDate = reviewDate;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getGoals() {
        return goals;
    }

    public void setGoals(String goals) {
        this.goals = goals;
    }

    public String getAchievements() {
        return achievements;
    }

    public void setAchievements(String achievements) {
        this.achievements = achievements;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getAreasForImprovement() {
        return areasForImprovement;
    }

    public void setAreasForImprovement(String areasForImprovement) {
        this.areasForImprovement = areasForImprovement;
    }
}

