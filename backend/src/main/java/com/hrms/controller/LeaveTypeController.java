package com.hrms.controller;

import com.hrms.entity.LeaveType;
import com.hrms.service.LeaveTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
import java.util.Objects;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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
<<<<<<< HEAD
    public ResponseEntity<LeaveType> getLeaveTypeById(@PathVariable @NonNull Long id) {
        return leaveTypeService.getLeaveTypeById(Objects.requireNonNull(id))
=======
    public ResponseEntity<LeaveType> getLeaveTypeById(@PathVariable Long id) {
        return leaveTypeService.getLeaveTypeById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> updateLeaveType(@PathVariable @NonNull Long id, @RequestBody LeaveType leaveType) {
        Map<String, Object> response = new HashMap<>();
        try {
            LeaveType updated = leaveTypeService.updateLeaveType(Objects.requireNonNull(id), leaveType);
=======
    public ResponseEntity<Map<String, Object>> updateLeaveType(@PathVariable Long id, @RequestBody LeaveType leaveType) {
        Map<String, Object> response = new HashMap<>();
        try {
            LeaveType updated = leaveTypeService.updateLeaveType(id, leaveType);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> deleteLeaveType(@PathVariable @NonNull Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            leaveTypeService.deleteLeaveType(Objects.requireNonNull(id));
=======
    public ResponseEntity<Map<String, Object>> deleteLeaveType(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            leaveTypeService.deleteLeaveType(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
