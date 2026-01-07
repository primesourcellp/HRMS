package com.hrms.dto;

import java.time.LocalDate;

public class GratuityDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private Double lastDrawnSalary;
    private Double yearsOfService;
    private Double calculatedAmount;
    private Double finalAmount;
    private LocalDate exitDate;
    private LocalDate paymentDate;
    private String status;
    private String notes;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime approvedAt;
    private java.time.LocalDateTime paidAt;
    private Long createdBy;
    private Long approvedBy;
    private Long paidBy;

    // Constructors
    public GratuityDTO() {}

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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmployeeEmail() {
        return employeeEmail;
    }

    public void setEmployeeEmail(String employeeEmail) {
        this.employeeEmail = employeeEmail;
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
}

