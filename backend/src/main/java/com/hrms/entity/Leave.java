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
@Table(name = "leaves")
public class Leave {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "leave_type_id", nullable = false)
    private Long leaveTypeId;

    @Column(nullable = false)
    private String type; // Sick Leave, Vacation, Personal, etc. (for backward compatibility)

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    private Double totalDays; // Calculated total days

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(name = "applied_date", nullable = false)
    private LocalDate appliedDate;

    @Column(name = "approved_by")
    private Long approvedBy; // Manager/HR user ID

    @Column(name = "approved_date")
    private LocalDate approvedDate;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "half_day")
    private Boolean halfDay = false;

    @Column(name = "half_day_type")
    private String halfDayType; // FIRST_HALF, SECOND_HALF

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    @JsonIgnore
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", insertable = false, updatable = false)
    @JsonIgnore
    private LeaveType leaveType;

    // Constructors
    public Leave() {
        this.appliedDate = LocalDate.now();
    }

    public Leave(Long id, Long employeeId, Long leaveTypeId, String type, LocalDate startDate, 
                LocalDate endDate, Double totalDays, String reason, String status, 
                LocalDate appliedDate, Long approvedBy, LocalDate approvedDate, 
                String rejectionReason, Boolean halfDay, String halfDayType, 
                User employee, LeaveType leaveType) {
        this.id = id;
        this.employeeId = employeeId;
        this.leaveTypeId = leaveTypeId;
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.reason = reason;
        this.status = status != null ? status : "PENDING";
        this.appliedDate = appliedDate != null ? appliedDate : LocalDate.now();
        this.approvedBy = approvedBy;
        this.approvedDate = approvedDate;
        this.rejectionReason = rejectionReason;
        this.halfDay = halfDay != null ? halfDay : false;
        this.halfDayType = halfDayType;
        this.employee = employee;
        this.leaveType = leaveType;
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

    public Long getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(Long leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public Double getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Double totalDays) {
        this.totalDays = totalDays;
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

    public User getEmployee() {
        return employee;
    }

    public void setEmployee(User employee) {
        this.employee = employee;
    }

    public LeaveType getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(LeaveType leaveType) {
        this.leaveType = leaveType;
    }
}
