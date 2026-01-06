package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * CTC Template Entity for Multi-Client Payroll Management
 * Allows HR Admin to create client-specific salary structure templates
 */
@Entity
@Table(name = "ctc_templates")
public class CTCTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "template_name", nullable = false, length = 255)
    private String templateName;
    
    @Column(name = "client_name", nullable = false, length = 255)
    private String clientName;
    
    @Column(name = "description", length = 1000)
    private String description;
    
    // Basic Salary Calculation (as percentage of CTC)
    @Column(name = "basic_salary_percentage", nullable = false)
    private Double basicSalaryPercentage = 40.0;
    
    // HRA Calculation (as percentage of Basic Salary)
    @Column(name = "hra_percentage", nullable = false)
    private Double hraPercentage = 50.0;
    
    // Allowances (can be percentage of CTC or fixed amount)
    @Column(name = "transport_allowance_percentage")
    private Double transportAllowancePercentage;
    
    @Column(name = "transport_allowance_fixed")
    private Double transportAllowanceFixed;
    
    @Column(name = "medical_allowance_percentage")
    private Double medicalAllowancePercentage;
    
    @Column(name = "medical_allowance_fixed")
    private Double medicalAllowanceFixed;
    
    @Column(name = "special_allowance_percentage")
    private Double specialAllowancePercentage;
    
    @Column(name = "special_allowance_fixed")
    private Double specialAllowanceFixed;
    
    @Column(name = "other_allowances_percentage")
    private Double otherAllowancesPercentage;
    
    // Deductions
    @Column(name = "pf_percentage", nullable = false)
    private Double pfPercentage = 12.0;
    
    @Column(name = "esi_percentage")
    private Double esiPercentage = 0.75;
    
    @Column(name = "esi_applicable_threshold")
    private Double esiApplicableThreshold = 21000.0;
    
    @Column(name = "professional_tax_amount")
    private Double professionalTaxAmount;
    
    @Column(name = "tds_percentage")
    private Double tdsPercentage;
    
    @Column(name = "other_deductions_percentage")
    private Double otherDeductionsPercentage;
    
    // Status and Metadata
    @Column(name = "active", nullable = false)
    private Boolean active = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public CTCTemplate() {
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }
    
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getBasicSalaryPercentage() { return basicSalaryPercentage; }
    public void setBasicSalaryPercentage(Double basicSalaryPercentage) { this.basicSalaryPercentage = basicSalaryPercentage; }
    
    public Double getHraPercentage() { return hraPercentage; }
    public void setHraPercentage(Double hraPercentage) { this.hraPercentage = hraPercentage; }
    
    public Double getTransportAllowancePercentage() { return transportAllowancePercentage; }
    public void setTransportAllowancePercentage(Double transportAllowancePercentage) { this.transportAllowancePercentage = transportAllowancePercentage; }
    
    public Double getTransportAllowanceFixed() { return transportAllowanceFixed; }
    public void setTransportAllowanceFixed(Double transportAllowanceFixed) { this.transportAllowanceFixed = transportAllowanceFixed; }
    
    public Double getMedicalAllowancePercentage() { return medicalAllowancePercentage; }
    public void setMedicalAllowancePercentage(Double medicalAllowancePercentage) { this.medicalAllowancePercentage = medicalAllowancePercentage; }
    
    public Double getMedicalAllowanceFixed() { return medicalAllowanceFixed; }
    public void setMedicalAllowanceFixed(Double medicalAllowanceFixed) { this.medicalAllowanceFixed = medicalAllowanceFixed; }
    
    public Double getSpecialAllowancePercentage() { return specialAllowancePercentage; }
    public void setSpecialAllowancePercentage(Double specialAllowancePercentage) { this.specialAllowancePercentage = specialAllowancePercentage; }
    
    public Double getSpecialAllowanceFixed() { return specialAllowanceFixed; }
    public void setSpecialAllowanceFixed(Double specialAllowanceFixed) { this.specialAllowanceFixed = specialAllowanceFixed; }
    
    public Double getOtherAllowancesPercentage() { return otherAllowancesPercentage; }
    public void setOtherAllowancesPercentage(Double otherAllowancesPercentage) { this.otherAllowancesPercentage = otherAllowancesPercentage; }
    
    public Double getPfPercentage() { return pfPercentage; }
    public void setPfPercentage(Double pfPercentage) { this.pfPercentage = pfPercentage; }
    
    public Double getEsiPercentage() { return esiPercentage; }
    public void setEsiPercentage(Double esiPercentage) { this.esiPercentage = esiPercentage; }
    
    public Double getEsiApplicableThreshold() { return esiApplicableThreshold; }
    public void setEsiApplicableThreshold(Double esiApplicableThreshold) { this.esiApplicableThreshold = esiApplicableThreshold; }
    
    public Double getProfessionalTaxAmount() { return professionalTaxAmount; }
    public void setProfessionalTaxAmount(Double professionalTaxAmount) { this.professionalTaxAmount = professionalTaxAmount; }
    
    public Double getTdsPercentage() { return tdsPercentage; }
    public void setTdsPercentage(Double tdsPercentage) { this.tdsPercentage = tdsPercentage; }
    
    public Double getOtherDeductionsPercentage() { return otherDeductionsPercentage; }
    public void setOtherDeductionsPercentage(Double otherDeductionsPercentage) { this.otherDeductionsPercentage = otherDeductionsPercentage; }
    
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

