package com.hrms.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.LeaveBalance;
import com.hrms.entity.LeaveType;
import com.hrms.repository.LeaveBalanceRepository;
import com.hrms.repository.LeaveTypeRepository;

@Service
public class LeaveBalanceService {

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    public LeaveBalance getOrCreateLeaveBalance(Long employeeId, Long leaveTypeId, Integer year) {
        Optional<LeaveBalance> existing = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, leaveTypeId, year);

        if (existing.isPresent()) {
            return existing.get();
        }

        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
                .orElseThrow(() -> new RuntimeException("Leave type not found"));

        LeaveBalance balance = new LeaveBalance();
        balance.setEmployeeId(employeeId);
        balance.setLeaveTypeId(leaveTypeId);
        balance.setYear(year);
        balance.setTotalDays(leaveType.getMaxDays() != null ? leaveType.getMaxDays().doubleValue() : 0.0);
        balance.setUsedDays(0.0);
        balance.setCarriedForward(0.0);
        balance.setBalance(balance.getTotalDays());
        balance.setLastUpdated(LocalDate.now());

        return leaveBalanceRepository.save(balance);
    }

    public List<LeaveBalance> getEmployeeLeaveBalances(Long employeeId, Integer year) {
        if (year == null) {
            year = LocalDate.now().getYear();
        }
        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year);
    }

    public LeaveBalance updateLeaveBalance(Long employeeId, Long leaveTypeId, Integer year, Double usedDays) {
        LeaveBalance balance = getOrCreateLeaveBalance(employeeId, leaveTypeId, year);
        balance.setUsedDays(usedDays);
        balance.setBalance(balance.getTotalDays() + balance.getCarriedForward() - usedDays);
        balance.setLastUpdated(LocalDate.now());
        return leaveBalanceRepository.save(balance);
    }

    public void carryForwardLeaves(Long employeeId, Integer fromYear, Integer toYear) {
        List<LeaveBalance> fromYearBalances = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, fromYear);
        
        for (LeaveBalance balance : fromYearBalances) {
            LeaveType leaveType = balance.getLeaveType();
            if (leaveType != null && leaveType.getCarryForward()) {
                double carryForwardAmount = Math.min(
                    balance.getBalance(),
                    leaveType.getMaxCarryForward() != null ? leaveType.getMaxCarryForward().doubleValue() : 0.0
                );

                if (carryForwardAmount > 0) {
                    LeaveBalance newYearBalance = getOrCreateLeaveBalance(employeeId, balance.getLeaveTypeId(), toYear);
                    newYearBalance.setCarriedForward(carryForwardAmount);
                    newYearBalance.setBalance(newYearBalance.getTotalDays() + carryForwardAmount - newYearBalance.getUsedDays());
                    newYearBalance.setLastUpdated(LocalDate.now());
                    leaveBalanceRepository.save(newYearBalance);
                }
            }
        }
    }
}

