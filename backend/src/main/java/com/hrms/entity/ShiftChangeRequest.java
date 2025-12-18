package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_change_requests")
public class ShiftChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "current_shift_id", nullable = false)
    private Long currentShiftId;

    @Column(name = "requested_shift_id", nullable = false)
    private Long requestedShiftId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "requested_date", nullable = false, updatable = false)
    private LocalDateTime requestedDate;

    @Column(name = "reviewed_date")
    private LocalDateTime reviewedDate;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @PrePersist
    protected void onCreate() {
        requestedDate = LocalDateTime.now();
    }

    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }

    // Constructors
    public ShiftChangeRequest() {
    }

    public ShiftChangeRequest(Long employeeId, Long currentShiftId, Long requestedShiftId, String reason) {
        this.employeeId = employeeId;
        this.currentShiftId = currentShiftId;
        this.requestedShiftId = requestedShiftId;
        this.reason = reason;
        this.status = RequestStatus.PENDING;
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

    public Long getCurrentShiftId() {
        return currentShiftId;
    }

    public void setCurrentShiftId(Long currentShiftId) {
        this.currentShiftId = currentShiftId;
    }

    public Long getRequestedShiftId() {
        return requestedShiftId;
    }

    public void setRequestedShiftId(Long requestedShiftId) {
        this.requestedShiftId = requestedShiftId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestedDate() {
        return requestedDate;
    }

    public void setRequestedDate(LocalDateTime requestedDate) {
        this.requestedDate = requestedDate;
    }

    public LocalDateTime getReviewedDate() {
        return reviewedDate;
    }

    public void setReviewedDate(LocalDateTime reviewedDate) {
        this.reviewedDate = reviewedDate;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(Long reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}

