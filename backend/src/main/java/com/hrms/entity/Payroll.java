package com.hrms.entity;

import java.time.LocalDate;

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
@Table(name = "payrolls")
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String month; // Format: yyyy-MM

    @Column
    private Integer year;

    @Column(name = "start_date", nullable = true)
    private LocalDate startDate; // Payroll period start date

    @Column(name = "end_date", nullable = true)
    private LocalDate endDate; // Payroll period end date

    @Column(name = "base_salary", nullable = false)
    private Double baseSalary;

    @Column(nullable = false)
    private Double allowances = 0.0;

    @Column(nullable = false)
    private Double deductions = 0.0;

    @Column(nullable = false)
    private Double bonus = 0.0;

    @Column(nullable = false)
    private Double amount; // Calculated: baseSalary + allowances + bonus - deductions

    @Column(name = "net_salary")
    private Double netSalary; // Net salary after all deductions

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, FINALIZED, PAID

    @Column(columnDefinition = "TEXT")
    private String notes;
    
    // Workflow audit fields
    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;
    
    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;
    
    @Column(name = "rejected_at")
    private java.time.LocalDateTime rejectedAt;
    
    @Column(name = "finalized_at")
    private java.time.LocalDateTime finalizedAt;
    
    @Column(name = "paid_at")
    private java.time.LocalDateTime paidAt;
    
    @Column(name = "submitted_by")
    private Long submittedBy; // User ID who submitted
    
    @Column(name = "approved_by")
    private Long approvedBy; // User ID who approved
    
    @Column(name = "rejected_by")
    private Long rejectedBy; // User ID who rejected
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @Column(name = "finalized_by")
    private Long finalizedBy; // User ID who finalized
    
    @Column(name = "paid_by")
    private Long paidBy; // User ID who marked as paid

    

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private User employee;

    // Constructors
    public Payroll() {
    }

    public Payroll(Long id, Long employeeId, String month, Integer year, LocalDate startDate, LocalDate endDate,
                  Double baseSalary, Double allowances, Double deductions, Double bonus, Double amount, 
                  Double netSalary, String status, String notes, User employee) {
        this.id = id;
        this.employeeId = employeeId;
        this.month = month;
        this.year = year;
        this.startDate = startDate;
        this.endDate = endDate;
        this.baseSalary = baseSalary;
        this.allowances = allowances;
        this.deductions = deductions;
        this.bonus = bonus;
        this.amount = amount;
        this.netSalary = netSalary;
        this.status = status != null ? status : "DRAFT";
        this.notes = notes;
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

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Double getBaseSalary() {
        return baseSalary;
    }

    public void setBaseSalary(Double baseSalary) {
        this.baseSalary = baseSalary;
    }

    public Double getAllowances() {
        return allowances;
    }

    public void setAllowances(Double allowances) {
        this.allowances = allowances;
    }

    public Double getDeductions() {
        return deductions;
    }

    public void setDeductions(Double deductions) {
        this.deductions = deductions;
    }

    public Double getBonus() {
        return bonus;
    }

    public void setBonus(Double bonus) {
        this.bonus = bonus;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Double getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(Double netSalary) {
        this.netSalary = netSalary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getEmployee() {
        return employee;
    }

    public void setEmployee(User employee) {
        this.employee = employee;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    // Workflow audit getters and setters
    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public java.time.LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(java.time.LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public java.time.LocalDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(java.time.LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public java.time.LocalDateTime getRejectedAt() {
        return rejectedAt;
    }
    
    public void setRejectedAt(java.time.LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }
    
    public java.time.LocalDateTime getFinalizedAt() {
        return finalizedAt;
    }
    
    public void setFinalizedAt(java.time.LocalDateTime finalizedAt) {
        this.finalizedAt = finalizedAt;
    }
    
    public java.time.LocalDateTime getPaidAt() {
        return paidAt;
    }
    
    public void setPaidAt(java.time.LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
    
    public Long getSubmittedBy() {
        return submittedBy;
    }
    
    public void setSubmittedBy(Long submittedBy) {
        this.submittedBy = submittedBy;
    }
    
    public Long getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public Long getRejectedBy() {
        return rejectedBy;
    }
    
    public void setRejectedBy(Long rejectedBy) {
        this.rejectedBy = rejectedBy;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    public Long getFinalizedBy() {
        return finalizedBy;
    }
    
    public void setFinalizedBy(Long finalizedBy) {
        this.finalizedBy = finalizedBy;
    }
    
    public Long getPaidBy() {
        return paidBy;
    }
    
    public void setPaidBy(Long paidBy) {
        this.paidBy = paidBy;
    }
    
    // Workflow helper methods
    public boolean canBeEdited() {
        return "DRAFT".equals(status) || "PENDING_APPROVAL".equals(status) || "REJECTED".equals(status);
    }
    
    public boolean canBeDeleted() {
        return "DRAFT".equals(status) || "PENDING_APPROVAL".equals(status) || "REJECTED".equals(status);
    }
    
    public boolean canBeSubmitted() {
        return "DRAFT".equals(status) || "REJECTED".equals(status);
    }
    
    public boolean canBeApproved() {
        return "PENDING_APPROVAL".equals(status);
    }
    
    public boolean canBeRejected() {
        return "PENDING_APPROVAL".equals(status);
    }
    
    public boolean canBeFinalized() {
        return "APPROVED".equals(status);
    }
    
    public boolean canBePaid() {
        return "FINALIZED".equals(status);
    }
    
    public boolean isCompleted() {
        return "PAID".equals(status);
    }
    
    public boolean isFinalized() {
        return "FINALIZED".equals(status) || "PAID".equals(status);
    }
}
