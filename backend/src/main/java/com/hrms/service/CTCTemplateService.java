package com.hrms.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.CTCTemplate;
import com.hrms.entity.SalaryStructure;
import com.hrms.repository.CTCTemplateRepository;

/**
 * CTC Template Service for Multi-Client Payroll Management
 * Handles CTC to Salary Structure conversion based on client-specific rules
 */
@Service
public class CTCTemplateService {
    
    @Autowired
    private CTCTemplateRepository ctcTemplateRepository;
    
    public CTCTemplate createTemplate(CTCTemplate template) {
        CTCTemplate nonNullTemplate = Objects.requireNonNull(template, "CTC Template must not be null");
        return ctcTemplateRepository.save(nonNullTemplate);
    }
    
    public CTCTemplate updateTemplate(Long id, CTCTemplate template) {
        Long nonNullId = Objects.requireNonNull(id, "CTC Template id must not be null");
        CTCTemplate nonNullTemplate = Objects.requireNonNull(template, "CTC Template must not be null");

        CTCTemplate existing = ctcTemplateRepository.findById(nonNullId)
            .orElseThrow(() -> new RuntimeException("CTC Template not found"));
        
        existing.setTemplateName(nonNullTemplate.getTemplateName());
        existing.setClientName(nonNullTemplate.getClientName());
        existing.setDescription(nonNullTemplate.getDescription());
        existing.setBasicSalaryPercentage(nonNullTemplate.getBasicSalaryPercentage());
        existing.setHraPercentage(nonNullTemplate.getHraPercentage());
        existing.setTransportAllowancePercentage(nonNullTemplate.getTransportAllowancePercentage());
        existing.setTransportAllowanceFixed(nonNullTemplate.getTransportAllowanceFixed());
        existing.setMedicalAllowancePercentage(nonNullTemplate.getMedicalAllowancePercentage());
        existing.setMedicalAllowanceFixed(nonNullTemplate.getMedicalAllowanceFixed());
        existing.setSpecialAllowancePercentage(nonNullTemplate.getSpecialAllowancePercentage());
        existing.setSpecialAllowanceFixed(nonNullTemplate.getSpecialAllowanceFixed());
        existing.setOtherAllowancesPercentage(nonNullTemplate.getOtherAllowancesPercentage());
        existing.setPfPercentage(nonNullTemplate.getPfPercentage());
        existing.setEsiPercentage(nonNullTemplate.getEsiPercentage());
        existing.setEsiApplicableThreshold(nonNullTemplate.getEsiApplicableThreshold());
        existing.setProfessionalTaxAmount(nonNullTemplate.getProfessionalTaxAmount());
        existing.setTdsPercentage(nonNullTemplate.getTdsPercentage());
        existing.setOtherDeductionsPercentage(nonNullTemplate.getOtherDeductionsPercentage());
        existing.setActive(nonNullTemplate.getActive());
        
        return ctcTemplateRepository.save(existing);
    }
    
    public void deleteTemplate(Long id) {
        Long nonNullId = Objects.requireNonNull(id, "CTC Template id must not be null");
        CTCTemplate template = ctcTemplateRepository.findById(nonNullId)
            .orElseThrow(() -> new RuntimeException("CTC Template not found"));
        ctcTemplateRepository.delete(Objects.requireNonNull(template, "CTC Template must not be null"));
    }
    
    public Optional<CTCTemplate> getTemplateById(Long id) {
        Long nonNullId = Objects.requireNonNull(id, "CTC Template id must not be null");
        return ctcTemplateRepository.findById(nonNullId);
    }
    
    public List<CTCTemplate> getAllTemplates() {
        return ctcTemplateRepository.findAll();
    }
    
    public List<CTCTemplate> getActiveTemplates() {
        return ctcTemplateRepository.findByActiveTrue();
    }
    
    public List<CTCTemplate> getTemplatesByClient(String clientName) {
        return ctcTemplateRepository.findByClientNameAndActiveTrue(clientName);
    }
    
    /**
     * Convert Annual CTC to Salary Structure using template rules
     * Core functionality: Auto-generate salary breakup per client rules
     */
    public SalaryStructure convertCTCToSalaryStructure(Double annualCtc, Long templateId) {
        Long nonNullTemplateId = Objects.requireNonNull(templateId, "Template id must not be null");
        CTCTemplate template = ctcTemplateRepository.findById(nonNullTemplateId)
            .orElseThrow(() -> new RuntimeException("CTC Template not found"));
        
        return convertCTCToSalaryStructure(annualCtc, template);
    }
    
    /**
     * Convert Annual CTC to Salary Structure using template
     * Implements client-specific rules for salary component calculation
     */
    @SuppressWarnings("UnnecessaryUnboxing")
    public SalaryStructure convertCTCToSalaryStructure(Double annualCtc, CTCTemplate template) {
        if (annualCtc == null || annualCtc <= 0) {
            throw new RuntimeException("Annual CTC must be greater than 0");
        }
        
        double monthlyCtc = annualCtc / 12.0;
        SalaryStructure structure = new SalaryStructure();
        
        // Calculate Basic Salary (percentage of monthly CTC)
        Double basicPctBoxed = template.getBasicSalaryPercentage();
        double basicPct = basicPctBoxed != null ? basicPctBoxed.doubleValue() : 40.0;
        double basicSalary = (monthlyCtc * basicPct) / 100.0;
        structure.setBasicSalary(basicSalary);
        
        // Calculate HRA (percentage of Basic Salary)
        Double hraPctBoxed = template.getHraPercentage();
        double hraPercentage = hraPctBoxed != null ? hraPctBoxed.doubleValue() : 50.0;
        double hra = (basicSalary * hraPercentage) / 100.0;
        structure.setHra(hra);
        
        // Calculate Transport Allowance (Fixed amount takes precedence over percentage)
        Double transportAllowance = 0.0;
        if (template.getTransportAllowanceFixed() != null && template.getTransportAllowanceFixed() > 0) {
            transportAllowance = template.getTransportAllowanceFixed();
        } else if (template.getTransportAllowancePercentage() != null && template.getTransportAllowancePercentage() > 0) {
            transportAllowance = (monthlyCtc * template.getTransportAllowancePercentage()) / 100.0;
        }
        structure.setTransportAllowance(transportAllowance);
        
        // Calculate Medical Allowance
        Double medicalAllowance = 0.0;
        if (template.getMedicalAllowanceFixed() != null && template.getMedicalAllowanceFixed() > 0) {
            medicalAllowance = template.getMedicalAllowanceFixed();
        } else if (template.getMedicalAllowancePercentage() != null && template.getMedicalAllowancePercentage() > 0) {
            medicalAllowance = (monthlyCtc * template.getMedicalAllowancePercentage()) / 100.0;
        }
        structure.setMedicalAllowance(medicalAllowance);
        
        // Calculate Special Allowance
        Double specialAllowance = 0.0;
        if (template.getSpecialAllowanceFixed() != null && template.getSpecialAllowanceFixed() > 0) {
            specialAllowance = template.getSpecialAllowanceFixed();
        } else if (template.getSpecialAllowancePercentage() != null && template.getSpecialAllowancePercentage() > 0) {
            specialAllowance = (monthlyCtc * template.getSpecialAllowancePercentage()) / 100.0;
        }
        structure.setSpecialAllowance(specialAllowance);
        
        // Calculate Other Allowances (percentage only)
        Double otherAllowances = 0.0;
        if (template.getOtherAllowancesPercentage() != null && template.getOtherAllowancesPercentage() > 0) {
            otherAllowances = (monthlyCtc * template.getOtherAllowancesPercentage()) / 100.0;
        }
        structure.setOtherAllowances(otherAllowances);
        
        // Calculate Gross Salary
        Double grossSalary = basicSalary + hra + transportAllowance + medicalAllowance + specialAllowance + otherAllowances;
        structure.setGrossSalary(grossSalary);
        
        // Calculate Deductions
        // PF (Employee share - percentage of Basic)
        Double pfPctBoxed = template.getPfPercentage();
        double pfPercentage = pfPctBoxed != null ? pfPctBoxed.doubleValue() : 12.0;
        double pf = (basicSalary * pfPercentage) / 100.0;
        structure.setPf(pf);
        
        // ESI (percentage of Gross if applicable)
        double esi = 0.0;
        Double esiThresholdBoxed = template.getEsiApplicableThreshold();
        double esiThreshold = esiThresholdBoxed != null ? esiThresholdBoxed.doubleValue() : 21000.0;
        if (grossSalary <= esiThreshold) {
            Double esiPctBoxed = template.getEsiPercentage();
            double esiPercentage = esiPctBoxed != null ? esiPctBoxed.doubleValue() : 0.75;
            esi = (grossSalary * esiPercentage) / 100.0;
        }
        structure.setEsi(esi);
        
        // Professional Tax (fixed amount)
        Double professionalTaxBoxed = template.getProfessionalTaxAmount();
        double professionalTax = professionalTaxBoxed != null ? professionalTaxBoxed.doubleValue() : 0.0;
        structure.setProfessionalTax(professionalTax);
        
        // TDS (percentage based on tax slab)
        Double tds = 0.0;
        if (template.getTdsPercentage() != null && template.getTdsPercentage() > 0) {
            tds = (grossSalary * template.getTdsPercentage()) / 100.0;
        }
        structure.setTds(tds);
        
        // Other Deductions
        Double otherDeductions = 0.0;
        if (template.getOtherDeductionsPercentage() != null && template.getOtherDeductionsPercentage() > 0) {
            otherDeductions = (grossSalary * template.getOtherDeductionsPercentage()) / 100.0;
        }
        structure.setOtherDeductions(otherDeductions);
        
        // Calculate Net Salary
        Double totalDeductions = pf + esi + professionalTax + tds + otherDeductions;
        Double netSalary = grossSalary - totalDeductions;
        structure.setNetSalary(netSalary);
        
        return structure;
    }
}

