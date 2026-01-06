package com.hrms.dto;

import java.time.LocalDateTime;

public class CTCTemplateDTO {
    private Long id;
    private String templateName;
    private String clientName;
    private String description;
    private Double basicSalaryPercentage;
    private Double hraPercentage;
    private Double transportAllowancePercentage;
    private Double transportAllowanceFixed;
    private Double medicalAllowancePercentage;
    private Double medicalAllowanceFixed;
    private Double specialAllowancePercentage;
    private Double specialAllowanceFixed;
    private Double otherAllowancesPercentage;
    private Double pfPercentage;
    private Double esiPercentage;
    private Double esiApplicableThreshold;
    private Double professionalTaxAmount;
    private Double tdsPercentage;
    private Double otherDeductionsPercentage;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
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

