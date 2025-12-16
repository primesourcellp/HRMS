package com.hrms.service;

import com.hrms.entity.LeaveType;
import com.hrms.repository.LeaveTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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
<<<<<<< HEAD
        return leaveTypeRepository.save(java.util.Objects.requireNonNull(leaveType));
    }

    public LeaveType updateLeaveType(@NonNull Long id, LeaveType leaveTypeDetails) {
        LeaveType leaveType = leaveTypeRepository.findById(java.util.Objects.requireNonNull(id))
=======
        return leaveTypeRepository.save(leaveType);
    }

    public LeaveType updateLeaveType(Long id, LeaveType leaveTypeDetails) {
        LeaveType leaveType = leaveTypeRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Leave type not found"));

        leaveType.setName(leaveTypeDetails.getName());
        leaveType.setCode(leaveTypeDetails.getCode());
        leaveType.setMaxDays(leaveTypeDetails.getMaxDays());
        leaveType.setCarryForward(leaveTypeDetails.getCarryForward());
        leaveType.setMaxCarryForward(leaveTypeDetails.getMaxCarryForward());
        leaveType.setDescription(leaveTypeDetails.getDescription());
        leaveType.setActive(leaveTypeDetails.getActive());

<<<<<<< HEAD
        return leaveTypeRepository.save(java.util.Objects.requireNonNull(leaveType));
    }

    public void deleteLeaveType(@NonNull Long id) {
        leaveTypeRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public Optional<LeaveType> getLeaveTypeById(@NonNull Long id) {
        return leaveTypeRepository.findById(java.util.Objects.requireNonNull(id));
=======
        return leaveTypeRepository.save(leaveType);
    }

    public void deleteLeaveType(Long id) {
        leaveTypeRepository.deleteById(id);
    }

    public Optional<LeaveType> getLeaveTypeById(Long id) {
        return leaveTypeRepository.findById(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public Optional<LeaveType> getLeaveTypeByCode(String code) {
        return leaveTypeRepository.findByCode(code);
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
