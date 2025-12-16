package com.hrms.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import com.hrms.entity.Holiday;
import com.hrms.entity.Leave;
import com.hrms.repository.HolidayRepository;
import com.hrms.repository.LeaveRepository;

@Service
public class LeaveService {
    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private HolidayRepository holidayRepository;

    @Autowired
    private LeaveBalanceService leaveBalanceService;

    public List<Leave> getAllLeaves() {
        return leaveRepository.findAll();
    }

<<<<<<< HEAD
    public Optional<Leave> getLeaveById(@NonNull Long id) {
        return leaveRepository.findById(java.util.Objects.requireNonNull(id));
=======
    public Optional<Leave> getLeaveById(Long id) {
        return leaveRepository.findById(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

        // Check leave balance
        if (leave.getLeaveTypeId() != null) {
            int year = leave.getStartDate().getYear();
            var balance = leaveBalanceService.getOrCreateLeaveBalance(
<<<<<<< HEAD
                java.util.Objects.requireNonNull(leave.getEmployeeId()), java.util.Objects.requireNonNull(leave.getLeaveTypeId()), year);
=======
                leave.getEmployeeId(), leave.getLeaveTypeId(), year);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            
            if (balance.getBalance() < totalDays) {
                throw new RuntimeException("Insufficient leave balance");
            }
        }

        return leaveRepository.save(leave);
    }

<<<<<<< HEAD
    public Leave approveLeave(@NonNull Long id, Long approvedBy) {
        Leave leave = leaveRepository.findById(java.util.Objects.requireNonNull(id))
=======
    public Leave approveLeave(Long id, Long approvedBy) {
        Leave leave = leaveRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus("APPROVED");
        leave.setApprovedBy(approvedBy);
        leave.setApprovedDate(LocalDate.now());

        // Update leave balance
        if (leave.getLeaveTypeId() != null) {
            int year = leave.getStartDate().getYear();
            var balance = leaveBalanceService.getOrCreateLeaveBalance(
<<<<<<< HEAD
                java.util.Objects.requireNonNull(leave.getEmployeeId()), java.util.Objects.requireNonNull(leave.getLeaveTypeId()), year);
            
            double newUsedDays = balance.getUsedDays() + leave.getTotalDays();
            leaveBalanceService.updateLeaveBalance(
                java.util.Objects.requireNonNull(leave.getEmployeeId()), java.util.Objects.requireNonNull(leave.getLeaveTypeId()), year, newUsedDays);
        }

        return leaveRepository.save(java.util.Objects.requireNonNull(leave));
    }

    public Leave rejectLeave(@NonNull Long id, Long approvedBy, String rejectionReason) {
        Leave leave = leaveRepository.findById(java.util.Objects.requireNonNull(id))
=======
                leave.getEmployeeId(), leave.getLeaveTypeId(), year);
            
            double newUsedDays = balance.getUsedDays() + leave.getTotalDays();
            leaveBalanceService.updateLeaveBalance(
                leave.getEmployeeId(), leave.getLeaveTypeId(), year, newUsedDays);
        }

        return leaveRepository.save(leave);
    }

    public Leave rejectLeave(Long id, Long approvedBy, String rejectionReason) {
        Leave leave = leaveRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus("REJECTED");
        leave.setApprovedBy(approvedBy);
        leave.setApprovedDate(LocalDate.now());
        leave.setRejectionReason(rejectionReason);

<<<<<<< HEAD
        return leaveRepository.save(java.util.Objects.requireNonNull(leave));
    }

    public Leave updateLeaveStatus(@NonNull Long id, String status) {
        Leave leave = leaveRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Leave not found with id: " + id));
        leave.setStatus(status);
        return leaveRepository.save(java.util.Objects.requireNonNull(leave));
=======
        return leaveRepository.save(leave);
    }

    public Leave updateLeaveStatus(Long id, String status) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave not found with id: " + id));
        leave.setStatus(status);
        return leaveRepository.save(leave);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public List<Leave> getLeavesByStatus(String status) {
        return leaveRepository.findByStatus(status);
    }

<<<<<<< HEAD
    public List<Leave> getLeavesByEmployeeId(@NonNull Long employeeId) {
        return leaveRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
=======
    public List<Leave> getLeavesByEmployeeId(Long employeeId) {
        return leaveRepository.findByEmployeeId(employeeId);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
