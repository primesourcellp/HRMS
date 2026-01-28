package com.hrms.service;

import com.hrms.entity.User;
import com.hrms.entity.ShiftChangeRequest;
import com.hrms.repository.UserRepository;
import com.hrms.repository.ShiftChangeRequestRepository;
import com.hrms.repository.ShiftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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
    private UserRepository userRepository;
    
    @Autowired
    private ShiftRepository shiftRepository;
    
    @Autowired
    @Lazy
    private ShiftService shiftService;

    public ShiftChangeRequest createRequest(@NonNull Long employeeId, @NonNull Long requestedShiftId, String reason) {
        // Get current shift ID
        Long currentShiftId = userRepository.getShiftIdByEmployeeId(employeeId);
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
        Long requestedShiftId = request.getRequestedShiftId();
        if (requestedShiftId == null) {
            throw new RuntimeException("Requested shift ID is null");
        }
        shiftRepository.findById(java.util.Objects.requireNonNull(requestedShiftId))
                .orElseThrow(() -> new RuntimeException("Requested shift no longer exists"));
        
        // Update request status
        request.setStatus(ShiftChangeRequest.RequestStatus.APPROVED);
        request.setReviewedDate(LocalDateTime.now());
        request.setReviewedBy(reviewedBy);
        requestRepository.save(request);
        
        // Automatically update user's shift assignment
        // Get current assignment dates if they exist
        Long employeeId = request.getEmployeeId();
        if (employeeId == null) {
            throw new RuntimeException("Employee ID is null");
        }
        User user = userRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        java.time.LocalDate startDate = user.getShiftAssignmentStartDate();
        java.time.LocalDate endDate = user.getShiftAssignmentEndDate();
        
        // If no start date, use today
        if (startDate == null) {
            startDate = java.time.LocalDate.now();
        }
        
        // Assign user to new shift with existing dates
        shiftService.updateEmployeeAssignment(
            java.util.Objects.requireNonNull(employeeId), 
            java.util.Objects.requireNonNull(requestedShiftId), 
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

