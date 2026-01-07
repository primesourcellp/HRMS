package com.hrms.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
@Table(name = "appraisal_compensation")
public class AppraisalCompensation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "performance_id")
    private Long performanceId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "recommended_percentage")
    private Double recommendedPercentage;

    @Column(name = "recommended_amount")
    private Double recommendedAmount;

    @Column(name = "status")
    private String status;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private User employee;

    public AppraisalCompensation() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPerformanceId() { return performanceId; }
    public void setPerformanceId(Long performanceId) { this.performanceId = performanceId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Double getRecommendedPercentage() { return recommendedPercentage; }
    public void setRecommendedPercentage(Double recommendedPercentage) { this.recommendedPercentage = recommendedPercentage; }

    public Double getRecommendedAmount() { return recommendedAmount; }
    public void setRecommendedAmount(Double recommendedAmount) { this.recommendedAmount = recommendedAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }
}
