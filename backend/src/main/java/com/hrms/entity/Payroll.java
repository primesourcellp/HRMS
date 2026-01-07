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
    private String status = "DRAFT"; // DRAFT, PENDING_APPROVAL, APPROVED, FINALIZED, PAID

    @Column(columnDefinition = "TEXT")
    private String notes;

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
}
