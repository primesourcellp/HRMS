package com.hrms.controller;

import com.hrms.entity.SalaryStructure;
import com.hrms.entity.User;
import com.hrms.repository.UserRepository;
import com.hrms.service.AuditLogService;
import com.hrms.service.SalaryStructureService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/salary-structures")
@CrossOrigin(origins = "http://localhost:3000")
public class SalaryStructureController {

    @Autowired
    private SalaryStructureService salaryStructureService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<SalaryStructure>> getAllSalaryStructures() {
        try {
            return ResponseEntity.ok(salaryStructureService.getAllSalaryStructures());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryStructure> getSalaryStructureById(@PathVariable Long id) {
        return salaryStructureService.getSalaryStructureById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<SalaryStructure> getCurrentSalaryStructure(@PathVariable Long employeeId) {
        return salaryStructureService.getCurrentSalaryStructure(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<List<SalaryStructure>> getSalaryHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(salaryStructureService.getEmployeeSalaryHistory(employeeId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSalaryStructure(@RequestBody SalaryStructure salaryStructure, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            SalaryStructure created = salaryStructureService.createSalaryStructure(salaryStructure);
            
            // Log audit event
            Long userId = getCurrentUserId(request);
            if (userId != null && created != null) {
                User employee = userRepository.findById(created.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                auditLogService.logSalaryStructureEvent(
                    created.getId(),
                    created.getEmployeeId(),
                    employeeName,
                    "CREATE",
                    userId,
                    null,
                    created,
                    String.format("Created salary structure for %s", employeeName),
                    request
                );
            }
            
            response.put("success", true);
            response.put("message", "Salary structure created successfully");
            response.put("salaryStructure", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSalaryStructure(
            @PathVariable Long id, @RequestBody SalaryStructure salaryStructure, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Get old salary structure before update
            Optional<SalaryStructure> oldSalaryStructureOpt = salaryStructureService.getSalaryStructureById(id);
            SalaryStructure oldSalaryStructure = oldSalaryStructureOpt.orElse(null);
            
            SalaryStructure updated = salaryStructureService.updateSalaryStructure(id, salaryStructure);
            
            // Log audit event
            Long userId = getCurrentUserId(request);
            if (userId != null && updated != null) {
                User employee = userRepository.findById(updated.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                auditLogService.logSalaryStructureEvent(
                    updated.getId(),
                    updated.getEmployeeId(),
                    employeeName,
                    "UPDATE",
                    userId,
                    oldSalaryStructure,
                    updated,
                    String.format("Updated salary structure for %s", employeeName),
                    request
                );
            }
            
            response.put("success", true);
            response.put("message", "Salary structure updated successfully");
            response.put("salaryStructure", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSalaryStructure(@PathVariable Long id, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Get salary structure before deletion for audit log
            Optional<SalaryStructure> salaryStructureOpt = salaryStructureService.getSalaryStructureById(id);
            SalaryStructure salaryStructure = salaryStructureOpt.orElse(null);
            
            salaryStructureService.deleteSalaryStructure(id);
            
            // Log audit event
            Long userId = getCurrentUserId(request);
            if (userId != null && salaryStructure != null) {
                User employee = userRepository.findById(salaryStructure.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                auditLogService.logSalaryStructureEvent(
                    salaryStructure.getId(),
                    salaryStructure.getEmployeeId(),
                    employeeName,
                    "DELETE",
                    userId,
                    salaryStructure,
                    null,
                    String.format("Deleted salary structure for %s", employeeName),
                    request
                );
            }
            
            response.put("success", true);
            response.put("message", "Salary structure deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
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

