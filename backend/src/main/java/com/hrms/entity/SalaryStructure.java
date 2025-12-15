package com.hrms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "salary_structures")
public class SalaryStructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "basic_salary", nullable = false)
    private Double basicSalary;

    @Column(name = "hra") // House Rent Allowance
    private Double hra;

    @Column(name = "transport_allowance")
    private Double transportAllowance;

    @Column(name = "medical_allowance")
    private Double medicalAllowance;

    @Column(name = "special_allowance")
    private Double specialAllowance;

    @Column(name = "other_allowances")
    private Double otherAllowances;

    @Column(name = "pf") // Provident Fund
    private Double pf;

    @Column(name = "esi") // Employee State Insurance
    private Double esi;

    @Column(name = "tds") // Tax Deducted at Source
    private Double tds;

    @Column(name = "professional_tax")
    private Double professionalTax;

    @Column(name = "other_deductions")
    private Double otherDeductions;

    @Column(name = "gross_salary", nullable = false)
    private Double grossSalary; // Basic + All Allowances

    @Column(name = "net_salary", nullable = false)
    private Double netSalary; // Gross - All Deductions

    @Column(name = "effective_from", nullable = false)
    private java.time.LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private java.time.LocalDate effectiveTo;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private Employee employee;

    // Constructors
    public SalaryStructure() {
        this.effectiveFrom = java.time.LocalDate.now();
    }

    public SalaryStructure(Long id, Long employeeId, Double basicSalary, Double hra, 
                          Double transportAllowance, Double medicalAllowance, Double specialAllowance,
                          Double otherAllowances, Double pf, Double esi, Double tds, Double professionalTax,
                          Double otherDeductions, Double grossSalary, Double netSalary,
                          java.time.LocalDate effectiveFrom, java.time.LocalDate effectiveTo, 
                          Boolean active, Employee employee) {
        this.id = id;
        this.employeeId = employeeId;
        this.basicSalary = basicSalary;
        this.hra = hra;
        this.transportAllowance = transportAllowance;
        this.medicalAllowance = medicalAllowance;
        this.specialAllowance = specialAllowance;
        this.otherAllowances = otherAllowances;
        this.pf = pf;
        this.esi = esi;
        this.tds = tds;
        this.professionalTax = professionalTax;
        this.otherDeductions = otherDeductions;
        this.grossSalary = grossSalary;
        this.netSalary = netSalary;
        this.effectiveFrom = effectiveFrom != null ? effectiveFrom : java.time.LocalDate.now();
        this.effectiveTo = effectiveTo;
        this.active = active != null ? active : true;
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

    public Double getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(Double basicSalary) {
        this.basicSalary = basicSalary;
    }

    public Double getHra() {
        return hra;
    }

    public void setHra(Double hra) {
        this.hra = hra;
    }

    public Double getTransportAllowance() {
        return transportAllowance;
    }

    public void setTransportAllowance(Double transportAllowance) {
        this.transportAllowance = transportAllowance;
    }

    public Double getMedicalAllowance() {
        return medicalAllowance;
    }

    public void setMedicalAllowance(Double medicalAllowance) {
        this.medicalAllowance = medicalAllowance;
    }

    public Double getSpecialAllowance() {
        return specialAllowance;
    }

    public void setSpecialAllowance(Double specialAllowance) {
        this.specialAllowance = specialAllowance;
    }

    public Double getOtherAllowances() {
        return otherAllowances;
    }

    public void setOtherAllowances(Double otherAllowances) {
        this.otherAllowances = otherAllowances;
    }

    public Double getPf() {
        return pf;
    }

    public void setPf(Double pf) {
        this.pf = pf;
    }

    public Double getEsi() {
        return esi;
    }

    public void setEsi(Double esi) {
        this.esi = esi;
    }

    public Double getTds() {
        return tds;
    }

    public void setTds(Double tds) {
        this.tds = tds;
    }

    public Double getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(Double professionalTax) {
        this.professionalTax = professionalTax;
    }

    public Double getOtherDeductions() {
        return otherDeductions;
    }

    public void setOtherDeductions(Double otherDeductions) {
        this.otherDeductions = otherDeductions;
    }

    public Double getGrossSalary() {
        return grossSalary;
    }

    public void setGrossSalary(Double grossSalary) {
        this.grossSalary = grossSalary;
    }

    public Double getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(Double netSalary) {
        this.netSalary = netSalary;
    }

    public java.time.LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(java.time.LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public java.time.LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(java.time.LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
}

