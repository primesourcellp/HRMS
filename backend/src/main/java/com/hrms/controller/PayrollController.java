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
     * Approve a payroll
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approvePayroll(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.approvePayroll(id);
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
     * Finalize a payroll
     */
    @PostMapping("/{id}/finalize")
    public ResponseEntity<Map<String, Object>> finalizePayroll(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.finalizePayroll(id);
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
            @RequestParam Integer year) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Payroll> payrolls = payrollService.finalizeAllApprovedPayrolls(month, year);
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
    public ResponseEntity<Map<String, Object>> markPayrollAsPaid(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.markPayrollAsPaid(id);
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

    /**
     * Submit payroll for approval (moves from DRAFT to PENDING_APPROVAL)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitPayrollForApproval(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Payroll payroll = payrollService.submitPayrollForApproval(id);
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
            
            if (salaryStructureOpt.isPresent()) {
                // Use salary structure data if available
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                Double basicSalary = salaryStructure.getBasicSalary();
                Double grossSalary = salaryStructure.getGrossSalary();
                Double netSalary = salaryStructure.getNetSalary();
                
                payslipData.put("basicSalary", basicSalary != null ? basicSalary : (payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0));
                payslipData.put("hra", salaryStructure.getHra());
                Double transportAllowance = salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0;
                Double medicalAllowance = salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0;
                payslipData.put("allowances", transportAllowance + medicalAllowance);
                payslipData.put("grossSalary", grossSalary != null ? grossSalary : (payroll.getAmount() != null ? payroll.getAmount() : 0.0));
                payslipData.put("pf", salaryStructure.getPf());
                payslipData.put("esi", salaryStructure.getEsi());
                payslipData.put("tds", salaryStructure.getTds());
                Double totalDeductions = (grossSalary != null && netSalary != null) ? (grossSalary - netSalary) : 
                                       (payroll.getDeductions() != null ? payroll.getDeductions() : 0.0);
                payslipData.put("totalDeductions", totalDeductions);
            } else {
                // Use payroll data when salary structure is not available
                Double baseSalary = payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0;
                Double allowances = payroll.getAllowances() != null ? payroll.getAllowances() : 0.0;
                Double bonus = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
                Double deductions = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
                Double grossSalary = payroll.getAmount() != null ? payroll.getAmount() : (baseSalary + allowances + bonus);
                
                payslipData.put("basicSalary", baseSalary);
                payslipData.put("hra", null);
                payslipData.put("allowances", allowances);
                payslipData.put("grossSalary", grossSalary);
                payslipData.put("pf", null);
                payslipData.put("esi", null);
                payslipData.put("tds", null);
                payslipData.put("totalDeductions", deductions);
            }
            
            Double netSalary = payroll.getNetSalary() != null ? payroll.getNetSalary() : 
                             (payroll.getAmount() != null ? payroll.getAmount() : 0.0);
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
}
