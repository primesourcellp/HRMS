package com.hrms.controller;

import com.hrms.entity.Payroll;
import com.hrms.entity.SalaryStructure;
import com.hrms.service.PayrollService;
import com.hrms.service.SalaryStructureService;
import com.hrms.util.PDFGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<Payroll>> getAllPayrolls() {
        return ResponseEntity.ok(payrollService.getAllPayrolls());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Payroll>> getEmployeePayrolls(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payrollService.getPayrollsByEmployeeId(employeeId));
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
            response.put("payroll", payroll);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/{id}/payslip")
    public ResponseEntity<byte[]> generatePayslipPDF(@PathVariable Long id) {
        try {
            Payroll payroll = payrollService.getPayrollById(id)
                    .orElseThrow(() -> new RuntimeException("Payroll not found"));

            SalaryStructure salaryStructure = salaryStructureService
                    .getCurrentSalaryStructure(payroll.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Salary structure not found"));

            Map<String, Object> payslipData = new HashMap<>();
            payslipData.put("employeeName", payroll.getEmployee() != null ? payroll.getEmployee().getName() : "");
            payslipData.put("employeeId", payroll.getEmployeeId());
            payslipData.put("department", payroll.getEmployee() != null ? payroll.getEmployee().getDepartment() : "");
            payslipData.put("designation", payroll.getEmployee() != null ? payroll.getEmployee().getPosition() : "");
            payslipData.put("payPeriod", payroll.getMonth() + " " + (payroll.getYear() != null ? payroll.getYear() : ""));
            payslipData.put("payDate", LocalDate.now().toString());
            payslipData.put("basicSalary", salaryStructure.getBasicSalary());
            payslipData.put("hra", salaryStructure.getHra());
            payslipData.put("allowances", salaryStructure.getTransportAllowance() + 
                          (salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0));
            payslipData.put("grossSalary", salaryStructure.getGrossSalary());
            payslipData.put("pf", salaryStructure.getPf());
            payslipData.put("esi", salaryStructure.getEsi());
            payslipData.put("tds", salaryStructure.getTds());
            payslipData.put("totalDeductions", salaryStructure.getGrossSalary() - salaryStructure.getNetSalary());
            payslipData.put("netSalary", payroll.getNetSalary());

            byte[] pdfBytes = pdfGeneratorService.generatePayslip(payslipData);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "payslip_" + id + ".pdf");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
}
