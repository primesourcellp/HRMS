package com.hrms.dto;

import java.time.LocalDate;

public class LeaveBalanceDTO {
    private Long id;
    private Long employeeId;
    private Long leaveTypeId;
    private Integer year;
    private Double totalDays;
    private Double usedDays;
    private Double carriedForward;
    private Double balance;
    private LocalDate lastUpdated;

    // Constructors
    public LeaveBalanceDTO() {
    }

    public LeaveBalanceDTO(Long id, Long employeeId, Long leaveTypeId, Integer year,
                         Double totalDays, Double usedDays, Double carriedForward,
                         Double balance, LocalDate lastUpdated) {
        this.id = id;
        this.employeeId = employeeId;
        this.leaveTypeId = leaveTypeId;
        this.year = year;
        this.totalDays = totalDays;
        this.usedDays = usedDays;
        this.carriedForward = carriedForward;
        this.balance = balance;
        this.lastUpdated = lastUpdated;
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

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Double getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Double totalDays) {
        this.totalDays = totalDays;
    }

    public Double getUsedDays() {
        return usedDays;
    }

    public void setUsedDays(Double usedDays) {
        this.usedDays = usedDays;
    }

    public Double getCarriedForward() {
        return carriedForward;
    }

    public void setCarriedForward(Double carriedForward) {
        this.carriedForward = carriedForward;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public LocalDate getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDate lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}

