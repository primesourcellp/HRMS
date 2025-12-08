package com.hrms.dto;

import java.time.LocalDate;

public class SalaryStructureDTO {
    private Long id;
    private Long employeeId;
    private Double basicSalary;
    private Double hra;
    private Double transportAllowance;
    private Double medicalAllowance;
    private Double specialAllowance;
    private Double otherAllowances;
    private Double pf;
    private Double esi;
    private Double tds;
    private Double professionalTax;
    private Double otherDeductions;
    private Double grossSalary;
    private Double netSalary;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean active;

    // Constructors
    public SalaryStructureDTO() {
    }

    public SalaryStructureDTO(Long id, Long employeeId, Double basicSalary, Double hra,
                             Double transportAllowance, Double medicalAllowance, Double specialAllowance,
                             Double otherAllowances, Double pf, Double esi, Double tds, Double professionalTax,
                             Double otherDeductions, Double grossSalary, Double netSalary,
                             LocalDate effectiveFrom, LocalDate effectiveTo, Boolean active) {
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
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.active = active;
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

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}

