package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
<<<<<<< HEAD
import org.springframework.lang.NonNull;
import java.util.Objects;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import com.hrms.entity.Leave;
import com.hrms.service.LeaveService;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveController {
    @Autowired
    private LeaveService leaveService;

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
<<<<<<< HEAD
    public ResponseEntity<Leave> getLeaveById(@PathVariable @NonNull Long id) {
        return leaveService.getLeaveById(Objects.requireNonNull(id))
=======
    public ResponseEntity<Leave> getLeaveById(@PathVariable Long id) {
        return leaveService.getLeaveById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
<<<<<<< HEAD
    public ResponseEntity<List<Leave>> getLeavesByEmployeeId(@PathVariable @NonNull Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployeeId(Objects.requireNonNull(employeeId)));
=======
    public ResponseEntity<List<Leave>> getLeavesByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployeeId(employeeId));
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Leave>> getPendingLeaves() {
        return ResponseEntity.ok(leaveService.getPendingLeaves());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createLeave(@RequestBody Leave leave) {
        Map<String, Object> response = new HashMap<>();
        try {
            Leave created = leaveService.createLeave(leave);
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
<<<<<<< HEAD
            @PathVariable @NonNull Long id, @RequestBody Map<String, Long> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long approvedBy = request.get("approvedBy");
            Leave approved = leaveService.approveLeave(Objects.requireNonNull(id), approvedBy);
=======
            @PathVariable Long id, @RequestBody Map<String, Long> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long approvedBy = request.get("approvedBy");
            Leave approved = leaveService.approveLeave(id, approvedBy);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
            @PathVariable @NonNull Long id, @RequestBody Map<String, Object> request) {
=======
            @PathVariable Long id, @RequestBody Map<String, Object> request) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        Map<String, Object> response = new HashMap<>();
        try {
            Long approvedBy = Long.valueOf(request.get("approvedBy").toString());
            String rejectionReason = request.get("rejectionReason").toString();
<<<<<<< HEAD
            Leave rejected = leaveService.rejectLeave(Objects.requireNonNull(id), approvedBy, rejectionReason);
=======
            Leave rejected = leaveService.rejectLeave(id, approvedBy, rejectionReason);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    public ResponseEntity<Leave> updateLeaveStatus(@PathVariable @NonNull Long id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(leaveService.updateLeaveStatus(Objects.requireNonNull(id), status));
    }
}
=======
    public ResponseEntity<Leave> updateLeaveStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(leaveService.updateLeaveStatus(id, status));
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
