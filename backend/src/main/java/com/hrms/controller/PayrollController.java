package com.hrms.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.hrms.dto.PayrollDTO;
import com.hrms.entity.User;
import com.hrms.entity.Payroll;
import com.hrms.entity.SalaryStructure;
import com.hrms.mapper.DTOMapper;
import com.hrms.service.PayrollService;
import com.hrms.service.SalaryStructureService;
import com.hrms.util.PDFGeneratorService;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "http://localhost:3000")
public class PayrollController {

    @Autowired
    private PayrollService payrollService;

    @Autowired
    private SalaryStructureService salaryStructureService;

    @Autowired
    private PDFGeneratorService pdfGeneratorService;

    @GetMapping
    public ResponseEntity<List<PayrollDTO>> getAllPayrolls() {
        try {
            List<Payroll> payrolls = payrollService.getAllPayrolls();
            if (payrolls == null) {
                return ResponseEntity.ok(List.of());
            }
            return ResponseEntity.ok(DTOMapper.toPayrollDTOList(payrolls));
        } catch (Exception e) {
            e.printStackTrace();
            // Return empty list instead of error to prevent frontend crashes
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPayrollById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Payroll> payrollOpt = payrollService.getPayrollById(id);
            if (payrollOpt.isPresent()) {
                response.put("success", true);
                response.put("payroll", DTOMapper.toPayrollDTO(payrollOpt.get()));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Payroll not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PayrollDTO>> getEmployeePayrolls(@PathVariable Long employeeId) {
        try {
            List<Payroll> payrolls = payrollService.getPayrollsByEmployeeId(employeeId);
            if (payrolls == null) {
                return ResponseEntity.ok(List.of());
            }
            return ResponseEntity.ok(DTOMapper.toPayrollDTOList(payrolls));
        } catch (Exception e) {
            e.printStackTrace();
            // Return empty list instead of error to prevent frontend crashes
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPayroll(@RequestBody PayrollDTO payrollDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = new Payroll();
            payroll.setEmployeeId(payrollDTO.getEmployeeId());
            payroll.setMonth(payrollDTO.getMonth());
            payroll.setYear(payrollDTO.getYear());
            payroll.setBaseSalary(payrollDTO.getBaseSalary() != null ? payrollDTO.getBaseSalary() : 0.0);
            payroll.setAllowances(payrollDTO.getAllowances() != null ? payrollDTO.getAllowances() : 0.0);
            payroll.setDeductions(payrollDTO.getDeductions() != null ? payrollDTO.getDeductions() : 0.0);
            payroll.setBonus(payrollDTO.getBonus() != null ? payrollDTO.getBonus() : 0.0);
            payroll.setNotes(payrollDTO.getNotes());
            payroll.setStatus(payrollDTO.getStatus() != null ? payrollDTO.getStatus() : "DRAFT");
            
            Payroll createdPayroll = payrollService.createPayroll(payroll);
            response.put("success", true);
            response.put("message", "Payroll created successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(createdPayroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generatePayroll(
            @RequestParam Long employeeId,
            @RequestParam String month,
            @RequestParam Integer year) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.generatePayroll(employeeId, month, year);
            response.put("success", true);
            response.put("message", "Payroll generated successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Process payroll for all employees for a given period
     */
    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayrollForAllEmployees(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<Payroll> payrolls = payrollService.processPayrollForAllEmployees(start, end);
            response.put("success", true);
            response.put("message", "Payroll processed for " + payrolls.size() + " employees");
            response.put("payrolls", DTOMapper.toPayrollDTOList(payrolls));
            response.put("count", payrolls.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Submit payroll for approval
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitPayrollForApproval(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.submitPayrollForApproval(id, userId);
            response.put("success", true);
            response.put("message", "Payroll submitted for approval successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    /**
     * Approve a payroll
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approvePayroll(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.approvePayroll(id, userId);
            response.put("success", true);
            response.put("message", "Payroll approved successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    /**
     * Reject a payroll
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectPayroll(
            @PathVariable Long id,
            @RequestParam String rejectionReason,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.rejectPayroll(id, rejectionReason, userId);
            response.put("success", true);
            response.put("message", "Payroll rejected successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Finalize a payroll
     */
    @PostMapping("/{id}/finalize")
    public ResponseEntity<Map<String, Object>> finalizePayroll(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.finalizePayroll(id, userId);
            response.put("success", true);
            response.put("message", "Payroll finalized successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Finalize all approved payrolls for a period
     */
    @PostMapping("/finalize-all")
    public ResponseEntity<Map<String, Object>> finalizeAllApprovedPayrolls(
            @RequestParam String month,
            @RequestParam Integer year,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Payroll> payrolls = payrollService.finalizeAllApprovedPayrolls(month, year, userId);
            response.put("success", true);
            response.put("message", "Finalized " + payrolls.size() + " payrolls");
            response.put("payrolls", DTOMapper.toPayrollDTOList(payrolls));
            response.put("count", payrolls.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Mark payroll as paid
     */
    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<Map<String, Object>> markPayrollAsPaid(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.markPayrollAsPaid(id, userId);
            response.put("success", true);
            response.put("message", "Payroll marked as paid");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Update payroll
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePayroll(
            @PathVariable Long id,
            @RequestBody PayrollDTO payrollDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.updatePayroll(id, payrollDTO);
            response.put("success", true);
            response.put("message", "Payroll updated successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }


    @GetMapping("/{id}/payslip")
    public ResponseEntity<?> generatePayslipPDF(@PathVariable Long id) {
        try {
            Payroll payroll = payrollService.getPayrollById(id)
                    .orElseThrow(() -> new RuntimeException("Payroll not found"));

            // Try to get salary structure, but use payroll data as fallback
            Optional<SalaryStructure> salaryStructureOpt = salaryStructureService
                    .getCurrentSalaryStructure(payroll.getEmployeeId());

            Map<String, Object> payslipData = new HashMap<>();
            payslipData.put("employeeName", payroll.getEmployee() != null ? payroll.getEmployee().getName() : "");
            payslipData.put("employeeId", payroll.getEmployeeId());
            payslipData.put("department", payroll.getEmployee() != null ? payroll.getEmployee().getDepartment() : "");
            payslipData.put("designation", payroll.getEmployee() != null ? payroll.getEmployee().getPosition() : "");
            payslipData.put("payPeriod", payroll.getMonth() + " " + (payroll.getYear() != null ? payroll.getYear() : ""));
            payslipData.put("payDate", LocalDate.now().toString());
            
            // Add employee statutory and banking information
            if (payroll.getEmployee() != null) {
                User employee = payroll.getEmployee();
                // Try to get statutory and banking fields using reflection (in case methods exist)
                payslipData.put("uan", getEmployeeField(employee, "uan"));
                payslipData.put("pfAccountNumber", getEmployeeField(employee, "pfAccountNumber"));
                payslipData.put("bankAccountNumber", getEmployeeField(employee, "bankAccountNumber"));
                payslipData.put("bankName", getEmployeeField(employee, "bankName"));
                payslipData.put("ifscCode", getEmployeeField(employee, "ifscCode"));
            } else {
                payslipData.put("uan", null);
                payslipData.put("pfAccountNumber", null);
                payslipData.put("bankAccountNumber", null);
                payslipData.put("bankName", null);
                payslipData.put("ifscCode", null);
            }
            
            // Add attendance information (calculate if not available)
            // These fields may not exist in Payroll entity, so we'll calculate or set defaults
            payslipData.put("workingDays", 0); // Will be calculated or set from payroll if available
            payslipData.put("presentDays", 0);
            payslipData.put("leaveDays", 0);
            payslipData.put("lopDays", 0);
            
            if (salaryStructureOpt.isPresent()) {
                // Use salary structure data if available
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                Double basicSalary = salaryStructure.getBasicSalary();
                Double grossSalary = salaryStructure.getGrossSalary();
                Double netSalary = salaryStructure.getNetSalary();
                
                payslipData.put("basicSalary", basicSalary != null ? basicSalary : (payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0));
                payslipData.put("hra", salaryStructure.getHra() != null ? salaryStructure.getHra() : 0.0);
                payslipData.put("specialAllowance", salaryStructure.getSpecialAllowance() != null ? salaryStructure.getSpecialAllowance() : 0.0);
                payslipData.put("transportAllowance", salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0);
                payslipData.put("medicalAllowance", salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0);
                payslipData.put("otherAllowances", salaryStructure.getOtherAllowances() != null ? salaryStructure.getOtherAllowances() : 0.0);
                
                // Calculate total allowances
                Double transportAllowance = salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0;
                Double medicalAllowance = salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0;
                Double specialAllowance = salaryStructure.getSpecialAllowance() != null ? salaryStructure.getSpecialAllowance() : 0.0;
                Double otherAllowances = salaryStructure.getOtherAllowances() != null ? salaryStructure.getOtherAllowances() : 0.0;
                Double totalAllowances = transportAllowance + medicalAllowance + specialAllowance + otherAllowances;
                payslipData.put("allowances", totalAllowances);
                
                payslipData.put("grossSalary", grossSalary != null ? grossSalary : (payroll.getAmount() != null ? payroll.getAmount() : 0.0));
                payslipData.put("pf", salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0);
                payslipData.put("esi", salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0);
                payslipData.put("tds", salaryStructure.getTds() != null ? salaryStructure.getTds() : 0.0);
                payslipData.put("professionalTax", salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0);
                payslipData.put("otherDeductions", salaryStructure.getOtherDeductions() != null ? salaryStructure.getOtherDeductions() : 0.0);
                
                // Calculate total deductions
                Double pf = salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0;
                Double esi = salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0;
                Double tds = salaryStructure.getTds() != null ? salaryStructure.getTds() : 0.0;
                Double professionalTax = salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0;
                Double otherDeductions = salaryStructure.getOtherDeductions() != null ? salaryStructure.getOtherDeductions() : 0.0;
                Double totalDeductions = pf + esi + tds + professionalTax + otherDeductions;
                payslipData.put("totalDeductions", totalDeductions);
            } else {
                // Use payroll data when salary structure is not available
                Double baseSalary = payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0;
                Double allowances = payroll.getAllowances() != null ? payroll.getAllowances() : 0.0;
                Double bonus = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
                Double deductions = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
                Double grossSalary = payroll.getAmount() != null ? payroll.getAmount() : (baseSalary + allowances + bonus);
                
                payslipData.put("basicSalary", baseSalary);
                payslipData.put("hra", 0.0);
                payslipData.put("specialAllowance", 0.0);
                payslipData.put("transportAllowance", 0.0);
                payslipData.put("medicalAllowance", 0.0);
                payslipData.put("otherAllowances", allowances);
                payslipData.put("allowances", allowances);
                payslipData.put("grossSalary", grossSalary);
                payslipData.put("pf", 0.0);
                payslipData.put("esi", 0.0);
                payslipData.put("tds", 0.0);
                payslipData.put("professionalTax", 0.0);
                payslipData.put("otherDeductions", 0.0);
                payslipData.put("totalDeductions", deductions);
            }
            
            // Add bonus from payroll
            payslipData.put("bonus", payroll.getBonus() != null ? payroll.getBonus() : 0.0);
            
            // Calculate net salary: (Gross Salary + Bonus) - Total Deductions
            Double grossSalaryValue = null;
            Double bonusValue = null;
            Double totalDeductionsValue = null;
            
            // Extract gross salary
            Object grossObj = payslipData.get("grossSalary");
            if (grossObj instanceof Number) {
                grossSalaryValue = ((Number) grossObj).doubleValue();
            } else if (grossObj != null) {
                try {
                    grossSalaryValue = Double.parseDouble(grossObj.toString());
                } catch (NumberFormatException e) {
                    grossSalaryValue = payroll.getAmount() != null ? payroll.getAmount() : 0.0;
                }
            } else {
                grossSalaryValue = payroll.getAmount() != null ? payroll.getAmount() : 0.0;
            }
            
            // Extract bonus
            Object bonusObj = payslipData.get("bonus");
            if (bonusObj instanceof Number) {
                bonusValue = ((Number) bonusObj).doubleValue();
            } else if (bonusObj != null) {
                try {
                    bonusValue = Double.parseDouble(bonusObj.toString());
                } catch (NumberFormatException e) {
                    bonusValue = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
                }
            } else {
                bonusValue = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
            }
            
            // Extract total deductions
            Object deductionsObj = payslipData.get("totalDeductions");
            if (deductionsObj instanceof Number) {
                totalDeductionsValue = ((Number) deductionsObj).doubleValue();
            } else if (deductionsObj != null) {
                try {
                    totalDeductionsValue = Double.parseDouble(deductionsObj.toString());
                } catch (NumberFormatException e) {
                    totalDeductionsValue = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
                }
            } else {
                totalDeductionsValue = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
            }
            
            // Calculate net salary: (Gross Salary + Bonus) - Total Deductions
            // Use stored netSalary if available and correct, otherwise calculate
            Double storedNetSalary = payroll.getNetSalary();
            Double calculatedNetSalary = (grossSalaryValue + bonusValue) - totalDeductionsValue;
            
            // Use stored netSalary only if it matches the calculated value (within small tolerance)
            Double netSalary;
            if (storedNetSalary != null && Math.abs(storedNetSalary - calculatedNetSalary) < 0.01) {
                netSalary = storedNetSalary;
            } else {
                // Use calculated value
                netSalary = calculatedNetSalary;
            }
            
            // Ensure net salary is never negative
            if (netSalary == null || netSalary < 0) {
                netSalary = Math.max(0.0, calculatedNetSalary);
            }
            
            payslipData.put("netSalary", netSalary);

            byte[] pdfBytes = pdfGeneratorService.generatePayslip(payslipData);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate payslip PDF");
                errorResponse.put("message", "PDF generation returned empty data");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "payslip_" + id + ".pdf");
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Cannot generate payslip: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error");
            errorResponse.put("message", "Failed to generate payslip: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    @GetMapping("/form16")
    public ResponseEntity<byte[]> generateForm16(
            @RequestParam Long employeeId,
            @RequestParam Integer assessmentYear) {
        try {
            // Get employee and salary data
            SalaryStructure salaryStructure = salaryStructureService
                    .getCurrentSalaryStructure(employeeId)
                    .orElseThrow(() -> new RuntimeException("Salary structure not found"));

            Map<String, Object> form16Data = new HashMap<>();
            form16Data.put("employeeName", ""); // Get from employee
            form16Data.put("pan", ""); // Get from employee documents
            form16Data.put("assessmentYear", assessmentYear);
            form16Data.put("totalIncome", salaryStructure.getGrossSalary() * 12);
            form16Data.put("taxDeducted", salaryStructure.getTds() * 12);

            byte[] pdfBytes = pdfGeneratorService.generateForm16(form16Data);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "form16_" + employeeId + ".pdf");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete payroll
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePayroll(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            payrollService.deletePayroll(id);
            response.put("success", true);
            response.put("message", "Payroll deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    // Helper method to get employee field using reflection
    private Object getEmployeeField(User employee, String fieldName) {
        try {
            String methodName = "get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            java.lang.reflect.Method method = employee.getClass().getMethod(methodName);
            return method.invoke(employee);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Remove duplicate payroll records for all employees
     */
    @PostMapping("/remove-duplicates")
    public ResponseEntity<Map<String, Object>> removeDuplicatePayrolls() {
        Map<String, Object> response = new HashMap<>();
        try {
            int removed = payrollService.removeDuplicatePayrolls();
            response.put("success", true);
            response.put("message", "Removed " + removed + " duplicate payroll record(s)");
            response.put("removedCount", removed);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error removing duplicates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Remove duplicate payroll records for a specific employee
     */
    @PostMapping("/remove-duplicates/{employeeId}")
    public ResponseEntity<Map<String, Object>> removeDuplicatePayrollsForEmployee(@PathVariable Long employeeId) {
        Map<String, Object> response = new HashMap<>();
        try {
            int removed = payrollService.removeDuplicatePayrollsForEmployee(employeeId);
            response.put("success", true);
            response.put("message", "Removed " + removed + " duplicate payroll record(s) for employee " + employeeId);
            response.put("removedCount", removed);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error removing duplicates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Recalculate net salary for all payrolls (fixes incorrect calculations)
     */
    @PostMapping("/recalculate-net-salaries")
    public ResponseEntity<Map<String, Object>> recalculateAllNetSalaries() {
        Map<String, Object> response = new HashMap<>();
        try {
            int updatedCount = payrollService.recalculateAllNetSalaries();
            response.put("success", true);
            response.put("message", "Recalculated net salary for " + updatedCount + " payroll record(s)");
            response.put("updatedCount", updatedCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error recalculating net salaries: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
