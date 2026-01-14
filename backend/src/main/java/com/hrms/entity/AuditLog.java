package com.hrms.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false)
    private String entityType; // PAYROLL, SALARY_STRUCTURE, LEAVE, ATTENDANCE, etc.

    @Column(name = "entity_id")
    private Long entityId; // ID of the affected entity

    @Column(name = "action", nullable = false)
    private String action; // CREATE, UPDATE, DELETE, APPROVE, REJECT, FINALIZE, etc.

    @Column(name = "user_id", nullable = false)
    private Long userId; // User who performed the action

    @Column(name = "user_name")
    private String userName; // User name for quick reference

    @Column(name = "user_role")
    private String userRole; // User role for audit trail

    @Column(name = "employee_id")
    private Long employeeId; // Affected employee ID (if applicable)

    @Column(name = "employee_name")
    private String employeeName; // Employee name for quick reference

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue; // JSON representation of old values

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue; // JSON representation of new values

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Human-readable description

    @Column(name = "ip_address")
    private String ipAddress; // IP address of the user

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    // Constructors
    public AuditLog() {
    }

    public AuditLog(String entityType, Long entityId, String action, Long userId, String userName, String userRole) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
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

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

