package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "gratuity")
public class Gratuity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "last_drawn_salary", nullable = false)
    private Double lastDrawnSalary; // Basic Salary + DA (if applicable)

    @Column(name = "years_of_service", nullable = false)
    private Double yearsOfService; // Can be fractional (e.g., 5.5 years)

    @Column(name = "calculated_amount", nullable = false)
    private Double calculatedAmount; // (Last drawn salary × 15/26) × Years of service

    @Column(name = "final_amount")
    private Double finalAmount; // After applying maximum cap (₹20 lakhs)

    @Column(name = "exit_date", nullable = false)
    private LocalDate exitDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, PAID, REJECTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    @Column(name = "paid_at")
    private java.time.LocalDateTime paidAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "paid_by")
    private Long paidBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private Employee employee;

    // Constructors
    public Gratuity() {
        this.createdAt = java.time.LocalDateTime.now();
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

    public Double getLastDrawnSalary() {
        return lastDrawnSalary;
    }

    public void setLastDrawnSalary(Double lastDrawnSalary) {
        this.lastDrawnSalary = lastDrawnSalary;
    }

    public Double getYearsOfService() {
        return yearsOfService;
    }

    public void setYearsOfService(Double yearsOfService) {
        this.yearsOfService = yearsOfService;
    }

    public Double getCalculatedAmount() {
        return calculatedAmount;
    }

    public void setCalculatedAmount(Double calculatedAmount) {
        this.calculatedAmount = calculatedAmount;
    }

    public Double getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(Double finalAmount) {
        this.finalAmount = finalAmount;
    }

    public LocalDate getExitDate() {
        return exitDate;
    }

    public void setExitDate(LocalDate exitDate) {
        this.exitDate = exitDate;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
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

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(java.time.LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public java.time.LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(java.time.LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }

    public Long getPaidBy() {
        return paidBy;
    }

    public void setPaidBy(Long paidBy) {
        this.paidBy = paidBy;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
}

