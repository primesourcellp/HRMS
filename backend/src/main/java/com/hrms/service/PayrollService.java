package com.hrms.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import com.hrms.dto.PayrollDTO;
import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.entity.Leave;
import com.hrms.entity.Payroll;
import com.hrms.entity.SalaryStructure;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.PayrollRepository;
import com.hrms.repository.SalaryStructureRepository;

@Service
public class PayrollService {
    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

<<<<<<< HEAD
    public Optional<Payroll> getPayrollById(@NonNull Long id) {
        return payrollRepository.findById(java.util.Objects.requireNonNull(id));
=======
    public Optional<Payroll> getPayrollById(Long id) {
        return payrollRepository.findById(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public Payroll createPayroll(Payroll payroll) {
        // Calculate net amount
        double amount = payroll.getBaseSalary() + payroll.getAllowances() + payroll.getBonus() - payroll.getDeductions();
        payroll.setAmount(amount);
        return payrollRepository.save(payroll);
    }

<<<<<<< HEAD
    public List<Payroll> getPayrollsByEmployeeId(@NonNull Long employeeId) {
        return payrollRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
=======
    public List<Payroll> getPayrollsByEmployeeId(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public List<Payroll> getPayrollsByMonth(String month) {
        return payrollRepository.findByMonth(month);
    }

<<<<<<< HEAD
    public Payroll generatePayroll(@NonNull Long employeeId, String month, Integer year) {
        // This would typically fetch salary structure and calculate payroll
        // For now, creating a basic payroll entry
=======
    public Payroll generatePayroll(Long employeeId, String month, Integer year) {
        // Fetch employee to get salary
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Use employee salary as base salary
        double employeeSalary = employee.getSalary() != null ? employee.getSalary() : 0.0;
        
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        Payroll payroll = new Payroll();
        payroll.setEmployeeId(employeeId);
        payroll.setMonth(month);
        payroll.setYear(year);
<<<<<<< HEAD
        payroll.setBaseSalary(0.0);
        payroll.setAllowances(0.0);
        payroll.setBonus(0.0);
        payroll.setDeductions(0.0);
        payroll.setAmount(0.0);
        payroll.setNetSalary(0.0);
        payroll.setStatus("DRAFT");
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
=======
        payroll.setBaseSalary(employeeSalary);
        payroll.setAllowances(0.0);
        payroll.setBonus(0.0);
        payroll.setDeductions(0.0);
        payroll.setAmount(employeeSalary);
        payroll.setNetSalary(employeeSalary);
        payroll.setStatus("DRAFT");
        return payrollRepository.save(payroll);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    /**
     * Process payroll for all employees for a given period
     */
    @Transactional
    public List<Payroll> processPayrollForAllEmployees(LocalDate startDate, LocalDate endDate) {
        List<Employee> employees = employeeRepository.findAll();
        String month = startDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        Integer year = startDate.getYear();

        return employees.stream()
                .map(employee -> {
                    try {
<<<<<<< HEAD
                        return processEmployeePayroll(java.util.Objects.requireNonNull(employee.getId()), startDate, endDate, month, year);
=======
                        return processEmployeePayroll(employee.getId(), startDate, endDate, month, year);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                    } catch (Exception e) {
                        // Log error but continue processing other employees
                        System.err.println("Error processing payroll for employee " + employee.getName() + " (ID: " + employee.getId() + "): " + e.getMessage());
                        // Return null for failed employees, will be filtered out
                        return null;
                    }
                })
                .filter(payroll -> payroll != null) // Filter out null (failed) payrolls
                .collect(Collectors.toList());
    }

    /**
     * Process payroll for a single employee
     */
    @Transactional
<<<<<<< HEAD
    public Payroll processEmployeePayroll(@NonNull Long employeeId, LocalDate startDate, LocalDate endDate, String month, Integer year) {
=======
    public Payroll processEmployeePayroll(Long employeeId, LocalDate startDate, LocalDate endDate, String month, Integer year) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        // Check if payroll already exists for this period
        Optional<Payroll> existing = payrollRepository.findAll().stream()
                .filter(p -> p.getEmployeeId().equals(employeeId) 
                        && p.getMonth().equals(month) 
                        && p.getYear().equals(year))
                .findFirst();

        if (existing.isPresent() && !"DRAFT".equals(existing.get().getStatus())) {
            throw new RuntimeException("Payroll already processed for this period");
        }

        // Get employee and salary structure
<<<<<<< HEAD
        Employee employee = employeeRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Optional<SalaryStructure> salaryOpt = salaryStructureRepository.findByEmployeeIdAndActiveTrue(java.util.Objects.requireNonNull(employeeId));
        if (!salaryOpt.isPresent()) {
            // Instead of throwing exception, create a payroll entry with zero values
            // This allows the process to continue for other employees
            System.err.println("Warning: Salary structure not found for employee: " + employee.getName() + " (ID: " + employeeId + "). Creating payroll with zero values.");
=======
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Optional<SalaryStructure> salaryOpt = salaryStructureRepository.findByEmployeeIdAndActiveTrue(employeeId);
        if (!salaryOpt.isPresent()) {
            // Instead of throwing exception, create a payroll entry with zero values
            // This allows the process to continue for other employees
            System.err.println("Warning: Salary structure not found for employee: " + employee.getName() + " (ID: " + employeeId + "). Using employee salary as base salary.");
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            
            Payroll payroll = existing.orElse(new Payroll());
            payroll.setEmployeeId(employeeId);
            payroll.setMonth(month);
            payroll.setYear(year);
            payroll.setStartDate(startDate);
            payroll.setEndDate(endDate);
<<<<<<< HEAD
            payroll.setBaseSalary(0.0);
            payroll.setAllowances(0.0);
            payroll.setBonus(0.0);
            payroll.setDeductions(0.0);
            payroll.setAmount(0.0);
            payroll.setNetSalary(0.0);
            payroll.setStatus("DRAFT");
            payroll.setNotes("Salary structure not found - requires manual review");
=======
            // Use employee salary as base salary
            double employeeSalary = employee.getSalary() != null ? employee.getSalary() : 0.0;
            payroll.setBaseSalary(employeeSalary);
            payroll.setAllowances(0.0);
            payroll.setBonus(0.0);
            payroll.setDeductions(0.0);
            payroll.setAmount(employeeSalary);
            payroll.setNetSalary(employeeSalary);
            payroll.setStatus("DRAFT");
            payroll.setNotes("Salary structure not found - using employee salary as base salary");
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            return payrollRepository.save(payroll);
        }
        SalaryStructure salaryStructure = salaryOpt.get();

        // Get attendance records for the period
        List<Attendance> attendanceRecords = attendanceRepository
<<<<<<< HEAD
                .findByEmployeeIdAndDateBetween(java.util.Objects.requireNonNull(employeeId), startDate, endDate);

        // Get approved leaves for the period
        List<Leave> approvedLeaves = leaveRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId)).stream()
=======
                .findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);

        // Get approved leaves for the period
        List<Leave> approvedLeaves = leaveRepository.findByEmployeeId(employeeId).stream()
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .filter(leave -> "APPROVED".equals(leave.getStatus())
                        && !leave.getStartDate().isAfter(endDate)
                        && !leave.getEndDate().isBefore(startDate))
                .collect(Collectors.toList());

        // Calculate total days in period
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        // Calculate present days
        long presentDays = attendanceRecords.stream()
                .filter(a -> "Present".equals(a.getStatus()))
                .count();

        // Calculate leave days (only approved leaves)
        double leaveDays = approvedLeaves.stream()
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
        if (payableDays > totalDays) payableDays = totalDays;

        // Calculate proration factor
        double prorationFactor = totalDays > 0 ? payableDays / totalDays : 0.0;

<<<<<<< HEAD
        // Calculate earnings (prorated)
        double basicSalary = salaryStructure.getBasicSalary() != null ? salaryStructure.getBasicSalary() : 0.0;
=======
        // Calculate earnings (prorated) - Use employee salary as base salary instead of salary structure basic salary
        double basicSalary = employee.getSalary() != null ? employee.getSalary() : 0.0;
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        double hra = salaryStructure.getHra() != null ? salaryStructure.getHra() : 0.0;
        double transportAllowance = salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0;
        double medicalAllowance = salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0;
        double specialAllowance = salaryStructure.getSpecialAllowance() != null ? salaryStructure.getSpecialAllowance() : 0.0;
        double otherAllowances = salaryStructure.getOtherAllowances() != null ? salaryStructure.getOtherAllowances() : 0.0;

        double baseSalaryEarned = basicSalary * prorationFactor;
        double hraEarned = hra * prorationFactor;
        double allowancesEarned = (transportAllowance + medicalAllowance + specialAllowance + otherAllowances) * prorationFactor;
        double grossSalaryEarned = baseSalaryEarned + hraEarned + allowancesEarned;

        // Calculate deductions (prorated)
        double pfDeduction = (salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0) * prorationFactor;
        double esiDeduction = (salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0) * prorationFactor;
        double tdsDeduction = (salaryStructure.getTds() != null ? salaryStructure.getTds() : 0.0) * prorationFactor;
        double professionalTaxDeduction = (salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0) * prorationFactor;
        double otherDeductionsAmount = (salaryStructure.getOtherDeductions() != null ? salaryStructure.getOtherDeductions() : 0.0) * prorationFactor;

        double totalDeductions = pfDeduction + esiDeduction + tdsDeduction + professionalTaxDeduction + otherDeductionsAmount;

        // Calculate net salary
        double netSalary = grossSalaryEarned - totalDeductions;

        // Create or update payroll
        Payroll payroll = existing.orElse(new Payroll());
        payroll.setEmployeeId(employeeId);
        payroll.setMonth(month);
        payroll.setYear(year);
        payroll.setStartDate(startDate);
        payroll.setEndDate(endDate);
        payroll.setBaseSalary(baseSalaryEarned);
        payroll.setAllowances(allowancesEarned);
        payroll.setBonus(0.0);
        payroll.setDeductions(totalDeductions);
        payroll.setAmount(grossSalaryEarned);
        payroll.setNetSalary(netSalary);
        payroll.setStatus("PENDING_APPROVAL");

<<<<<<< HEAD
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
=======
        return payrollRepository.save(payroll);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    /**
     * Submit payroll for approval (moves from DRAFT to PENDING_APPROVAL)
     */
    @Transactional
<<<<<<< HEAD
    public Payroll submitPayrollForApproval(@NonNull Long payrollId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
=======
    public Payroll submitPayrollForApproval(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!"DRAFT".equals(payroll.getStatus())) {
            throw new RuntimeException("Payroll must be in DRAFT status to submit for approval");
        }

        // Validate that payroll has valid amounts
        if (payroll.getNetSalary() == null || payroll.getNetSalary() <= 0) {
            throw new RuntimeException("Cannot submit payroll with zero or invalid net salary. Please edit the payroll first.");
        }

        payroll.setStatus("PENDING_APPROVAL");
<<<<<<< HEAD
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
=======
        return payrollRepository.save(payroll);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    /**
     * Approve payroll (moves from PENDING_APPROVAL to APPROVED)
     */
    @Transactional
<<<<<<< HEAD
    public Payroll approvePayroll(@NonNull Long payrollId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
=======
    public Payroll approvePayroll(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!"PENDING_APPROVAL".equals(payroll.getStatus())) {
            throw new RuntimeException("Payroll is not in PENDING_APPROVAL status");
        }

        payroll.setStatus("APPROVED");
<<<<<<< HEAD
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
=======
        return payrollRepository.save(payroll);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    /**
     * Finalize payroll (moves from APPROVED to FINALIZED and generates payslips)
     */
    @Transactional
<<<<<<< HEAD
    public Payroll finalizePayroll(@NonNull Long payrollId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
=======
    public Payroll finalizePayroll(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!"APPROVED".equals(payroll.getStatus())) {
            throw new RuntimeException("Payroll must be APPROVED before finalization");
        }

        payroll.setStatus("FINALIZED");
<<<<<<< HEAD
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
=======
        return payrollRepository.save(payroll);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    /**
     * Finalize all approved payrolls for a period
     */
    @Transactional
    public List<Payroll> finalizeAllApprovedPayrolls(String month, Integer year) {
        List<Payroll> approvedPayrolls = payrollRepository.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus())
                        && p.getMonth().equals(month)
                        && p.getYear().equals(year))
                .collect(Collectors.toList());

        approvedPayrolls.forEach(p -> p.setStatus("FINALIZED"));
        return payrollRepository.saveAll(approvedPayrolls);
    }

    /**
     * Mark payroll as paid (moves from FINALIZED to PAID)
     */
    @Transactional
<<<<<<< HEAD
    public Payroll markPayrollAsPaid(@NonNull Long payrollId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
=======
    public Payroll markPayrollAsPaid(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!"FINALIZED".equals(payroll.getStatus())) {
            throw new RuntimeException("Payroll must be FINALIZED before marking as paid");
        }

        payroll.setStatus("PAID");
<<<<<<< HEAD
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
=======
        return payrollRepository.save(payroll);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    /**
     * Update payroll (only allowed for DRAFT or PENDING_APPROVAL status)
     */
    @Transactional
<<<<<<< HEAD
    public Payroll updatePayroll(@NonNull Long payrollId, PayrollDTO payrollDTO) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
=======
    public Payroll updatePayroll(Long payrollId, PayrollDTO payrollDTO) {
        Payroll payroll = payrollRepository.findById(payrollId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        // Only allow updates for DRAFT or PENDING_APPROVAL status
        if (!"DRAFT".equals(payroll.getStatus()) && !"PENDING_APPROVAL".equals(payroll.getStatus())) {
            throw new RuntimeException("Payroll can only be updated when status is DRAFT or PENDING_APPROVAL");
        }

        // Update allowed fields
        if (payrollDTO.getBaseSalary() != null) {
            payroll.setBaseSalary(payrollDTO.getBaseSalary());
        }
        if (payrollDTO.getAllowances() != null) {
            payroll.setAllowances(payrollDTO.getAllowances());
        }
        if (payrollDTO.getBonus() != null) {
            payroll.setBonus(payrollDTO.getBonus());
        }
        if (payrollDTO.getDeductions() != null) {
            payroll.setDeductions(payrollDTO.getDeductions());
        }
        if (payrollDTO.getNotes() != null) {
            payroll.setNotes(payrollDTO.getNotes());
        }

        // Recalculate amount and net salary
        double amount = payroll.getBaseSalary() + payroll.getAllowances() + payroll.getBonus() - payroll.getDeductions();
        payroll.setAmount(amount);
        payroll.setNetSalary(amount);

        return payrollRepository.save(payroll);
    }
<<<<<<< HEAD
}
=======

    /**
     * Delete payroll (only allowed for DRAFT or PENDING_APPROVAL status)
     */
    @Transactional
    public void deletePayroll(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        // Only allow deletion for DRAFT or PENDING_APPROVAL status
        if (!"DRAFT".equals(payroll.getStatus()) && !"PENDING_APPROVAL".equals(payroll.getStatus())) {
            throw new RuntimeException("Payroll can only be deleted when status is DRAFT or PENDING_APPROVAL");
        }

        payrollRepository.delete(payroll);
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
