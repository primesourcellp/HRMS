package com.hrms.service;

import com.hrms.entity.Employee;
import com.hrms.entity.ShiftChangeRequest;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.ShiftChangeRequestRepository;
import com.hrms.repository.ShiftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ShiftChangeRequestService {

    @Autowired
    private ShiftChangeRequestRepository requestRepository;
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private ShiftRepository shiftRepository;
    
    @Autowired
    private ShiftService shiftService;

    public ShiftChangeRequest createRequest(@NonNull Long employeeId, @NonNull Long requestedShiftId, String reason) {
        // Get current shift ID
        Long currentShiftId = employeeRepository.getShiftIdByEmployeeId(employeeId);
        if (currentShiftId == null || currentShiftId == 0) {
            throw new RuntimeException("Employee is not assigned to any shift");
        }
        
        // Verify requested shift exists
        shiftRepository.findById(requestedShiftId)
                .orElseThrow(() -> new RuntimeException("Requested shift not found"));
        
        // Check if employee already has a pending request
        List<ShiftChangeRequest> pendingRequests = requestRepository.findByEmployeeIdAndStatus(
            employeeId, ShiftChangeRequest.RequestStatus.PENDING);
        if (!pendingRequests.isEmpty()) {
            throw new RuntimeException("You already have a pending shift change request");
        }
        
        // Check if requesting the same shift
        if (currentShiftId.equals(requestedShiftId)) {
            throw new RuntimeException("You are already assigned to this shift");
        }
        
        // Create request
        ShiftChangeRequest request = new ShiftChangeRequest(employeeId, currentShiftId, requestedShiftId, reason);
        return requestRepository.save(request);
    }

    public List<ShiftChangeRequest> getRequestsByEmployee(@NonNull Long employeeId) {
        return requestRepository.findByEmployeeIdOrderByRequestedDateDesc(employeeId);
    }

    public List<ShiftChangeRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<ShiftChangeRequest> getPendingRequests() {
        return requestRepository.findByStatusOrderByRequestedDateDesc(ShiftChangeRequest.RequestStatus.PENDING);
    }

    public Optional<ShiftChangeRequest> getRequestById(@NonNull Long requestId) {
        return requestRepository.findById(requestId);
    }

    @Transactional
    public ShiftChangeRequest approveRequest(@NonNull Long requestId, @NonNull Long reviewedBy) {
        ShiftChangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Shift change request not found"));
        
        if (request.getStatus() != ShiftChangeRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been processed");
        }
        
        // Verify requested shift still exists
        shiftRepository.findById(request.getRequestedShiftId())
                .orElseThrow(() -> new RuntimeException("Requested shift no longer exists"));
        
        // Update request status
        request.setStatus(ShiftChangeRequest.RequestStatus.APPROVED);
        request.setReviewedDate(LocalDateTime.now());
        request.setReviewedBy(reviewedBy);
        requestRepository.save(request);
        
        // Automatically update employee's shift assignment
        // Get current assignment dates if they exist
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        java.time.LocalDate startDate = employee.getShiftAssignmentStartDate();
        java.time.LocalDate endDate = employee.getShiftAssignmentEndDate();
        
        // If no start date, use today
        if (startDate == null) {
            startDate = java.time.LocalDate.now();
        }
        
        // Assign employee to new shift with existing dates
        shiftService.updateEmployeeAssignment(
            request.getEmployeeId(), 
            request.getRequestedShiftId(), 
            startDate != null ? startDate.toString() : null,
            endDate != null ? endDate.toString() : null
        );
        
        return request;
    }

    @Transactional
    public ShiftChangeRequest rejectRequest(@NonNull Long requestId, @NonNull Long reviewedBy, String rejectionReason) {
        ShiftChangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Shift change request not found"));
        
        if (request.getStatus() != ShiftChangeRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been processed");
        }
        
        // Update request status
        request.setStatus(ShiftChangeRequest.RequestStatus.REJECTED);
        request.setReviewedDate(LocalDateTime.now());
        request.setReviewedBy(reviewedBy);
        request.setRejectionReason(rejectionReason);
        
        return requestRepository.save(request);
    }
}

