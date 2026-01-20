package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.Leave;
import com.hrms.entity.LeaveType;
import com.hrms.entity.User;
import com.hrms.repository.LeaveTypeRepository;
import com.hrms.repository.UserRepository;
import com.hrms.service.AuditLogService;
import com.hrms.service.LeaveService;
import com.hrms.service.NotificationService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveController {
    @Autowired
    private LeaveService leaveService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    @GetMapping
    public ResponseEntity<?> getAllLeaves(@RequestParam(required = false) String status) {
        try {
            List<Leave> leaves;
            if (status != null && !status.isEmpty()) {
                leaves = leaveService.getLeavesByStatus(status);
            } else {
                leaves = leaveService.getAllLeaves();
            }
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch leaves");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Leave> getLeaveById(@PathVariable Long id) {
        return leaveService.getLeaveById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Leave>> getLeavesByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployeeId(employeeId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Leave>> getPendingLeaves() {
        return ResponseEntity.ok(leaveService.getPendingLeaves());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createLeave(@RequestBody Leave leave, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Leave created = leaveService.createLeave(leave);
            
            // Log audit event
            Long userId = getCurrentUserId(request);
            if (userId != null && created != null) {
                User employee = userRepository.findById(created.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                auditLogService.logEvent(
                    "LEAVE",
                    created.getId(),
                    "CREATE",
                    userId,
                    null,
                    created,
                    String.format("Created leave request for %s from %s to %s", employeeName, created.getStartDate(), created.getEndDate()),
                    request
                );
                
                // Send notification to HR_ADMIN if employee is in their team
                try {
                    String leaveTypeName = "Leave";
                    if (created.getLeaveTypeId() != null) {
                        Optional<LeaveType> leaveTypeOpt = leaveTypeRepository.findById(created.getLeaveTypeId());
                        if (leaveTypeOpt.isPresent()) {
                            leaveTypeName = leaveTypeOpt.get().getName();
                        }
                    }
                    notificationService.notifyLeaveApplication(
                        created.getEmployeeId(),
                        created.getId(),
                        employeeName,
                        leaveTypeName,
                        created.getStartDate().toString(),
                        created.getEndDate().toString()
                    );
                } catch (Exception e) {
                    // Log but don't fail the request if notification fails
                    System.err.println("Failed to send leave application notification: " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("message", "Leave application submitted successfully");
            response.put("leave", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveLeave(
            @PathVariable Long id, @RequestBody Map<String, Long> requestBody, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Get userId from request if not provided
            Long approvedBy = requestBody.get("approvedBy");
            Long currentUserId = approvedBy != null ? approvedBy : getCurrentUserId(request);
            
            // Get old leave state before approval
            Optional<Leave> oldLeaveOpt = leaveService.getLeaveById(id);
            Leave oldLeave = oldLeaveOpt.orElse(null);
            
            Leave approved = leaveService.approveLeave(id, currentUserId);
            
            // Log audit event
            if (currentUserId != null && approved != null) {
                User employee = userRepository.findById(approved.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                auditLogService.logEvent(
                    "LEAVE",
                    approved.getId(),
                    "APPROVE",
                    currentUserId,
                    oldLeave,
                    approved,
                    String.format("Approved leave request for %s from %s to %s", employeeName, approved.getStartDate(), approved.getEndDate()),
                    request
                );
                
                // Send notification to SUPER_ADMIN and employee when leave is approved
                try {
                    String leaveTypeName = "Leave";
                    if (approved.getLeaveTypeId() != null) {
                        Optional<LeaveType> leaveTypeOpt = leaveTypeRepository.findById(approved.getLeaveTypeId());
                        if (leaveTypeOpt.isPresent()) {
                            leaveTypeName = leaveTypeOpt.get().getName();
                        }
                    }
                    notificationService.notifyLeaveApproved(
                        approved.getId(),
                        approved.getEmployeeId(),
                        employeeName,
                        leaveTypeName,
                        approved.getStartDate().toString(),
                        approved.getEndDate().toString(),
                        currentUserId
                    );
                } catch (Exception e) {
                    // Log but don't fail the request if notification fails
                    System.err.println("Failed to send leave approval notification: " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("message", "Leave approved successfully");
            response.put("leave", approved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectLeave(
            @PathVariable Long id, @RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Get userId from request if not provided
            Long approvedBy = null;
            if (requestBody.containsKey("approvedBy") && requestBody.get("approvedBy") != null) {
                approvedBy = Long.valueOf(requestBody.get("approvedBy").toString());
            }
            Long currentUserId = approvedBy != null ? approvedBy : getCurrentUserId(request);
            String rejectionReason = requestBody.containsKey("rejectionReason") ? requestBody.get("rejectionReason").toString() : "";
            
            // Get old leave state before rejection
            Optional<Leave> oldLeaveOpt = leaveService.getLeaveById(id);
            Leave oldLeave = oldLeaveOpt.orElse(null);
            
            Leave rejected = leaveService.rejectLeave(id, currentUserId, rejectionReason);
            
            // Log audit event
            if (currentUserId != null && rejected != null) {
                User employee = userRepository.findById(rejected.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                auditLogService.logEvent(
                    "LEAVE",
                    rejected.getId(),
                    "REJECT",
                    currentUserId,
                    oldLeave,
                    rejected,
                    String.format("Rejected leave request for %s from %s to %s. Reason: %s", employeeName, rejected.getStartDate(), rejected.getEndDate(), rejectionReason),
                    request
                );
                
                // Send notification to employee when leave is rejected
                try {
                    String leaveTypeName = "Leave";
                    if (rejected.getLeaveTypeId() != null) {
                        Optional<LeaveType> leaveTypeOpt = leaveTypeRepository.findById(rejected.getLeaveTypeId());
                        if (leaveTypeOpt.isPresent()) {
                            leaveTypeName = leaveTypeOpt.get().getName();
                        }
                    }
                    notificationService.notifyLeaveRejected(
                        rejected.getId(),
                        rejected.getEmployeeId(),
                        employeeName,
                        leaveTypeName,
                        rejected.getStartDate().toString(),
                        rejected.getEndDate().toString(),
                        rejectionReason,
                        currentUserId
                    );
                } catch (Exception e) {
                    // Log but don't fail the request if notification fails
                    System.err.println("Failed to send leave rejection notification: " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("message", "Leave rejected");
            response.put("leave", rejected);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Leave> updateLeaveStatus(@PathVariable Long id, @RequestBody Map<String, String> requestBody, HttpServletRequest request) {
        String status = requestBody.get("status");
        
        // Get old leave state before status update
        Optional<Leave> oldLeaveOpt = leaveService.getLeaveById(id);
        Leave oldLeave = oldLeaveOpt.orElse(null);
        
        Leave updated = leaveService.updateLeaveStatus(id, status);
        
        // Log audit event
        Long userId = getCurrentUserId(request);
        if (userId != null && updated != null) {
            User employee = userRepository.findById(updated.getEmployeeId()).orElse(null);
            String employeeName = employee != null ? employee.getName() : "Unknown";
            auditLogService.logEvent(
                "LEAVE",
                updated.getId(),
                "UPDATE_STATUS",
                userId,
                oldLeave,
                updated,
                String.format("Updated leave status to %s for %s", status, employeeName),
                request
            );
        }
        
        return ResponseEntity.ok(updated);
    }

    /**
     * Get current user ID from request (set by JwtAuthenticationFilter)
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            Object userIdObj = request.getAttribute("userId");
            if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            } else if (userIdObj instanceof Number) {
                return ((Number) userIdObj).longValue();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}

