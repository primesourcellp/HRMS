package com.hrms.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.LeaveBalance;
import com.hrms.entity.LeaveType;
import com.hrms.repository.LeaveBalanceRepository;
import com.hrms.repository.LeaveTypeRepository;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

@Service
public class LeaveBalanceService {

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

<<<<<<< HEAD
    public LeaveBalance getOrCreateLeaveBalance(@NonNull Long employeeId, @NonNull Long leaveTypeId, Integer year) {
=======
    public LeaveBalance getOrCreateLeaveBalance(Long employeeId, Long leaveTypeId, Integer year) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        // Handle potential duplicates by getting all matches and selecting the best one
        List<LeaveBalance> existingList = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year)
                .stream()
                .filter(b -> b.getLeaveTypeId().equals(leaveTypeId))
                .collect(java.util.stream.Collectors.toList());

<<<<<<< HEAD
        LeaveType leaveType = leaveTypeRepository.findById(java.util.Objects.requireNonNull(leaveTypeId))
=======
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Leave type not found"));

        if (!existingList.isEmpty()) {
            // If duplicates exist, merge them and keep the best one
            if (existingList.size() > 1) {
                // Merge duplicates: keep the one with highest totalDays, or most recent
                LeaveBalance bestBalance = existingList.stream()
                        .max((b1, b2) -> {
                            int totalDaysCompare = Double.compare(b1.getTotalDays(), b2.getTotalDays());
                            if (totalDaysCompare != 0) return totalDaysCompare;
                            // If totalDays equal, prefer the one with higher balance
                            int balanceCompare = Double.compare(b1.getBalance(), b2.getBalance());
                            if (balanceCompare != 0) return balanceCompare;
                            // If balance equal, prefer the most recent
                            if (b1.getLastUpdated() != null && b2.getLastUpdated() != null) {
                                return b1.getLastUpdated().compareTo(b2.getLastUpdated());
                            }
                            return 0;
                        })
                        .orElse(existingList.get(0));
                
                // Merge data from all duplicates
                double totalUsedDays = existingList.stream().mapToDouble(LeaveBalance::getUsedDays).sum();
                double totalCarriedForward = existingList.stream().mapToDouble(LeaveBalance::getCarriedForward).sum();
                double maxTotalDays = existingList.stream().mapToDouble(LeaveBalance::getTotalDays).max().orElse(0.0);
                
                bestBalance.setUsedDays(totalUsedDays);
                bestBalance.setCarriedForward(totalCarriedForward);
                if (maxTotalDays > bestBalance.getTotalDays()) {
                    bestBalance.setTotalDays(maxTotalDays);
                }
                bestBalance.setBalance(bestBalance.getTotalDays() + bestBalance.getCarriedForward() - bestBalance.getUsedDays());
                bestBalance.setLastUpdated(LocalDate.now());
                
                // Delete other duplicates
                existingList.stream()
                        .filter(b -> !b.getId().equals(bestBalance.getId()))
<<<<<<< HEAD
                        .forEach(b -> leaveBalanceRepository.delete(java.util.Objects.requireNonNull(b)));
=======
                        .forEach(b -> leaveBalanceRepository.delete(b));
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                
                LeaveBalance saved = leaveBalanceRepository.save(bestBalance);
                
                // If balance has 0 totalDays and leave type has maxDays, update it
                if (saved.getTotalDays() == 0.0 && leaveType.getMaxDays() != null && leaveType.getMaxDays() > 0) {
                    saved.setTotalDays(leaveType.getMaxDays().doubleValue());
                    saved.setBalance(saved.getTotalDays() + saved.getCarriedForward() - saved.getUsedDays());
                    saved.setLastUpdated(LocalDate.now());
                    return leaveBalanceRepository.save(saved);
                }
                return saved;
            }
            
            // Single result
            LeaveBalance balance = existingList.get(0);
            // If balance exists but has 0 totalDays and leave type has maxDays, update it
            if (balance.getTotalDays() == 0.0 && leaveType.getMaxDays() != null && leaveType.getMaxDays() > 0) {
                balance.setTotalDays(leaveType.getMaxDays().doubleValue());
                balance.setBalance(balance.getTotalDays() + balance.getCarriedForward() - balance.getUsedDays());
                balance.setLastUpdated(LocalDate.now());
                return leaveBalanceRepository.save(balance);
            }
            return balance;
        }

        LeaveBalance balance = new LeaveBalance();
<<<<<<< HEAD
        balance.setEmployeeId(java.util.Objects.requireNonNull(employeeId));
        balance.setLeaveTypeId(java.util.Objects.requireNonNull(leaveTypeId));
=======
        balance.setEmployeeId(employeeId);
        balance.setLeaveTypeId(leaveTypeId);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        balance.setYear(year);
        balance.setTotalDays(leaveType.getMaxDays() != null ? leaveType.getMaxDays().doubleValue() : 0.0);
        balance.setUsedDays(0.0);
        balance.setCarriedForward(0.0);
        balance.setBalance(balance.getTotalDays());
        balance.setLastUpdated(LocalDate.now());

<<<<<<< HEAD
        return leaveBalanceRepository.save(java.util.Objects.requireNonNull(balance));
    }

    public List<LeaveBalance> getEmployeeLeaveBalances(@NonNull Long employeeId, Integer year) {
        if (year == null) {
            year = LocalDate.now().getYear();
        }
        return leaveBalanceRepository.findByEmployeeIdAndYear(java.util.Objects.requireNonNull(employeeId), year);
    }

    public LeaveBalance updateLeaveBalance(@NonNull Long employeeId, @NonNull Long leaveTypeId, Integer year, Double usedDays) {
        LeaveBalance balance = getOrCreateLeaveBalance(java.util.Objects.requireNonNull(employeeId), java.util.Objects.requireNonNull(leaveTypeId), year);
        balance.setUsedDays(usedDays);
        balance.setBalance(balance.getTotalDays() + balance.getCarriedForward() - usedDays);
        balance.setLastUpdated(LocalDate.now());
        return leaveBalanceRepository.save(java.util.Objects.requireNonNull(balance));
    }

    public void carryForwardLeaves(@NonNull Long employeeId, Integer fromYear, Integer toYear) {
        List<LeaveBalance> fromYearBalances = leaveBalanceRepository.findByEmployeeIdAndYear(java.util.Objects.requireNonNull(employeeId), fromYear);
=======
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
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        
        for (LeaveBalance balance : fromYearBalances) {
            LeaveType leaveType = balance.getLeaveType();
            if (leaveType != null && leaveType.getCarryForward()) {
                double carryForwardAmount = Math.min(
                    balance.getBalance(),
                    leaveType.getMaxCarryForward() != null ? leaveType.getMaxCarryForward().doubleValue() : 0.0
                );

                if (carryForwardAmount > 0) {
<<<<<<< HEAD
                    LeaveBalance newYearBalance = getOrCreateLeaveBalance(java.util.Objects.requireNonNull(employeeId), java.util.Objects.requireNonNull(balance.getLeaveTypeId()), toYear);
                    newYearBalance.setCarriedForward(carryForwardAmount);
                    newYearBalance.setBalance(newYearBalance.getTotalDays() + carryForwardAmount - newYearBalance.getUsedDays());
                    newYearBalance.setLastUpdated(LocalDate.now());
                    leaveBalanceRepository.save(java.util.Objects.requireNonNull(newYearBalance));
=======
                    LeaveBalance newYearBalance = getOrCreateLeaveBalance(employeeId, balance.getLeaveTypeId(), toYear);
                    newYearBalance.setCarriedForward(carryForwardAmount);
                    newYearBalance.setBalance(newYearBalance.getTotalDays() + carryForwardAmount - newYearBalance.getUsedDays());
                    newYearBalance.setLastUpdated(LocalDate.now());
                    leaveBalanceRepository.save(newYearBalance);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                }
            }
        }
    }

<<<<<<< HEAD
    public List<LeaveBalance> initializeLeaveBalances(@NonNull Long employeeId, Integer year) {
=======
    public List<LeaveBalance> initializeLeaveBalances(Long employeeId, Integer year) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        List<LeaveType> allLeaveTypes = leaveTypeRepository.findByActiveTrue();
        List<LeaveBalance> balances = new java.util.ArrayList<>();
        
        for (LeaveType leaveType : allLeaveTypes) {
<<<<<<< HEAD
            LeaveBalance balance = getOrCreateLeaveBalance(java.util.Objects.requireNonNull(employeeId), java.util.Objects.requireNonNull(leaveType.getId()), year);
=======
            LeaveBalance balance = getOrCreateLeaveBalance(employeeId, leaveType.getId(), year);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            
            // If balance exists but has 0 totalDays and leave type has maxDays, update it
            if (balance.getTotalDays() == 0.0 && leaveType.getMaxDays() != null && leaveType.getMaxDays() > 0) {
                balance.setTotalDays(leaveType.getMaxDays().doubleValue());
                balance.setBalance(balance.getTotalDays() + balance.getCarriedForward() - balance.getUsedDays());
                balance.setLastUpdated(LocalDate.now());
<<<<<<< HEAD
                balance = leaveBalanceRepository.save(java.util.Objects.requireNonNull(balance));
=======
                balance = leaveBalanceRepository.save(balance);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            }
            
            balances.add(balance);
        }
        
        return balances;
    }

<<<<<<< HEAD
    public LeaveBalance assignLeaveBalance(@NonNull Long employeeId, @NonNull Long leaveTypeId, Integer year, Double totalDays) {
        LeaveBalance balance = getOrCreateLeaveBalance(java.util.Objects.requireNonNull(employeeId), java.util.Objects.requireNonNull(leaveTypeId), year);
        balance.setTotalDays(totalDays);
        balance.setBalance(totalDays + balance.getCarriedForward() - balance.getUsedDays());
        balance.setLastUpdated(LocalDate.now());
        return leaveBalanceRepository.save(java.util.Objects.requireNonNull(balance));
    }
}
=======
    public LeaveBalance assignLeaveBalance(Long employeeId, Long leaveTypeId, Integer year, Double totalDays) {
        LeaveBalance balance = getOrCreateLeaveBalance(employeeId, leaveTypeId, year);
        balance.setTotalDays(totalDays);
        balance.setBalance(totalDays + balance.getCarriedForward() - balance.getUsedDays());
        balance.setLastUpdated(LocalDate.now());
        return leaveBalanceRepository.save(balance);
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
