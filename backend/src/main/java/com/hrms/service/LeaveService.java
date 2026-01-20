package com.hrms.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.hrms.entity.Holiday;
import com.hrms.entity.Leave;
import com.hrms.entity.LeaveType;
import com.hrms.repository.HolidayRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.LeaveTypeRepository;

@Service
public class LeaveService {
    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private HolidayRepository holidayRepository;

    @Autowired
    private LeaveBalanceService leaveBalanceService;

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    public List<Leave> getAllLeaves() {
        return leaveRepository.findAll();
    }

    public Optional<Leave> getLeaveById(@NonNull Long id) {
        return leaveRepository.findById(java.util.Objects.requireNonNull(id));
    }

    public Leave createLeave(Leave leave) {
        // Calculate total days excluding holidays
        double totalDays = calculateLeaveDays(leave.getStartDate(), leave.getEndDate(), leave.getHalfDay());
        leave.setTotalDays(totalDays);

        if (leave.getAppliedDate() == null) {
            leave.setAppliedDate(LocalDate.now());
        }
        if (leave.getStatus() == null) {
            leave.setStatus("PENDING");
        }

        // Ensure type field is set - if null or empty, fetch from LeaveType
        if ((leave.getType() == null || leave.getType().trim().isEmpty()) && leave.getLeaveTypeId() != null) {
            Optional<LeaveType> leaveTypeOpt = leaveTypeRepository.findById(leave.getLeaveTypeId());
            if (leaveTypeOpt.isPresent()) {
                leave.setType(leaveTypeOpt.get().getName());
            } else {
                leave.setType("Leave"); // Fallback if leave type not found
            }
        } else if (leave.getType() == null || leave.getType().trim().isEmpty()) {
            leave.setType("Leave"); // Fallback if leaveTypeId is also null
        }

        // Check leave balance
        if (leave.getLeaveTypeId() != null) {
            int year = leave.getStartDate().getYear();
            var balance = leaveBalanceService.getOrCreateLeaveBalance(
                java.util.Objects.requireNonNull(leave.getEmployeeId()), java.util.Objects.requireNonNull(leave.getLeaveTypeId()), year);
            
            if (balance.getBalance() < totalDays) {
                throw new RuntimeException("Insufficient leave balance");
            }
        }

        return leaveRepository.save(leave);
    }

    public Leave approveLeave(@NonNull Long id, Long approvedBy) {
        Leave leave = leaveRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus("APPROVED");
        leave.setApprovedBy(approvedBy);
        leave.setApprovedDate(LocalDate.now());

        // Update leave balance
        if (leave.getLeaveTypeId() != null) {
            int year = leave.getStartDate().getYear();
            var balance = leaveBalanceService.getOrCreateLeaveBalance(
                java.util.Objects.requireNonNull(leave.getEmployeeId()), java.util.Objects.requireNonNull(leave.getLeaveTypeId()), year);
            
            double newUsedDays = balance.getUsedDays() + leave.getTotalDays();
            leaveBalanceService.updateLeaveBalance(
                java.util.Objects.requireNonNull(leave.getEmployeeId()), java.util.Objects.requireNonNull(leave.getLeaveTypeId()), year, newUsedDays);
        }

        return leaveRepository.save(java.util.Objects.requireNonNull(leave));
    }

    public Leave rejectLeave(@NonNull Long id, Long approvedBy, String rejectionReason) {
        Leave leave = leaveRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus("REJECTED");
        leave.setApprovedBy(approvedBy);
        leave.setApprovedDate(LocalDate.now());
        leave.setRejectionReason(rejectionReason);

        return leaveRepository.save(java.util.Objects.requireNonNull(leave));
    }

    public Leave updateLeaveStatus(@NonNull Long id, String status) {
        Leave leave = leaveRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Leave not found with id: " + id));
        leave.setStatus(status);
        return leaveRepository.save(java.util.Objects.requireNonNull(leave));
    }

    public List<Leave> getLeavesByStatus(String status) {
        return leaveRepository.findByStatus(status);
    }

    public List<Leave> getLeavesByEmployeeId(@NonNull Long employeeId) {
        return leaveRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
    }

    public List<Leave> getPendingLeaves() {
        return leaveRepository.findByStatus("PENDING");
    }

    private double calculateLeaveDays(LocalDate startDate, LocalDate endDate, Boolean halfDay) {
        if (halfDay != null && halfDay) {
            return 0.5;
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        
        // Exclude holidays
        List<Holiday> holidays = holidayRepository.findByDateBetween(startDate, endDate);
        days -= holidays.size();

        return days;
    }
}
