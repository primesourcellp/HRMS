package com.hrms.dto;

import java.time.LocalDate;

public class LeaveDTO {
    private Long id;
    private Long employeeId;
    private Long leaveTypeId;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalDays;
    private String reason;
    private String status;
    private LocalDate appliedDate;
    private Long approvedBy;
    private LocalDate approvedDate;
    private String rejectionReason;
    private Boolean halfDay;
    private String halfDayType;

    // Constructors
    public LeaveDTO() {
    }

    public LeaveDTO(Long id, Long employeeId, Long leaveTypeId, String type,
                   LocalDate startDate, LocalDate endDate, Double totalDays, String reason,
                   String status, LocalDate appliedDate, Long approvedBy, LocalDate approvedDate,
                   String rejectionReason, Boolean halfDay, String halfDayType) {
        this.id = id;
        this.employeeId = employeeId;
        this.leaveTypeId = leaveTypeId;
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.reason = reason;
        this.status = status;
        this.appliedDate = appliedDate;
        this.approvedBy = approvedBy;
        this.approvedDate = approvedDate;
        this.rejectionReason = rejectionReason;
        this.halfDay = halfDay;
        this.halfDayType = halfDayType;
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

    public Long getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(Long leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public Double getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Double totalDays) {
        this.totalDays = totalDays;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDate getApprovedDate() {
        return approvedDate;
    }

    public void setApprovedDate(LocalDate approvedDate) {
        this.approvedDate = approvedDate;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Boolean getHalfDay() {
        return halfDay;
    }

    public void setHalfDay(Boolean halfDay) {
        this.halfDay = halfDay;
    }

    public String getHalfDayType() {
        return halfDayType;
    }

    public void setHalfDayType(String halfDayType) {
        this.halfDayType = halfDayType;
    }
}

