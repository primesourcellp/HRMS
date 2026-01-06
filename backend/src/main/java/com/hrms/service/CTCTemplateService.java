package com.hrms.service;

import com.hrms.entity.CTCTemplate;
import com.hrms.entity.SalaryStructure;
import com.hrms.repository.CTCTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * CTC Template Service for Multi-Client Payroll Management
 * Handles CTC to Salary Structure conversion based on client-specific rules
 */
@Service
public class CTCTemplateService {
    
    @Autowired
    private CTCTemplateRepository ctcTemplateRepository;
    
    public CTCTemplate createTemplate(CTCTemplate template) {
        return ctcTemplateRepository.save(template);
    }
    
    public CTCTemplate updateTemplate(Long id, CTCTemplate template) {
        CTCTemplate existing = ctcTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CTC Template not found"));
        
        existing.setTemplateName(template.getTemplateName());
        existing.setClientName(template.getClientName());
        existing.setDescription(template.getDescription());
        existing.setBasicSalaryPercentage(template.getBasicSalaryPercentage());
        existing.setHraPercentage(template.getHraPercentage());
        existing.setTransportAllowancePercentage(template.getTransportAllowancePercentage());
        existing.setTransportAllowanceFixed(template.getTransportAllowanceFixed());
        existing.setMedicalAllowancePercentage(template.getMedicalAllowancePercentage());
        existing.setMedicalAllowanceFixed(template.getMedicalAllowanceFixed());
        existing.setSpecialAllowancePercentage(template.getSpecialAllowancePercentage());
        existing.setSpecialAllowanceFixed(template.getSpecialAllowanceFixed());
        existing.setOtherAllowancesPercentage(template.getOtherAllowancesPercentage());
        existing.setPfPercentage(template.getPfPercentage());
        existing.setEsiPercentage(template.getEsiPercentage());
        existing.setEsiApplicableThreshold(template.getEsiApplicableThreshold());
        existing.setProfessionalTaxAmount(template.getProfessionalTaxAmount());
        existing.setTdsPercentage(template.getTdsPercentage());
        existing.setOtherDeductionsPercentage(template.getOtherDeductionsPercentage());
        existing.setActive(template.getActive());
        
        return ctcTemplateRepository.save(existing);
    }
    
    public void deleteTemplate(Long id) {
        CTCTemplate template = ctcTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CTC Template not found"));
        template.setActive(false);
        ctcTemplateRepository.save(template);
    }
    
    public Optional<CTCTemplate> getTemplateById(Long id) {
        return ctcTemplateRepository.findById(id);
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
        CTCTemplate template = ctcTemplateRepository.findById(templateId)
            .orElseThrow(() -> new RuntimeException("CTC Template not found"));
        
        return convertCTCToSalaryStructure(annualCtc, template);
    }
    
    /**
     * Convert Annual CTC to Salary Structure using template
     * Implements client-specific rules for salary component calculation
     */
    public SalaryStructure convertCTCToSalaryStructure(Double annualCtc, CTCTemplate template) {
        if (annualCtc == null || annualCtc <= 0) {
            throw new RuntimeException("Annual CTC must be greater than 0");
        }
        
        Double monthlyCtc = annualCtc / 12.0;
        SalaryStructure structure = new SalaryStructure();
        
        // Calculate Basic Salary (percentage of monthly CTC)
        Double basicSalary = (monthlyCtc * (template.getBasicSalaryPercentage() != null ? template.getBasicSalaryPercentage() : 40.0)) / 100.0;
        structure.setBasicSalary(basicSalary);
        
        // Calculate HRA (percentage of Basic Salary)
        Double hraPercentage = template.getHraPercentage() != null ? template.getHraPercentage() : 50.0;
        Double hra = (basicSalary * hraPercentage) / 100.0;
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
        Double pfPercentage = template.getPfPercentage() != null ? template.getPfPercentage() : 12.0;
        Double pf = (basicSalary * pfPercentage) / 100.0;
        structure.setPf(pf);
        
        // ESI (percentage of Gross if applicable)
        Double esi = 0.0;
        Double esiThreshold = template.getEsiApplicableThreshold() != null ? template.getEsiApplicableThreshold() : 21000.0;
        if (grossSalary <= esiThreshold) {
            Double esiPercentage = template.getEsiPercentage() != null ? template.getEsiPercentage() : 0.75;
            esi = (grossSalary * esiPercentage) / 100.0;
        }
        structure.setEsi(esi);
        
        // Professional Tax (fixed amount)
        Double professionalTax = template.getProfessionalTaxAmount() != null ? template.getProfessionalTaxAmount() : 0.0;
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

