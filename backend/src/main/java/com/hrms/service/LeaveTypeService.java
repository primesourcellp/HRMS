package com.hrms.service;

import com.hrms.entity.LeaveType;
import com.hrms.repository.LeaveTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

@Service
public class LeaveTypeService {

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    public List<LeaveType> getAllLeaveTypes() {
        return leaveTypeRepository.findAll();
    }

    public List<LeaveType> getActiveLeaveTypes() {
        return leaveTypeRepository.findByActiveTrue();
    }

    public LeaveType createLeaveType(LeaveType leaveType) {
        return leaveTypeRepository.save(java.util.Objects.requireNonNull(leaveType));
    }

    public LeaveType updateLeaveType(@NonNull Long id, LeaveType leaveTypeDetails) {
        LeaveType leaveType = leaveTypeRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Leave type not found"));

        // Update fields only if they are provided (to avoid overwriting with nulls for partial updates)
        if (leaveTypeDetails.getName() != null) leaveType.setName(leaveTypeDetails.getName());
        if (leaveTypeDetails.getCode() != null) leaveType.setCode(leaveTypeDetails.getCode());
        if (leaveTypeDetails.getDescription() != null) leaveType.setDescription(leaveTypeDetails.getDescription());
        if (leaveTypeDetails.getMaxDays() != null) leaveType.setMaxDays(leaveTypeDetails.getMaxDays());
        if (leaveTypeDetails.getCarryForward() != null) leaveType.setCarryForward(leaveTypeDetails.getCarryForward());
        if (leaveTypeDetails.getMaxCarryForward() != null) leaveType.setMaxCarryForward(leaveTypeDetails.getMaxCarryForward());
        if (leaveTypeDetails.getMonthlyLeave() != null) leaveType.setMonthlyLeave(leaveTypeDetails.getMonthlyLeave());
        if (leaveTypeDetails.getActive() != null) leaveType.setActive(leaveTypeDetails.getActive());

        return leaveTypeRepository.save(java.util.Objects.requireNonNull(leaveType));
    }

    // Convenience method to update active status only
    public LeaveType updateActiveStatus(@NonNull Long id, @NonNull Boolean active) {
        LeaveType leaveType = leaveTypeRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Leave type not found"));
        leaveType.setActive(active);
        return leaveTypeRepository.save(leaveType);
    }

    public void deleteLeaveType(@NonNull Long id) {
        leaveTypeRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public Optional<LeaveType> getLeaveTypeById(@NonNull Long id) {
        return leaveTypeRepository.findById(java.util.Objects.requireNonNull(id));
    }
}

