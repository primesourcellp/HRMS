package com.hrms.controller;

import com.hrms.entity.LeaveType;
import com.hrms.service.LeaveTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leave-types")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveTypeController {

    @Autowired
    private LeaveTypeService leaveTypeService;

    @GetMapping
    public ResponseEntity<List<LeaveType>> getAllLeaveTypes() {
        return ResponseEntity.ok(leaveTypeService.getAllLeaveTypes());
    }

    @GetMapping("/active")
    public ResponseEntity<List<LeaveType>> getActiveLeaveTypes() {
        return ResponseEntity.ok(leaveTypeService.getActiveLeaveTypes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveType> getLeaveTypeById(@PathVariable Long id) {
        return leaveTypeService.getLeaveTypeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createLeaveType(@RequestBody LeaveType leaveType) {
        Map<String, Object> response = new HashMap<>();
        try {
            LeaveType created = leaveTypeService.createLeaveType(leaveType);
            response.put("success", true);
            response.put("message", "Leave type created successfully");
            response.put("leaveType", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateLeaveType(@PathVariable Long id, @RequestBody LeaveType leaveType) {
        Map<String, Object> response = new HashMap<>();
        try {
            LeaveType updated = leaveTypeService.updateLeaveType(id, leaveType);
            response.put("success", true);
            response.put("message", "Leave type updated successfully");
            response.put("leaveType", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<Map<String, Object>> updateLeaveTypeActive(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!payload.containsKey("active")) {
                response.put("success", false);
                response.put("message", "Missing 'active' field in request body");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            Boolean active = Boolean.valueOf(String.valueOf(payload.get("active")));
            LeaveType updated = leaveTypeService.updateActiveStatus(id, active);
            response.put("success", true);
            response.put("message", "Leave type status updated successfully");
            response.put("leaveType", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteLeaveType(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            leaveTypeService.deleteLeaveType(id);
            response.put("success", true);
            response.put("message", "Leave type deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

