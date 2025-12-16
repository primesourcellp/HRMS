package com.hrms.controller;

import com.hrms.entity.LeaveType;
import com.hrms.service.LeaveTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;
import java.util.Objects;

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
    public ResponseEntity<LeaveType> getLeaveTypeById(@PathVariable @NonNull Long id) {
        return leaveTypeService.getLeaveTypeById(Objects.requireNonNull(id))
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
    public ResponseEntity<Map<String, Object>> updateLeaveType(@PathVariable @NonNull Long id, @RequestBody LeaveType leaveType) {
        Map<String, Object> response = new HashMap<>();
        try {
            LeaveType updated = leaveTypeService.updateLeaveType(Objects.requireNonNull(id), leaveType);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteLeaveType(@PathVariable @NonNull Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            leaveTypeService.deleteLeaveType(Objects.requireNonNull(id));
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
