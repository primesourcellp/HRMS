package com.hrms.controller;

import com.hrms.entity.ShiftChangeRequest;
import com.hrms.service.ShiftChangeRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shift-change-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class ShiftChangeRequestController {

    @Autowired
    private ShiftChangeRequestService requestService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createRequest(@RequestBody Map<String, Object> requestData) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = Long.parseLong(requestData.get("employeeId").toString());
            Long requestedShiftId = Long.parseLong(requestData.get("requestedShiftId").toString());
            String reason = requestData.get("reason") != null ? requestData.get("reason").toString() : null;
            
            ShiftChangeRequest request = requestService.createRequest(employeeId, requestedShiftId, reason);
            response.put("success", true);
            response.put("message", "Shift change request submitted successfully");
            response.put("request", request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<ShiftChangeRequest>> getRequestsByEmployee(@PathVariable Long employeeId) {
        try {
            List<ShiftChangeRequest> requests = requestService.getRequestsByEmployee(employeeId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<ShiftChangeRequest>> getAllRequests() {
        try {
            List<ShiftChangeRequest> requests = requestService.getAllRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ShiftChangeRequest>> getPendingRequests() {
        try {
            List<ShiftChangeRequest> requests = requestService.getPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftChangeRequest> getRequestById(@PathVariable Long id) {
        return requestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable Long id, @RequestBody Map<String, Object> requestData) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long reviewedBy = Long.parseLong(requestData.get("reviewedBy").toString());
            ShiftChangeRequest request = requestService.approveRequest(id, reviewedBy);
            response.put("success", true);
            response.put("message", "Shift change request approved successfully");
            response.put("request", request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable Long id, @RequestBody Map<String, Object> requestData) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long reviewedBy = Long.parseLong(requestData.get("reviewedBy").toString());
            String rejectionReason = requestData.get("rejectionReason") != null 
                ? requestData.get("rejectionReason").toString() : null;
            
            ShiftChangeRequest request = requestService.rejectRequest(id, reviewedBy, rejectionReason);
            response.put("success", true);
            response.put("message", "Shift change request rejected");
            response.put("request", request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

