package com.hrms.entity;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "performance")
public class Performance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    @Column(nullable = false)
    private String period; // Q1 2024, Q2 2024, etc.

    @Column(nullable = false)
    private Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String goals;

    @Column(columnDefinition = "TEXT")
    private String achievements;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "areas_for_improvement", columnDefinition = "TEXT")
    private String areasForImprovement;

    @Column(name = "goal_progress", columnDefinition = "TEXT")
    private String goalProgress;

    @Column(name = "overall_progress", nullable = false)
    private Integer overallProgress;
 
    // KPI fields: optional reference to a KPI configuration and KPI results for the review
    @Column(name = "kpi_config_id")
    private Long kpiConfigId;

    @Column(name = "kpi_results", columnDefinition = "TEXT")
    private String kpiResults;

    // Review cycle reference
    @Column(name = "review_cycle_id")
    private Long reviewCycleId;

    @Column(name = "manager_evaluation", columnDefinition = "TEXT")
    private String managerEvaluation;

    @Column(name = "self_evaluation", columnDefinition = "TEXT")
    private String selfEvaluation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    @JsonIgnore
    private Employee employee;

    // Constructors
    public Performance() {
    }

    public Performance(Long id, Long employeeId, LocalDate reviewDate, String period, 
                      Integer rating, String goals, String achievements, String feedback, 
                      String areasForImprovement, Employee employee) {
        this.id = id;
        this.employeeId = employeeId;
        this.reviewDate = reviewDate;
        this.period = period;
        this.rating = rating;
        this.goals = goals;
        this.achievements = achievements;
        this.feedback = feedback;
        this.areasForImprovement = areasForImprovement;
        this.employee = employee;
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

    public String getGoalProgress() {
        return goalProgress;
    }

    public void setGoalProgress(String goalProgress) {
        this.goalProgress = goalProgress;
    }

    public Integer getOverallProgress() {
        return overallProgress;
    }

    public void setOverallProgress(Integer overallProgress) {
        this.overallProgress = overallProgress;
    }

    public Long getKpiConfigId() {
        return kpiConfigId;
    }

    public void setKpiConfigId(Long kpiConfigId) {
        this.kpiConfigId = kpiConfigId;
    }

    public String getKpiResults() {
        return kpiResults;
    }

    public void setKpiResults(String kpiResults) {
        this.kpiResults = kpiResults;
    }

    public Long getReviewCycleId() {
        return reviewCycleId;
    }

    public void setReviewCycleId(Long reviewCycleId) {
        this.reviewCycleId = reviewCycleId;
    }

    public String getManagerEvaluation() {
        return managerEvaluation;
    }

    public void setManagerEvaluation(String managerEvaluation) {
        this.managerEvaluation = managerEvaluation;
    }

    public String getSelfEvaluation() {
        return selfEvaluation;
    }

    public void setSelfEvaluation(String selfEvaluation) {
        this.selfEvaluation = selfEvaluation;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
}
