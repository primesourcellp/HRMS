package com.hrms.service;

import com.hrms.entity.LeaveType;
import com.hrms.repository.LeaveTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        return leaveTypeRepository.save(leaveType);
    }

    public LeaveType updateLeaveType(Long id, LeaveType leaveTypeDetails) {
        LeaveType leaveType = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave type not found"));

        leaveType.setName(leaveTypeDetails.getName());
        leaveType.setCode(leaveTypeDetails.getCode());
        leaveType.setMaxDays(leaveTypeDetails.getMaxDays());
        leaveType.setCarryForward(leaveTypeDetails.getCarryForward());
        leaveType.setMaxCarryForward(leaveTypeDetails.getMaxCarryForward());
        leaveType.setDescription(leaveTypeDetails.getDescription());
        leaveType.setActive(leaveTypeDetails.getActive());

        return leaveTypeRepository.save(leaveType);
    }

    public void deleteLeaveType(Long id) {
        leaveTypeRepository.deleteById(id);
    }

    public Optional<LeaveType> getLeaveTypeById(Long id) {
        return leaveTypeRepository.findById(id);
    }

    public Optional<LeaveType> getLeaveTypeByCode(String code) {
        return leaveTypeRepository.findByCode(code);
    }
}

