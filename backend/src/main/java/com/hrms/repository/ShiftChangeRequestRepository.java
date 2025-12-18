package com.hrms.repository;

import com.hrms.entity.ShiftChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftChangeRequestRepository extends JpaRepository<ShiftChangeRequest, Long> {
    
    // Find all requests by employee
    List<ShiftChangeRequest> findByEmployeeIdOrderByRequestedDateDesc(Long employeeId);
    
    // Find all pending requests
    List<ShiftChangeRequest> findByStatusOrderByRequestedDateDesc(ShiftChangeRequest.RequestStatus status);
    
    // Find requests by status and employee
    List<ShiftChangeRequest> findByEmployeeIdAndStatusOrderByRequestedDateDesc(Long employeeId, ShiftChangeRequest.RequestStatus status);
    
    // Find pending requests for an employee
    List<ShiftChangeRequest> findByEmployeeIdAndStatus(Long employeeId, ShiftChangeRequest.RequestStatus status);
}

