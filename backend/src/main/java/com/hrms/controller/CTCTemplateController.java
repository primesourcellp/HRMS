package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.CTCTemplateDTO;
import com.hrms.entity.CTCTemplate;
import com.hrms.entity.SalaryStructure;
import com.hrms.service.CTCTemplateService;

/**
 * CTC Template Controller for Multi-Client Payroll Management
 * 
 * Use Case 1: Multi-Client Payroll Management (Staffing Companies)
 * - HR Admin creates client-specific CTC templates
 * - Employee CTC is entered once
 * - System auto-generates salary breakup per client rules
 * - Payroll is processed monthly with statutory compliance
 * - Client-wise segregation
 */
@RestController
@RequestMapping("/api/ctc-templates")
@CrossOrigin(origins = "http://localhost:3000")
public class CTCTemplateController {
    
    @Autowired
    private CTCTemplateService ctcTemplateService;
    
    @GetMapping
    public ResponseEntity<List<CTCTemplateDTO>> getAllTemplates(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) Boolean activeOnly) {
        try {
            List<CTCTemplate> templates;
            if (clientName != null && !clientName.isEmpty()) {
                templates = ctcTemplateService.getTemplatesByClient(clientName);
            } else if (activeOnly != null && activeOnly) {
                templates = ctcTemplateService.getActiveTemplates();
            } else {
                templates = ctcTemplateService.getAllTemplates();
            }
            return ResponseEntity.ok(mapToDTOList(templates));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }
    
    /**
     * Convert Annual CTC to Salary Structure using template
     * Core endpoint: Auto-generate salary breakup per client rules
     * IMPORTANT: This endpoint must come BEFORE @GetMapping("/{id}") to avoid path variable conflicts
<<<<<<< HEAD
     * Using explicit path mapping to ensure it's matched before the generic {id} pattern
=======
>>>>>>> master
     */
    @PostMapping("/convert-ctc")
    public ResponseEntity<Map<String, Object>> convertCTCToSalaryStructure(
            @RequestParam Double annualCtc,
            @RequestParam Long templateId) {
        Map<String, Object> response = new HashMap<>();
        try {
            SalaryStructure structure = ctcTemplateService.convertCTCToSalaryStructure(annualCtc, templateId);
            CTCTemplate template = ctcTemplateService.getTemplateById(templateId).orElse(null);
            
            // Convert to map for response
            Map<String, Object> structureMap = new HashMap<>();
            structureMap.put("basicSalary", structure.getBasicSalary());
            structureMap.put("hra", structure.getHra());
            structureMap.put("transportAllowance", structure.getTransportAllowance());
            structureMap.put("medicalAllowance", structure.getMedicalAllowance());
            structureMap.put("specialAllowance", structure.getSpecialAllowance());
            structureMap.put("otherAllowances", structure.getOtherAllowances());
            structureMap.put("grossSalary", structure.getGrossSalary());
            structureMap.put("pf", structure.getPf());
            structureMap.put("esi", structure.getEsi());
            structureMap.put("professionalTax", structure.getProfessionalTax());
            structureMap.put("tds", structure.getTds());
            structureMap.put("otherDeductions", structure.getOtherDeductions());
            structureMap.put("netSalary", structure.getNetSalary());
            // Include CTC information in response
            structureMap.put("annualCtc", annualCtc);
            structureMap.put("monthlyCtc", annualCtc / 12.0);
            structureMap.put("client", template != null ? template.getClientName() : null);
            
            response.put("success", true);
            response.put("salaryStructure", structureMap);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTemplateById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<CTCTemplate> templateOpt = ctcTemplateService.getTemplateById(id);
            if (templateOpt.isPresent()) {
                response.put("success", true);
                response.put("template", mapToDTO(templateOpt.get()));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "CTC Template not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTemplate(@RequestBody CTCTemplate template) {
        Map<String, Object> response = new HashMap<>();
        try {
            CTCTemplate created = ctcTemplateService.createTemplate(template);
            response.put("success", true);
            response.put("template", mapToDTO(created));
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTemplate(@PathVariable Long id, @RequestBody CTCTemplate template) {
        Map<String, Object> response = new HashMap<>();
        try {
            CTCTemplate updated = ctcTemplateService.updateTemplate(id, template);
            response.put("success", true);
            response.put("template", mapToDTO(updated));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTemplate(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            ctcTemplateService.deleteTemplate(id);
            response.put("success", true);
            response.put("message", "CTC Template deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    // Helper methods to map Entity to DTO
    private CTCTemplateDTO mapToDTO(CTCTemplate template) {
        if (template == null) return null;
        CTCTemplateDTO dto = new CTCTemplateDTO();
        dto.setId(template.getId());
        dto.setTemplateName(template.getTemplateName());
        dto.setClientName(template.getClientName());
        dto.setDescription(template.getDescription());
        dto.setBasicSalaryPercentage(template.getBasicSalaryPercentage());
        dto.setHraPercentage(template.getHraPercentage());
        dto.setTransportAllowancePercentage(template.getTransportAllowancePercentage());
        dto.setTransportAllowanceFixed(template.getTransportAllowanceFixed());
        dto.setMedicalAllowancePercentage(template.getMedicalAllowancePercentage());
        dto.setMedicalAllowanceFixed(template.getMedicalAllowanceFixed());
        dto.setSpecialAllowancePercentage(template.getSpecialAllowancePercentage());
        dto.setSpecialAllowanceFixed(template.getSpecialAllowanceFixed());
        dto.setOtherAllowancesPercentage(template.getOtherAllowancesPercentage());
        dto.setPfPercentage(template.getPfPercentage());
        dto.setEsiPercentage(template.getEsiPercentage());
        dto.setEsiApplicableThreshold(template.getEsiApplicableThreshold());
        dto.setProfessionalTaxAmount(template.getProfessionalTaxAmount());
        dto.setTdsPercentage(template.getTdsPercentage());
        dto.setOtherDeductionsPercentage(template.getOtherDeductionsPercentage());
        dto.setActive(template.getActive());
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());
        return dto;
    }
    
    private List<CTCTemplateDTO> mapToDTOList(List<CTCTemplate> templates) {
        return templates.stream().map(this::mapToDTO).toList();
    }
}

