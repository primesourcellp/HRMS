package com.hrms.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.PayrollDTO;
import com.hrms.entity.Attendance;
import com.hrms.entity.Leave;
import com.hrms.entity.Payroll;
import com.hrms.entity.SalaryStructure;
import com.hrms.entity.User;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.PayrollRepository;
import com.hrms.repository.SalaryStructureRepository;
import com.hrms.repository.UserRepository;

@Service
public class PayrollService {
    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    public Optional<Payroll> getPayrollById(@NonNull Long id) {
        return payrollRepository.findById(java.util.Objects.requireNonNull(id));
    }

    public Payroll createPayroll(Payroll payroll) {
        // Calculate net amount (handle null values)
        double baseSalary = payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0;
        double allowances = payroll.getAllowances() != null ? payroll.getAllowances() : 0.0;
        double bonus = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
        double deductions = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
        
        double amount = baseSalary + allowances + bonus - deductions;
        payroll.setAmount(amount);
        payroll.setNetSalary(amount);
        payroll.setStatus("DRAFT");
        payroll.setCreatedAt(java.time.LocalDateTime.now());
        return payrollRepository.save(payroll);
    }

    public List<Payroll> getPayrollsByEmployeeId(@NonNull Long employeeId) {
        return payrollRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
    }

    public List<Payroll> getPayrollsByMonth(String month) {
        return payrollRepository.findByMonth(month);
    }

    public Payroll generatePayroll(@NonNull Long employeeId, String month, Integer year) {
        // This would typically fetch salary structure and calculate payroll
        // For now, creating a basic payroll entry
        Payroll payroll = new Payroll();
        payroll.setEmployeeId(employeeId);
        payroll.setMonth(month);
        payroll.setYear(year);
        payroll.setBaseSalary(0.0);
        payroll.setAllowances(0.0);
        payroll.setBonus(0.0);
        payroll.setDeductions(0.0);
        payroll.setAmount(0.0);
        payroll.setNetSalary(0.0);
        payroll.setStatus("DRAFT");
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }

    /**
     * Process payroll for all employees for a given period
     */
    @Transactional
    public List<Payroll> processPayrollForAllEmployees(LocalDate startDate, LocalDate endDate) {
        List<User> users = userRepository.findAll();
        String month = startDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        Integer year = startDate.getYear();

        return users.stream()
                .map(user -> {
                    try {
                        return processEmployeePayroll(java.util.Objects.requireNonNull(user.getId()), startDate, endDate, month, year);
                    } catch (Exception e) {
                        // Log error but continue processing other users
                        System.err.println("Error processing payroll for user " + user.getName() + " (ID: " + user.getId() + "): " + e.getMessage());
                        // Return null for failed users, will be filtered out
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
    public Payroll processEmployeePayroll(@NonNull Long employeeId, LocalDate startDate, LocalDate endDate, String month, Integer year) {
        // Check if payroll already exists for this period (find all duplicates)
        List<Payroll> existingPayrolls = payrollRepository.findByEmployeeIdAndMonthAndYear(employeeId, month, year);
        Optional<Payroll> existing = existingPayrolls.stream().findFirst();
        
        // If duplicates exist, remove them before processing (keep only the first one)
        if (existingPayrolls.size() > 1) {
            // Keep the one with the highest status priority or most recent
            Payroll bestPayroll = existingPayrolls.stream()
                    .max((p1, p2) -> {
                        // Priority: FINALIZED > APPROVED > PENDING_APPROVAL > DRAFT
                        int statusCompare = getStatusPriority(p1.getStatus()) - getStatusPriority(p2.getStatus());
                        if (statusCompare != 0) return statusCompare;
                        // If same status, prefer the one with higher net salary or more recent
                        if (p1.getNetSalary() != null && p2.getNetSalary() != null) {
                            return Double.compare(p1.getNetSalary(), p2.getNetSalary());
                        }
                        return 0;
                    })
                    .orElse(existingPayrolls.get(0));
            
            // Delete all duplicates except the best one
            existingPayrolls.stream()
                    .filter(p -> p != null && !p.getId().equals(bestPayroll.getId()))
                    .forEach(p -> payrollRepository.delete(java.util.Objects.requireNonNull(p)));
            
            existing = Optional.of(bestPayroll);
        }

        // Allow reprocessing if status is DRAFT or PENDING_APPROVAL (to fix incorrect values)
        if (existing.isPresent() && !"DRAFT".equals(existing.get().getStatus()) && !"PENDING_APPROVAL".equals(existing.get().getStatus())) {
            throw new RuntimeException("Payroll already processed for this period. Only DRAFT or PENDING_APPROVAL payrolls can be reprocessed.");
        }

        // Get employee and salary structure
        User user = userRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<SalaryStructure> salaryOpt = salaryStructureRepository.findByEmployeeIdAndActiveTrue(java.util.Objects.requireNonNull(employeeId));
        if (!salaryOpt.isPresent()) {
            // Instead of throwing exception, create a payroll entry with zero values
            // This allows the process to continue for other employees
            System.err.println("Warning: Salary structure not found for user: " + user.getName() + " (ID: " + employeeId + "). Creating payroll with zero values.");
            
            Payroll payroll = existing.orElse(new Payroll());
            payroll.setEmployeeId(employeeId);
            payroll.setMonth(month);
            payroll.setYear(year);
            payroll.setStartDate(startDate);
            payroll.setEndDate(endDate);
            payroll.setBaseSalary(0.0);
            payroll.setAllowances(0.0);
            payroll.setBonus(0.0);
            payroll.setDeductions(0.0);
            payroll.setAmount(0.0);
            payroll.setNetSalary(0.0);
            payroll.setStatus("DRAFT");
            payroll.setNotes("Salary structure not found - requires manual review");
            return payrollRepository.save(payroll);
        }
        SalaryStructure salaryStructure = salaryOpt.get();

        // Get attendance records for the period
        List<Attendance> attendanceRecords = attendanceRepository
                .findByEmployeeIdAndDateBetween(java.util.Objects.requireNonNull(employeeId), startDate, endDate);

        // Get approved leaves for the period
        List<Leave> approvedLeaves = leaveRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId)).stream()
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

        // Calculate proration factor based on attendance and leaves
        double prorationFactor = totalDays > 0 ? payableDays / totalDays : 0.0;

        // Get full salary structure values (not prorated)
        double basicSalary = salaryStructure.getBasicSalary() != null ? salaryStructure.getBasicSalary() : 0.0;
        double hra = salaryStructure.getHra() != null ? salaryStructure.getHra() : 0.0;
        double transportAllowance = salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0;
        double medicalAllowance = salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0;
        double specialAllowance = salaryStructure.getSpecialAllowance() != null ? salaryStructure.getSpecialAllowance() : 0.0;
        double otherAllowances = salaryStructure.getOtherAllowances() != null ? salaryStructure.getOtherAllowances() : 0.0;

        // Calculate full allowances (HRA + transport + medical + special + other)
        double totalAllowances = hra + transportAllowance + medicalAllowance + specialAllowance + otherAllowances;
        
        // Calculate full gross salary
        double grossSalary = basicSalary + totalAllowances;

        // Get full deduction values (not prorated)
        double pfDeduction = salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0;
        double esiDeduction = salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0;
        double tdsDeduction = salaryStructure.getTds() != null ? salaryStructure.getTds() : 0.0;
        double professionalTaxDeduction = salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0;
        double otherDeductionsAmount = salaryStructure.getOtherDeductions() != null ? salaryStructure.getOtherDeductions() : 0.0;

        // Calculate total deductions (full amount)
        double totalDeductions = pfDeduction + esiDeduction + tdsDeduction + professionalTaxDeduction + otherDeductionsAmount;

        // Calculate full net salary before proration
        double fullNetSalary = grossSalary - totalDeductions;
        
        // Apply proration only to the net salary (based on attendance/leaves)
        double netSalary = fullNetSalary * prorationFactor;

        // Create or update payroll
        Payroll payroll = existing.orElse(new Payroll());
        boolean isNew = payroll.getId() == null;
        
        payroll.setEmployeeId(employeeId);
        payroll.setMonth(month);
        payroll.setYear(year);
        payroll.setStartDate(startDate);
        payroll.setEndDate(endDate);
        // Store full salary structure values (not prorated)
        payroll.setBaseSalary(basicSalary);
        payroll.setAllowances(totalAllowances);
        payroll.setBonus(0.0);
        payroll.setDeductions(totalDeductions);
        // Amount should represent net salary (not gross), but for backward compatibility, keep grossSalary
        // The netSalary field is the correct one to use
        payroll.setAmount(grossSalary);
        // Net salary is prorated based on attendance/leaves
        payroll.setNetSalary(netSalary);
        
        // Set workflow timestamps
        if (isNew) {
            payroll.setCreatedAt(java.time.LocalDateTime.now());
            payroll.setStatus("DRAFT");
        } else if (payroll.canBeEdited()) {
            // Only update if in editable status
            payroll.setStatus("DRAFT");
        }

        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }

    /**
     * Submit payroll for approval (moves from DRAFT/REJECTED to PENDING_APPROVAL)
     */
    @Transactional
    public Payroll submitPayrollForApproval(@NonNull Long payrollId, Long submittedByUserId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!payroll.canBeSubmitted()) {
            throw new RuntimeException("Payroll must be in DRAFT or REJECTED status to submit for approval. Current status: " + payroll.getStatus());
        }

        // Validate that payroll has valid amounts
        if (payroll.getNetSalary() == null || payroll.getNetSalary() <= 0) {
            throw new RuntimeException("Cannot submit payroll with zero or invalid net salary. Please edit the payroll first.");
        }
        
        // Validate required fields
        if (payroll.getBaseSalary() == null || payroll.getBaseSalary() < 0) {
            throw new RuntimeException("Base salary must be set and non-negative");
        }
        if (payroll.getAmount() == null || payroll.getAmount() < 0) {
            throw new RuntimeException("Gross amount must be calculated and non-negative");
        }

        payroll.setStatus("PENDING_APPROVAL");
        payroll.setSubmittedAt(java.time.LocalDateTime.now());
        payroll.setSubmittedBy(submittedByUserId);
        // Clear rejection fields if resubmitting after rejection
        if ("REJECTED".equals(payroll.getStatus())) {
            payroll.setRejectedAt(null);
            payroll.setRejectedBy(null);
            payroll.setRejectionReason(null);
        }
        
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }

    /**
     * Approve payroll (moves from PENDING_APPROVAL to APPROVED)
     */
    @Transactional
    public Payroll approvePayroll(@NonNull Long payrollId, Long approvedByUserId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!payroll.canBeApproved()) {
            throw new RuntimeException("Payroll is not in PENDING_APPROVAL status. Current status: " + payroll.getStatus());
        }

        payroll.setStatus("APPROVED");
        payroll.setApprovedAt(java.time.LocalDateTime.now());
        payroll.setApprovedBy(approvedByUserId);
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }
    
    /**
     * Reject payroll (moves from PENDING_APPROVAL to REJECTED)
     */
    @Transactional
    public Payroll rejectPayroll(@NonNull Long payrollId, String rejectionReason, Long rejectedByUserId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!payroll.canBeRejected()) {
            throw new RuntimeException("Payroll is not in PENDING_APPROVAL status. Current status: " + payroll.getStatus());
        }
        
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }

        payroll.setStatus("REJECTED");
        payroll.setRejectedAt(java.time.LocalDateTime.now());
        payroll.setRejectedBy(rejectedByUserId);
        payroll.setRejectionReason(rejectionReason);
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }

    /**
     * Finalize payroll (moves from APPROVED to FINALIZED and generates payslips)
     */
    @Transactional
    public Payroll finalizePayroll(@NonNull Long payrollId, Long finalizedByUserId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!payroll.canBeFinalized()) {
            throw new RuntimeException("Payroll must be APPROVED before finalization. Current status: " + payroll.getStatus());
        }
        
        // Final validation before finalization
        if (payroll.getNetSalary() == null || payroll.getNetSalary() <= 0) {
            throw new RuntimeException("Cannot finalize payroll with zero or invalid net salary");
        }

        payroll.setStatus("FINALIZED");
        payroll.setFinalizedAt(java.time.LocalDateTime.now());
        payroll.setFinalizedBy(finalizedByUserId);
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }

    /**
     * Finalize all approved payrolls for a period
     */
    @Transactional
    public List<Payroll> finalizeAllApprovedPayrolls(String month, Integer year, Long finalizedByUserId) {
        List<Payroll> approvedPayrolls = payrollRepository.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus())
                        && p.getMonth().equals(month)
                        && p.getYear().equals(year))
                .collect(Collectors.toList());

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        approvedPayrolls.forEach(p -> {
            p.setStatus("FINALIZED");
            p.setFinalizedAt(now);
            p.setFinalizedBy(finalizedByUserId);
        });
        return payrollRepository.saveAll(approvedPayrolls);
    }

    /**
     * Mark payroll as paid (moves from FINALIZED to PAID)
     */
    @Transactional
    public Payroll markPayrollAsPaid(@NonNull Long payrollId, Long paidByUserId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        if (!payroll.canBePaid()) {
            throw new RuntimeException("Payroll must be FINALIZED before marking as paid. Current status: " + payroll.getStatus());
        }

        payroll.setStatus("PAID");
        payroll.setPaidAt(java.time.LocalDateTime.now());
        payroll.setPaidBy(paidByUserId);
        return payrollRepository.save(java.util.Objects.requireNonNull(payroll));
    }

    /**
     * Update payroll (only allowed for DRAFT or PENDING_APPROVAL status)
     */
    @Transactional
    public Payroll updatePayroll(@NonNull Long payrollId, PayrollDTO payrollDTO) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        // Only allow updates for editable statuses
        if (!payroll.canBeEdited()) {
            throw new RuntimeException("Payroll can only be updated when status is DRAFT, PENDING_APPROVAL, or REJECTED. Current status: " + payroll.getStatus());
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

        // Recalculate amount and net salary (handle null values)
        double baseSalary = payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0;
        double allowances = payroll.getAllowances() != null ? payroll.getAllowances() : 0.0;
        double bonus = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
        double deductions = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
        
        double amount = baseSalary + allowances + bonus - deductions;
        payroll.setAmount(amount);
        payroll.setNetSalary(amount);

        return payrollRepository.save(payroll);
    }

    @Transactional
    public void deletePayroll(@NonNull Long payrollId) {
        Payroll payroll = payrollRepository.findById(java.util.Objects.requireNonNull(payrollId))
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        // Only allow deletion for deletable statuses
        if (!payroll.canBeDeleted()) {
            throw new RuntimeException("Payroll can only be deleted when status is DRAFT, PENDING_APPROVAL, or REJECTED. Current status: " + payroll.getStatus());
        }

        payrollRepository.delete(payroll);
    }
    
    /**
     * Remove duplicate payroll records for all employees
     * Keeps the best payroll (highest status priority, highest net salary) for each employee-month-year combination
     */
    @Transactional
    public int removeDuplicatePayrolls() {
        List<Payroll> allPayrolls = payrollRepository.findAll();
        Map<String, List<Payroll>> payrollGroups = new HashMap<>();
        
        // Group payrolls by employeeId-month-year
        for (Payroll payroll : allPayrolls) {
            String key = payroll.getEmployeeId() + "-" + payroll.getMonth() + "-" + payroll.getYear();
            payrollGroups.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(payroll);
        }
        
        int duplicatesRemoved = 0;
        
        // For each group, keep only the best payroll
        for (Map.Entry<String, List<Payroll>> entry : payrollGroups.entrySet()) {
            List<Payroll> group = entry.getValue();
            if (group.size() > 1) {
                // Find the best payroll (highest status priority, highest net salary)
                Payroll bestPayroll = group.stream()
                        .max((p1, p2) -> {
                            int statusCompare = getStatusPriority(p1.getStatus()) - getStatusPriority(p2.getStatus());
                            if (statusCompare != 0) return statusCompare;
                            if (p1.getNetSalary() != null && p2.getNetSalary() != null) {
                                return Double.compare(p1.getNetSalary(), p2.getNetSalary());
                            }
                            // If net salary is null, prefer the one with higher gross amount
                            if (p1.getAmount() != null && p2.getAmount() != null) {
                                return Double.compare(p1.getAmount(), p2.getAmount());
                            }
                            return 0;
                        })
                        .orElse(group.get(0));
                
                // Delete all duplicates except the best one
                for (Payroll payroll : group) {
                    if (!payroll.getId().equals(bestPayroll.getId())) {
                        payrollRepository.delete(payroll);
                        duplicatesRemoved++;
                    }
                }
            }
        }
        
        return duplicatesRemoved;
    }
    
    /**
     * Remove duplicate payroll records for a specific employee
     */
    @Transactional
    public int removeDuplicatePayrollsForEmployee(@NonNull Long employeeId) {
        List<Payroll> employeePayrolls = payrollRepository.findByEmployeeId(employeeId);
        Map<String, List<Payroll>> payrollGroups = new HashMap<>();
        
        // Group payrolls by month-year
        for (Payroll payroll : employeePayrolls) {
            String key = payroll.getMonth() + "-" + payroll.getYear();
            payrollGroups.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(payroll);
        }
        
        int duplicatesRemoved = 0;
        
        // For each group, keep only the best payroll
        for (Map.Entry<String, List<Payroll>> entry : payrollGroups.entrySet()) {
            List<Payroll> group = entry.getValue();
            if (group.size() > 1) {
                Payroll bestPayroll = group.stream()
                        .max((p1, p2) -> {
                            int statusCompare = getStatusPriority(p1.getStatus()) - getStatusPriority(p2.getStatus());
                            if (statusCompare != 0) return statusCompare;
                            if (p1.getNetSalary() != null && p2.getNetSalary() != null) {
                                return Double.compare(p1.getNetSalary(), p2.getNetSalary());
                            }
                            if (p1.getAmount() != null && p2.getAmount() != null) {
                                return Double.compare(p1.getAmount(), p2.getAmount());
                            }
                            return 0;
                        })
                        .orElse(group.get(0));
                
                for (Payroll payroll : group) {
                    if (!payroll.getId().equals(bestPayroll.getId())) {
                        payrollRepository.delete(payroll);
                        duplicatesRemoved++;
                    }
                }
            }
        }
        
        return duplicatesRemoved;
    }
    
    /**
     * Get status priority for sorting (higher number = higher priority)
     */
    private int getStatusPriority(String status) {
        if (status == null) return 0;
        switch (status.toUpperCase()) {
            case "FINALIZED": return 4;
            case "PAID": return 4;
            case "APPROVED": return 3;
            case "PENDING_APPROVAL": return 2;
            case "DRAFT": return 1;
            default: return 0;
        }
    }
    
    /**
     * Recalculate net salary for all payrolls (fixes incorrect calculations)
     * Only updates payrolls in DRAFT or PENDING_APPROVAL status
     */
    @Transactional
    public int recalculateAllNetSalaries() {
        List<Payroll> allPayrolls = payrollRepository.findAll();
        int updatedCount = 0;
        
        for (Payroll payroll : allPayrolls) {
            // Only recalculate if in editable status
            if (payroll.canBeEdited()) {
                double baseSalary = payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0.0;
                double allowances = payroll.getAllowances() != null ? payroll.getAllowances() : 0.0;
                double bonus = payroll.getBonus() != null ? payroll.getBonus() : 0.0;
                double deductions = payroll.getDeductions() != null ? payroll.getDeductions() : 0.0;
                
                double netSalary = baseSalary + allowances + bonus - deductions;
                payroll.setNetSalary(netSalary);
                payroll.setAmount(netSalary); // Also update amount to match net salary
                payrollRepository.save(payroll);
                updatedCount++;
            }
        }
        
        return updatedCount;
    }
}
