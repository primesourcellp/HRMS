package com.hrms.dto;

import java.time.LocalDate;

public class TeamMemberDTO {
    private Long id;
    private Long teamId;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private String employeeRole; // Actual employee role from User entity
    private String role; // Team role: EMPLOYEE, MANAGER, HR_ADMIN, FINANCE
    private LocalDate assignedDate;

    // Constructors
    public TeamMemberDTO() {
    }

    public TeamMemberDTO(Long id, Long teamId, Long employeeId, String employeeName, String employeeEmail, String role, LocalDate assignedDate) {
        this.id = id;
        this.teamId = teamId;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeEmail = employeeEmail;
        this.role = role;
        this.assignedDate = assignedDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
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

    public String getEmployeeRole() {
        return employeeRole;
    }

    public void setEmployeeRole(String employeeRole) {
        this.employeeRole = employeeRole;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDate getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(LocalDate assignedDate) {
        this.assignedDate = assignedDate;
    }
}

