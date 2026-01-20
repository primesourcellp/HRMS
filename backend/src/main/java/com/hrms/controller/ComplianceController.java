package com.hrms.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.Payroll;
import com.hrms.entity.SalaryStructure;
import com.hrms.entity.User;
import com.hrms.repository.AuditLogRepository;
import com.hrms.repository.PayrollRepository;
import com.hrms.repository.SalaryStructureRepository;
import com.hrms.repository.UserRepository;
import com.hrms.service.AuditLogService;
import com.hrms.util.PDFGeneratorService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/compliance")
@CrossOrigin(origins = "http://localhost:3000")
public class ComplianceController {

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PDFGeneratorService pdfGeneratorService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Generate PF (Provident Fund) Report
     */
    @GetMapping("/pf-report")
    public ResponseEntity<?> generatePFReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long employeeId,
            HttpServletRequest request) {
        try {
            LocalDate startDate, endDate;
            
            if (year != null && month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            } else if (year != null) {
                startDate = LocalDate.of(year, 1, 1);
                endDate = LocalDate.of(year, 12, 31);
            } else {
                // Default to current month
                YearMonth currentMonth = YearMonth.now();
                startDate = currentMonth.atDay(1);
                endDate = currentMonth.atEndOfMonth();
            }

            List<Payroll> payrolls = getPayrollsForPeriod(startDate, endDate, employeeId);
            
            if (payrolls == null || payrolls.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No payroll data found");
                errorResponse.put("message", "No payroll records found for the selected period. Please ensure payroll has been processed for this period.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }
            
            Map<String, Object> reportData = generatePFReportData(payrolls, startDate, endDate);

            byte[] pdfBytes = pdfGeneratorService.generatePFReport(reportData);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate PF report");
                errorResponse.put("message", "PDF generation returned empty data");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "PF_Report_" + (year != null ? year : "Current") + 
                            (month != null ? "_" + String.format("%02d", month) : "") + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);

            // Log audit
            Long userId = getCurrentUserId(request);
            if (userId != null) {
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent("COMPLIANCE", null, "GENERATE_PF_REPORT", userId, 
                    null, reportData, "Generated PF Report for period: " + startDate + " to " + endDate, request);
                // Set employee information
                if (auditLog != null) {
                    if (employeeId != null) {
                        // Specific employee selected
                        User employee = userRepository.findById(employeeId).orElse(null);
                        if (employee != null) {
                            auditLog.setEmployeeId(employeeId);
                            auditLog.setEmployeeName(employee.getName());
                        }
                    } else {
                        // No employee selected - show "All" for all employees
                        auditLog.setEmployeeName("All");
                    }
                    auditLogRepository.save(auditLog);
                }
            }

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate PF report");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    /**
     * Generate ESI (Employee State Insurance) Report
     */
    @GetMapping("/esi-report")
    public ResponseEntity<?> generateESIReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long employeeId,
            HttpServletRequest request) {
        try {
            LocalDate startDate, endDate;
            
            if (year != null && month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            } else if (year != null) {
                startDate = LocalDate.of(year, 1, 1);
                endDate = LocalDate.of(year, 12, 31);
            } else {
                YearMonth currentMonth = YearMonth.now();
                startDate = currentMonth.atDay(1);
                endDate = currentMonth.atEndOfMonth();
            }

            List<Payroll> payrolls = getPayrollsForPeriod(startDate, endDate, employeeId);
            Map<String, Object> reportData = generateESIReportData(payrolls, startDate, endDate);

            byte[] pdfBytes = pdfGeneratorService.generateESIReport(reportData);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "ESI_Report_" + (year != null ? year : "Current") + 
                            (month != null ? "_" + String.format("%02d", month) : "") + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);

            // Log audit
            Long userId = getCurrentUserId(request);
            if (userId != null) {
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent("COMPLIANCE", null, "GENERATE_ESI_REPORT", userId, 
                    null, reportData, "Generated ESI Report for period: " + startDate + " to " + endDate, request);
                // Set employee information
                if (auditLog != null) {
                    if (employeeId != null) {
                        // Specific employee selected
                        User employee = userRepository.findById(employeeId).orElse(null);
                        if (employee != null) {
                            auditLog.setEmployeeId(employeeId);
                            auditLog.setEmployeeName(employee.getName());
                        }
                    } else {
                        // No employee selected - show "All" for all employees
                        auditLog.setEmployeeName("All");
                    }
                    auditLogRepository.save(auditLog);
                }
            }

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate ESI report");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    /**
     * Generate PT (Professional Tax) Report
     */
    @GetMapping("/pt-report")
    public ResponseEntity<?> generatePTReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long employeeId,
            HttpServletRequest request) {
        try {
            LocalDate startDate, endDate;
            
            if (year != null && month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            } else if (year != null) {
                startDate = LocalDate.of(year, 1, 1);
                endDate = LocalDate.of(year, 12, 31);
            } else {
                YearMonth currentMonth = YearMonth.now();
                startDate = currentMonth.atDay(1);
                endDate = currentMonth.atEndOfMonth();
            }

            List<Payroll> payrolls = getPayrollsForPeriod(startDate, endDate, employeeId);
            
            if (payrolls == null || payrolls.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No payroll data found");
                errorResponse.put("message", "No payroll records found for the selected period. Please ensure payroll has been processed for this period.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }
            
            Map<String, Object> reportData = generatePTReportData(payrolls, startDate, endDate);

            byte[] pdfBytes = pdfGeneratorService.generatePTReport(reportData);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate PT report");
                errorResponse.put("message", "PDF generation returned empty data");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "PT_Report_" + (year != null ? year : "Current") + 
                            (month != null ? "_" + String.format("%02d", month) : "") + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);

            // Log audit
            Long userId = getCurrentUserId(request);
            if (userId != null) {
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent("COMPLIANCE", null, "GENERATE_PT_REPORT", userId, 
                    null, reportData, "Generated PT Report for period: " + startDate + " to " + endDate, request);
                // Set employee information
                if (auditLog != null) {
                    if (employeeId != null) {
                        // Specific employee selected
                        User employee = userRepository.findById(employeeId).orElse(null);
                        if (employee != null) {
                            auditLog.setEmployeeId(employeeId);
                            auditLog.setEmployeeName(employee.getName());
                        }
                    } else {
                        // No employee selected - show "All" for all employees
                        auditLog.setEmployeeName("All");
                    }
                    auditLogRepository.save(auditLog);
                }
            }

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate PT report");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    /**
     * Generate TDS (Tax Deducted at Source) Report
     */
    @GetMapping("/tds-report")
    public ResponseEntity<?> generateTDSReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long employeeId,
            HttpServletRequest request) {
        try {
            LocalDate startDate, endDate;
            
            if (year != null && month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            } else if (year != null) {
                startDate = LocalDate.of(year, 1, 1);
                endDate = LocalDate.of(year, 12, 31);
            } else {
                YearMonth currentMonth = YearMonth.now();
                startDate = currentMonth.atDay(1);
                endDate = currentMonth.atEndOfMonth();
            }

            List<Payroll> payrolls = getPayrollsForPeriod(startDate, endDate, employeeId);
            
            if (payrolls == null || payrolls.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No payroll data found");
                errorResponse.put("message", "No payroll records found for the selected period. Please ensure payroll has been processed for this period.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }
            
            Map<String, Object> reportData = generateTDSReportData(payrolls, startDate, endDate);

            byte[] pdfBytes = pdfGeneratorService.generateTDSReport(reportData);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate TDS report");
                errorResponse.put("message", "PDF generation returned empty data");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "TDS_Report_" + (year != null ? year : "Current") + 
                            (month != null ? "_" + String.format("%02d", month) : "") + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);

            // Log audit
            Long userId = getCurrentUserId(request);
            if (userId != null) {
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent("COMPLIANCE", null, "GENERATE_TDS_REPORT", userId, 
                    null, reportData, "Generated TDS Report for period: " + startDate + " to " + endDate, request);
                // Set employee information
                if (auditLog != null) {
                    if (employeeId != null) {
                        // Specific employee selected
                        User employee = userRepository.findById(employeeId).orElse(null);
                        if (employee != null) {
                            auditLog.setEmployeeId(employeeId);
                            auditLog.setEmployeeName(employee.getName());
                        }
                    } else {
                        // No employee selected - show "All" for all employees
                        auditLog.setEmployeeName("All");
                    }
                    auditLogRepository.save(auditLog);
                }
            }

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate TDS report");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    /**
     * Get audit logs for compliance
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            List<com.hrms.entity.AuditLog> auditLogs;
            LocalDate start = null;
            LocalDate end = null;
            
            // Parse dates if provided
            if (startDate != null && !startDate.trim().isEmpty()) {
                start = LocalDate.parse(startDate);
            }
            if (endDate != null && !endDate.trim().isEmpty()) {
                end = LocalDate.parse(endDate);
            }
            
            // Handle all filter combinations
            if (entityType != null && !entityType.trim().isEmpty() && employeeId != null && start != null && end != null) {
                // All filters: entityType + employeeId + dates
                auditLogs = auditLogRepository.findByEntityTypeAndEmployeeIdAndTimestampBetween(
                    entityType.trim(),
                    employeeId,
                    start.atStartOfDay(),
                    end.atTime(23, 59, 59)
                );
            } else if (entityType != null && !entityType.trim().isEmpty() && start != null && end != null) {
                // entityType + dates (without employeeId)
                auditLogs = auditLogService.getAuditLogsByEntityTypesAndDateRange(
                    Arrays.asList(entityType.trim()),
                    start.atStartOfDay(),
                    end.atTime(23, 59, 59)
                );
            } else if (entityType != null && !entityType.trim().isEmpty() && employeeId != null) {
                // entityType + employeeId (without dates) - filter by entityType first, then filter by employeeId in memory
                List<com.hrms.entity.AuditLog> entityLogs = auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType.trim());
                auditLogs = entityLogs.stream()
                    .filter(log -> log.getEmployeeId() != null && log.getEmployeeId().equals(employeeId))
                    .collect(Collectors.toList());
            } else if (entityType != null && !entityType.trim().isEmpty()) {
                // Only entityType
                auditLogs = auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType.trim());
            } else if (employeeId != null && start != null && end != null) {
                // employeeId + dates - filter by employeeId first, then filter by dates in memory
                List<com.hrms.entity.AuditLog> employeeLogs = auditLogService.getAuditLogsByEmployee(employeeId);
                LocalDateTime startDateTime = start.atStartOfDay();
                LocalDateTime endDateTime = end.atTime(23, 59, 59);
                auditLogs = employeeLogs.stream()
                    .filter(log -> {
                        if (log.getTimestamp() == null) return false;
                        return !log.getTimestamp().isBefore(startDateTime) && !log.getTimestamp().isAfter(endDateTime);
                    })
                    .collect(Collectors.toList());
            } else if (employeeId != null) {
                // Only employeeId
                auditLogs = auditLogService.getAuditLogsByEmployee(employeeId);
            } else if (start != null && end != null) {
                // Only dates
                auditLogs = auditLogService.getAuditLogsByDateRange(
                    start.atStartOfDay(),
                    end.atTime(23, 59, 59)
                );
            } else {
                // Default: last 3 months
                auditLogs = auditLogService.getAuditLogsByDateRange(
                    LocalDate.now().minusMonths(3).atStartOfDay(),
                    LocalDate.now().atTime(23, 59, 59)
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("auditLogs", auditLogs);
            response.put("count", auditLogs.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get payroll register (historical payroll data)
     */
    @GetMapping("/payroll-register")
    public ResponseEntity<?> getPayrollRegister(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long employeeId,
            HttpServletRequest request) {
        try {
            LocalDate startDate, endDate;
            
            if (year != null && month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            } else if (year != null) {
                startDate = LocalDate.of(year, 1, 1);
                endDate = LocalDate.of(year, 12, 31);
            } else {
                YearMonth currentMonth = YearMonth.now();
                startDate = currentMonth.atDay(1);
                endDate = currentMonth.atEndOfMonth();
            }

            List<Payroll> payrolls = getPayrollsForPeriod(startDate, endDate, employeeId);
            
            if (payrolls == null || payrolls.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No payroll data found");
                errorResponse.put("message", "No payroll records found for the selected period. Please ensure payroll has been processed for this period.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }
            
            Map<String, Object> registerData = generatePayrollRegisterData(payrolls, startDate, endDate);

            byte[] pdfBytes = pdfGeneratorService.generatePayrollRegister(registerData);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate payroll register");
                errorResponse.put("message", "PDF generation returned empty data");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "Payroll_Register_" + (year != null ? year : "Current") + 
                            (month != null ? "_" + String.format("%02d", month) : "") + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate payroll register");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    // Helper methods
    private List<Payroll> getPayrollsForPeriod(LocalDate startDate, LocalDate endDate, Long employeeId) {
        if (employeeId != null) {
            return payrollRepository.findByEmployeeIdAndStartDateBetween(employeeId, startDate, endDate);
        } else {
            return payrollRepository.findByStartDateBetween(startDate, endDate);
        }
    }

    private Map<String, Object> generatePFReportData(List<Payroll> payrolls, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("reportType", "PF Report");
        reportData.put("startDate", startDate.toString());
        reportData.put("endDate", endDate.toString());
        reportData.put("generatedDate", LocalDate.now().toString());

        List<Map<String, Object>> employeeData = new ArrayList<>();
        double totalEmployeePF = 0.0;
        double totalEmployerPF = 0.0;

        for (Payroll payroll : payrolls) {
            User employee = userRepository.findById(payroll.getEmployeeId()).orElse(null);
            if (employee == null) continue;

            Optional<SalaryStructure> salaryStructureOpt = salaryStructureRepository
                    .findByEmployeeIdAndActiveTrue(payroll.getEmployeeId());

            if (salaryStructureOpt.isPresent()) {
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                Double pfEmployee = salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0;
                Double pfEmployer = pfEmployee; // Typically same as employee PF

                Map<String, Object> empData = new HashMap<>();
                empData.put("employeeId", employee.getEmployeeId());
                empData.put("employeeName", employee.getName());
                empData.put("pfEmployee", pfEmployee);
                empData.put("pfEmployer", pfEmployer);
                empData.put("pfTotal", pfEmployee + pfEmployer);
                empData.put("month", payroll.getMonth());
                empData.put("year", payroll.getYear());

                employeeData.add(empData);
                totalEmployeePF += pfEmployee;
                totalEmployerPF += pfEmployer;
            }
        }

        reportData.put("employeeData", employeeData);
        reportData.put("totalEmployeePF", totalEmployeePF);
        reportData.put("totalEmployerPF", totalEmployerPF);
        reportData.put("totalPF", totalEmployeePF + totalEmployerPF);
        reportData.put("totalEmployees", employeeData.size());

        return reportData;
    }

    private Map<String, Object> generateESIReportData(List<Payroll> payrolls, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("reportType", "ESI Report");
        reportData.put("startDate", startDate.toString());
        reportData.put("endDate", endDate.toString());
        reportData.put("generatedDate", LocalDate.now().toString());

        List<Map<String, Object>> employeeData = new ArrayList<>();
        double totalEmployeeESI = 0.0;
        double totalEmployerESI = 0.0;

        for (Payroll payroll : payrolls) {
            User employee = userRepository.findById(payroll.getEmployeeId()).orElse(null);
            if (employee == null) continue;

            Optional<SalaryStructure> salaryStructureOpt = salaryStructureRepository
                    .findByEmployeeIdAndActiveTrue(payroll.getEmployeeId());

            if (salaryStructureOpt.isPresent()) {
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                Double esiEmployee = salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0;
                Double esiEmployer = esiEmployee > 0 ? (esiEmployee * 4.75 / 1.75) : 0.0; // Employer ESI = 4.75%, Employee = 1.75%

                Map<String, Object> empData = new HashMap<>();
                empData.put("employeeId", employee.getEmployeeId());
                empData.put("employeeName", employee.getName());
                empData.put("esiEmployee", esiEmployee);
                empData.put("esiEmployer", esiEmployer);
                empData.put("esiTotal", esiEmployee + esiEmployer);
                empData.put("month", payroll.getMonth());
                empData.put("year", payroll.getYear());

                employeeData.add(empData);
                totalEmployeeESI += esiEmployee;
                totalEmployerESI += esiEmployer;
            }
        }

        reportData.put("employeeData", employeeData);
        reportData.put("totalEmployeeESI", totalEmployeeESI);
        reportData.put("totalEmployerESI", totalEmployerESI);
        reportData.put("totalESI", totalEmployeeESI + totalEmployerESI);
        reportData.put("totalEmployees", employeeData.size());

        return reportData;
    }

    private Map<String, Object> generatePTReportData(List<Payroll> payrolls, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("reportType", "Professional Tax Report");
        reportData.put("startDate", startDate.toString());
        reportData.put("endDate", endDate.toString());
        reportData.put("generatedDate", LocalDate.now().toString());

        List<Map<String, Object>> employeeData = new ArrayList<>();
        double totalPT = 0.0;

        for (Payroll payroll : payrolls) {
            User employee = userRepository.findById(payroll.getEmployeeId()).orElse(null);
            if (employee == null) continue;

            Optional<SalaryStructure> salaryStructureOpt = salaryStructureRepository
                    .findByEmployeeIdAndActiveTrue(payroll.getEmployeeId());

            if (salaryStructureOpt.isPresent()) {
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                Double professionalTax = salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0;

                Map<String, Object> empData = new HashMap<>();
                empData.put("employeeId", employee.getEmployeeId());
                empData.put("employeeName", employee.getName());
                empData.put("professionalTax", professionalTax);
                empData.put("month", payroll.getMonth());
                empData.put("year", payroll.getYear());

                employeeData.add(empData);
                totalPT += professionalTax;
            }
        }

        reportData.put("employeeData", employeeData);
        reportData.put("totalPT", totalPT);
        reportData.put("totalEmployees", employeeData.size());

        return reportData;
    }

    private Map<String, Object> generateTDSReportData(List<Payroll> payrolls, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("reportType", "TDS Report");
        reportData.put("startDate", startDate.toString());
        reportData.put("endDate", endDate.toString());
        reportData.put("generatedDate", LocalDate.now().toString());

        List<Map<String, Object>> employeeData = new ArrayList<>();
        double totalTDS = 0.0;

        for (Payroll payroll : payrolls) {
            User employee = userRepository.findById(payroll.getEmployeeId()).orElse(null);
            if (employee == null) continue;

            Optional<SalaryStructure> salaryStructureOpt = salaryStructureRepository
                    .findByEmployeeIdAndActiveTrue(payroll.getEmployeeId());

            if (salaryStructureOpt.isPresent()) {
                SalaryStructure salaryStructure = salaryStructureOpt.get();
                Double tds = salaryStructure.getTds() != null ? salaryStructure.getTds() : 0.0;

                Map<String, Object> empData = new HashMap<>();
                empData.put("employeeId", employee.getEmployeeId());
                empData.put("employeeName", employee.getName());
                empData.put("pan", employee.getPan() != null ? employee.getPan() : "N/A");
                empData.put("tds", tds);
                empData.put("month", payroll.getMonth());
                empData.put("year", payroll.getYear());

                employeeData.add(empData);
                totalTDS += tds;
            }
        }

        reportData.put("employeeData", employeeData);
        reportData.put("totalTDS", totalTDS);
        reportData.put("totalEmployees", employeeData.size());

        return reportData;
    }

    private Map<String, Object> generatePayrollRegisterData(List<Payroll> payrolls, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> registerData = new HashMap<>();
        registerData.put("reportType", "Payroll Register");
        registerData.put("startDate", startDate.toString());
        registerData.put("endDate", endDate.toString());
        registerData.put("generatedDate", LocalDate.now().toString());

        List<Map<String, Object>> payrollData = new ArrayList<>();

        for (Payroll payroll : payrolls) {
            User employee = userRepository.findById(payroll.getEmployeeId()).orElse(null);
            if (employee == null) continue;

            Map<String, Object> payData = new HashMap<>();
            payData.put("employeeId", employee.getEmployeeId());
            payData.put("employeeName", employee.getName());
            payData.put("department", employee.getDepartment() != null ? employee.getDepartment() : "N/A");
            payData.put("baseSalary", payroll.getBaseSalary());
            payData.put("allowances", payroll.getAllowances());
            payData.put("deductions", payroll.getDeductions());
            payData.put("bonus", payroll.getBonus());
            payData.put("netSalary", payroll.getNetSalary());
            payData.put("status", payroll.getStatus());
            payData.put("month", payroll.getMonth());
            payData.put("year", payroll.getYear());

            payrollData.add(payData);
        }

        registerData.put("payrollData", payrollData);
        registerData.put("totalRecords", payrollData.size());

        return registerData;
    }

    /**
     * Get current user ID from request (set by JwtAuthenticationFilter)
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            // Get userId from request attribute set by JwtAuthenticationFilter
            Object userIdObj = request.getAttribute("userId");
            if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            } else if (userIdObj instanceof Number) {
                return ((Number) userIdObj).longValue();
            }
            // Fallback: Try to get from request header (if passed from frontend)
            String userIdHeader = request.getHeader("X-User-Id");
            if (userIdHeader != null && !userIdHeader.isEmpty()) {
                return Long.parseLong(userIdHeader);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}

