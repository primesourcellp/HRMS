package com.hrms.controller;

import com.hrms.entity.Shift;
import com.hrms.entity.User;
import com.hrms.service.ShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shifts")
@CrossOrigin(origins = "http://localhost:3000")
public class ShiftController {

    @Autowired
    private ShiftService shiftService;

    @GetMapping
    public ResponseEntity<List<Shift>> getAllShifts() {
        return ResponseEntity.ok(shiftService.getAllShifts());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Shift>> getActiveShifts() {
        return ResponseEntity.ok(shiftService.getActiveShifts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shift> getShiftById(@PathVariable Long id) {
        return shiftService.getShiftById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createShift(@RequestBody Shift shift) {
        Map<String, Object> response = new HashMap<>();
        try {
            Shift created = shiftService.createShift(shift);
            response.put("success", true);
            response.put("message", "Shift created successfully");
            response.put("shift", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateShift(@PathVariable Long id, @RequestBody Shift shift) {
        Map<String, Object> response = new HashMap<>();
        try {
            Shift updated = shiftService.updateShift(id, shift);
            response.put("success", true);
            response.put("message", "Shift updated successfully");
            response.put("shift", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteShift(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            shiftService.deleteShift(id);
            response.put("success", true);
            response.put("message", "Shift deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @GetMapping("/{id}/employees")
    public ResponseEntity<List<User>> getEmployeesByShift(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(shiftService.getEmployeesByShiftId(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @PostMapping("/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignEmployeeToShift(
            @PathVariable Long id, @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Object employeeIdObj = request.get("employeeId");
            Long employeeId = null;
            
            // Handle both Long and Integer types
            if (employeeIdObj instanceof Long) {
                employeeId = (Long) employeeIdObj;
            } else if (employeeIdObj instanceof Integer) {
                employeeId = ((Integer) employeeIdObj).longValue();
            } else if (employeeIdObj instanceof Number) {
                employeeId = ((Number) employeeIdObj).longValue();
            } else if (employeeIdObj != null) {
                employeeId = Long.parseLong(employeeIdObj.toString());
            }
            
            if (employeeId == null) {
                response.put("success", false);
                response.put("message", "Employee ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Extract dates if provided
            String startDate = request.get("startDate") != null ? request.get("startDate").toString() : null;
            String endDate = request.get("endDate") != null ? request.get("endDate").toString() : null;
            
            shiftService.assignEmployeeToShift(employeeId, id, startDate, endDate);
            response.put("success", true);
            response.put("message", "Employee assigned to shift successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{id}/assignment")
    public ResponseEntity<Map<String, Object>> updateEmployeeAssignment(
            @PathVariable Long id, @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Object employeeIdObj = request.get("employeeId");
            Long employeeId = null;
            
            // Handle both Long and Integer types
            if (employeeIdObj instanceof Long) {
                employeeId = (Long) employeeIdObj;
            } else if (employeeIdObj instanceof Integer) {
                employeeId = ((Integer) employeeIdObj).longValue();
            } else if (employeeIdObj instanceof Number) {
                employeeId = ((Number) employeeIdObj).longValue();
            } else if (employeeIdObj != null) {
                employeeId = Long.parseLong(employeeIdObj.toString());
            }
            
            if (employeeId == null) {
                response.put("success", false);
                response.put("message", "Employee ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Extract dates if provided
            String startDate = request.get("startDate") != null ? request.get("startDate").toString() : null;
            String endDate = request.get("endDate") != null ? request.get("endDate").toString() : null;
            
            shiftService.updateEmployeeAssignment(employeeId, id, startDate, endDate);
            response.put("success", true);
            response.put("message", "Employee assignment updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PostMapping("/{id}/unassign")
    public ResponseEntity<Map<String, Object>> unassignEmployeeFromShift(
            @PathVariable Long id, @RequestBody Map<String, Long> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = request.get("employeeId");
            if (employeeId == null) {
                response.put("success", false);
                response.put("message", "Employee ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            shiftService.unassignEmployeeFromShift(employeeId);
            response.put("success", true);
            response.put("message", "Employee unassigned from shift successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getShiftByEmployeeId(@PathVariable Long employeeId) {
        try {
            Map<String, Object> shiftWithDates = shiftService.getShiftWithAssignmentDatesByEmployeeId(employeeId);
            if (shiftWithDates.containsKey("id")) {
                return ResponseEntity.ok(shiftWithDates);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No shift assigned to this employee");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching shift: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

