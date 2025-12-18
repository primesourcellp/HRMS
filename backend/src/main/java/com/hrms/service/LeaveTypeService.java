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

        leaveType.setName(leaveTypeDetails.getName());
        leaveType.setCode(leaveTypeDetails.getCode());
        leaveType.setDescription(leaveTypeDetails.getDescription());
        leaveType.setMaxDays(leaveTypeDetails.getMaxDays());
        leaveType.setCarryForward(leaveTypeDetails.getCarryForward());
        leaveType.setMaxCarryForward(leaveTypeDetails.getMaxCarryForward());
        leaveType.setActive(leaveTypeDetails.getActive());

        return leaveTypeRepository.save(java.util.Objects.requireNonNull(leaveType));
    }

    public void deleteLeaveType(@NonNull Long id) {
        leaveTypeRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public Optional<LeaveType> getLeaveTypeById(@NonNull Long id) {
        return leaveTypeRepository.findById(java.util.Objects.requireNonNull(id));
    }
}

