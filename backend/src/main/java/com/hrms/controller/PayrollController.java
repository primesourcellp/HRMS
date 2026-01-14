package com.hrms.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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
import com.hrms.entity.Attendance;
import com.hrms.entity.Leave;
import com.hrms.entity.Payroll;
import com.hrms.entity.SalaryStructure;
import com.hrms.entity.User;
import com.hrms.mapper.DTOMapper;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.LeaveRepository;
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

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRepository leaveRepository;

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
     * Process payroll for a single employee for a given period
     */
    @PostMapping("/process/{employeeId}")
    public ResponseEntity<Map<String, Object>> processPayrollForEmployee(
            @PathVariable Long employeeId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            Payroll payroll = payrollService.processEmployeePayroll(employeeId, start, end, 
                start.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")), start.getYear());
            response.put("success", true);
            response.put("message", "Payroll processed successfully");
            response.put("payroll", DTOMapper.toPayrollDTO(payroll));
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
            
            // Calculate attendance information for payslip
            long workingDays = 0;
            long presentDays = 0;
            double leaveDays = 0.0;
            double lopDays = 0.0;
            
            // If payroll has startDate and endDate, calculate actual attendance
            if (payroll.getStartDate() != null && payroll.getEndDate() != null) {
                LocalDate startDate = payroll.getStartDate();
                LocalDate endDate = payroll.getEndDate();
                
                // Calculate total working days in period
                workingDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
                
                // Get attendance records for the period
                List<Attendance> attendanceRecords = attendanceRepository
                        .findByEmployeeIdAndDateBetween(payroll.getEmployeeId(), startDate, endDate);
                
                // Calculate present days
                presentDays = attendanceRecords.stream()
                        .filter(a -> "Present".equals(a.getStatus()))
                        .count();
                
                // Get approved leaves for the period
                List<Leave> approvedLeaves = leaveRepository.findByEmployeeId(payroll.getEmployeeId()).stream()
                        .filter(leave -> "APPROVED".equals(leave.getStatus())
                                && !leave.getStartDate().isAfter(endDate)
                                && !leave.getEndDate().isBefore(startDate))
                        .collect(java.util.stream.Collectors.toList());
                
                // Calculate leave days (only approved leaves)
                leaveDays = approvedLeaves.stream()
                        .mapToDouble(leave -> {
                            LocalDate leaveStart = leave.getStartDate().isBefore(startDate) ? startDate : leave.getStartDate();
                            LocalDate leaveEnd = leave.getEndDate().isAfter(endDate) ? endDate : leave.getEndDate();
                            if (leave.getHalfDay() != null && leave.getHalfDay()) {
                                return 0.5;
                            }
                            return ChronoUnit.DAYS.between(leaveStart, leaveEnd) + 1;
                        })
                        .sum();
                
                // Calculate payable days (present + approved leaves)
                double payableDays = presentDays + leaveDays;
                if (payableDays > workingDays) payableDays = workingDays;
                
                // Calculate LOP (Loss of Pay) days = Working Days - Payable Days
                lopDays = workingDays - payableDays;
                if (lopDays < 0) lopDays = 0;
            } else {
                // Fallback: use month-based calculation
                String month = payroll.getMonth() != null ? payroll.getMonth() : "";
                if (!month.isEmpty() && month.contains("-")) {
                    String[] parts = month.split("-");
                    if (parts.length == 2) {
                        try {
                            int year = payroll.getYear() != null ? payroll.getYear() : LocalDate.now().getYear();
                            int monthNum = Integer.parseInt(parts[1]);
                            LocalDate startDate = LocalDate.of(year, monthNum, 1);
                            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                            workingDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
                            // Default to full attendance if no dates available
                            presentDays = workingDays;
                            leaveDays = 0.0;
                            lopDays = 0.0;
                        } catch (Exception e) {
                            // Use defaults
                        }
                    }
                }
            }
            
            payslipData.put("workingDays", (double) workingDays);
            payslipData.put("presentDays", (double) presentDays);
            payslipData.put("leaveDays", leaveDays);
            payslipData.put("lopDays", lopDays);
            
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

    @GetMapping("/{id}/annual-ctc")
    public ResponseEntity<?> generateAnnualCTCPDF(@PathVariable Long id) {
        try {
            Payroll payroll = payrollService.getPayrollById(id)
                    .orElseThrow(() -> new RuntimeException("Payroll not found"));

            User employee = payroll.getEmployee();
            if (employee == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Employee not found");
                errorResponse.put("message", "Cannot generate Annual CTC: Employee information is missing");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            // Get salary structure
            Optional<SalaryStructure> salaryStructureOpt = salaryStructureService
                    .getCurrentSalaryStructure(employee.getId());

            Map<String, Object> annualCtcData = new HashMap<>();
            
            // Employee Information
            annualCtcData.put("employeeName", employee.getName() != null ? employee.getName() : "N/A");
            annualCtcData.put("employeeId", employee.getEmployeeId() != null ? employee.getEmployeeId() : String.valueOf(employee.getId()));
            annualCtcData.put("department", employee.getDepartment() != null ? employee.getDepartment() : "N/A");
            annualCtcData.put("month", payroll.getMonth() != null ? payroll.getMonth() : "N/A");
            annualCtcData.put("year", payroll.getYear() != null ? payroll.getYear() : "N/A");
            annualCtcData.put("startDate", payroll.getStartDate() != null ? payroll.getStartDate().toString() : null);
            annualCtcData.put("endDate", payroll.getEndDate() != null ? payroll.getEndDate().toString() : null);

            // Salary Components
            Double baseSalary = payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0;
            Double allowances = payroll.getAllowances() != null ? payroll.getAllowances() : 0.0;
            Double bonus = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
            Double deductions = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;

            annualCtcData.put("baseSalary", baseSalary);
            annualCtcData.put("allowances", allowances);
            annualCtcData.put("bonus", bonus);
            annualCtcData.put("deductions", deductions);

            // Get detailed breakdown from salary structure if available
            if (salaryStructureOpt.isPresent()) {
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                annualCtcData.put("hra", salaryStructure.getHra() != null ? salaryStructure.getHra() : 0.0);
                annualCtcData.put("medicalAllowance", salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0);
                annualCtcData.put("transportAllowance", salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0);
                annualCtcData.put("specialAllowance", salaryStructure.getSpecialAllowance() != null ? salaryStructure.getSpecialAllowance() : 0.0);
                annualCtcData.put("otherAllowances", salaryStructure.getOtherAllowances() != null ? salaryStructure.getOtherAllowances() : 0.0);
                annualCtcData.put("pfEmployee", salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0);
                annualCtcData.put("esiEmployee", salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0);
                annualCtcData.put("professionalTax", salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0);
            } else {
                annualCtcData.put("hra", 0.0);
                annualCtcData.put("medicalAllowance", 0.0);
                annualCtcData.put("transportAllowance", 0.0);
                annualCtcData.put("specialAllowance", 0.0);
                annualCtcData.put("otherAllowances", allowances);
                annualCtcData.put("pfEmployee", 0.0);
                annualCtcData.put("esiEmployee", 0.0);
                annualCtcData.put("professionalTax", 0.0);
            }

            // Calculate employer contributions
            Double pfEmployee = (Double) annualCtcData.get("pfEmployee");
            Double esiEmployee = (Double) annualCtcData.get("esiEmployee");
            Double pfEmployer = pfEmployee; // Typically same as employee PF
            Double esiEmployer = esiEmployee > 0 ? (esiEmployee * 4.75 / 1.75) : 0.0; // Employer ESI = 4.75%, Employee = 1.75%
            
            // Calculate Gratuity (Monthly provision: Basic Salary × 15/26 / 12)
            Double monthlyGratuity = baseSalary * (15.0 / (26.0 * 12.0));
            
            // Calculate LTA (Leave Travel Allowance) - typically 1 month basic / 12
            Double monthlyLTA = baseSalary / 12.0;

            annualCtcData.put("pfEmployer", pfEmployer);
            annualCtcData.put("esiEmployer", esiEmployer);
            annualCtcData.put("monthlyGratuity", monthlyGratuity);
            annualCtcData.put("monthlyLTA", monthlyLTA);

            // Calculate monthly gross, employer contribution, and CTC
            Double monthlyGross = baseSalary + allowances;
            Double monthlyEmployerContribution = pfEmployer + esiEmployer + monthlyGratuity + monthlyLTA;
            Double monthlyCTC = monthlyGross + monthlyEmployerContribution;
            Double annualCTC = monthlyCTC * 12.0;

            annualCtcData.put("monthlyGross", monthlyGross);
            annualCtcData.put("monthlyEmployerContribution", monthlyEmployerContribution);
            annualCtcData.put("monthlyCTC", monthlyCTC);
            annualCtcData.put("annualCTC", annualCTC);

            // Get attendance data if available
            if (payroll.getStartDate() != null && payroll.getEndDate() != null) {
                List<Attendance> attendanceRecords = attendanceRepository.findByEmployeeIdAndDateBetween(
                        employee.getId(), payroll.getStartDate(), payroll.getEndDate());
                List<Leave> approvedLeaves = leaveRepository.findByEmployeeIdAndStatus(employee.getId(), "APPROVED")
                        .stream()
                        .filter(leave -> !leave.getStartDate().isAfter(payroll.getEndDate())
                                && !leave.getEndDate().isBefore(payroll.getStartDate()))
                        .collect(Collectors.toList());

                long totalDays = ChronoUnit.DAYS.between(payroll.getStartDate(), payroll.getEndDate()) + 1;
                long presentDays = attendanceRecords.stream()
                        .filter(att -> "Present".equalsIgnoreCase(att.getStatus()))
                        .count();
                long leaveDays = approvedLeaves.stream()
                        .mapToLong(leave -> ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1)
                        .sum();
                long payableDays = presentDays + leaveDays;
                double prorationFactor = totalDays > 0 ? (double) payableDays / totalDays : 1.0;

                annualCtcData.put("totalDays", totalDays);
                annualCtcData.put("presentDays", presentDays);
                annualCtcData.put("leaveDays", leaveDays);
                annualCtcData.put("payableDays", payableDays);
                annualCtcData.put("prorationFactor", prorationFactor);
            }

            byte[] pdfBytes = pdfGeneratorService.generateAnnualCTC(annualCtcData);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate Annual CTC PDF");
                errorResponse.put("message", "PDF generation returned empty data");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "Annual_CTC_" + employee.getName().replaceAll(" ", "_") + "_" + 
                            (payroll.getYear() != null ? payroll.getYear() : "N/A") + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Cannot generate Annual CTC: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error");
            errorResponse.put("message", "Failed to generate Annual CTC: " + e.getMessage());
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
