package com.hrms.controller;

import com.hrms.entity.AuditLog;
import com.hrms.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get all audit logs with optional filters
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "50") int size) {
        
        try {
            List<AuditLog> logs;
            
            // If date range is provided, use it
            if (startDate != null && endDate != null) {
                if (entityType != null && employeeId != null) {
                    logs = auditLogService.getAuditLogsByEntityTypesAndDateRange(
                        List.of(entityType), startDate, endDate
                    ).stream()
                    .filter(log -> log.getEmployeeId() != null && log.getEmployeeId().equals(employeeId))
                    .toList();
                } else if (entityType != null) {
                    logs = auditLogService.getAuditLogsByEntityTypesAndDateRange(
                        List.of(entityType), startDate, endDate
                    );
                } else {
                    logs = auditLogService.getAuditLogsByDateRange(startDate, endDate);
                }
            } else if (entityType != null && entityId != null) {
                logs = auditLogService.getAuditLogsByEntity(entityType, entityId);
            } else if (employeeId != null) {
                logs = auditLogService.getAuditLogsByEmployee(employeeId);
            } else {
                // Get all logs (you might want to add pagination here)
                logs = auditLogService.getAllAuditLogs();
            }
            
            // Apply additional filters
            if (userId != null) {
                logs = logs.stream()
                    .filter(log -> log.getUserId() != null && log.getUserId().equals(userId))
                    .toList();
            }
            
            if (action != null) {
                logs = logs.stream()
                    .filter(log -> log.getAction() != null && log.getAction().equalsIgnoreCase(action))
                    .toList();
            }
            
            // Apply pagination
            int total = logs.size();
            int start = page * size;
            int end = Math.min(start + size, total);
            List<AuditLog> paginatedLogs = start < total ? logs.subList(start, end) : List.of();
            
            Map<String, Object> response = new HashMap<>();
            response.put("logs", paginatedLogs);
            response.put("total", total);
            response.put("page", page);
            response.put("size", size);
            response.put("totalPages", (int) Math.ceil((double) total / size));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to retrieve audit logs: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get audit logs for a specific entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            List<AuditLog> logs = auditLogService.getAuditLogsByEntity(entityType, entityId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get audit logs for a specific employee
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEmployee(@PathVariable Long employeeId) {
        try {
            List<AuditLog> logs = auditLogService.getAuditLogsByEmployee(employeeId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get audit logs by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLog>> getAuditLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<AuditLog> logs = auditLogService.getAuditLogsByDateRange(startDate, endDate);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Export audit logs (for PDF/Excel generation)
     */
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "all") String format) {
        try {
            List<AuditLog> logs;
            
            if (startDate != null && endDate != null) {
                if (entityType != null && employeeId != null) {
                    logs = auditLogService.getAuditLogsByEntityTypesAndDateRange(
                        List.of(entityType), startDate, endDate
                    ).stream()
                    .filter(log -> log.getEmployeeId() != null && log.getEmployeeId().equals(employeeId))
                    .toList();
                } else if (entityType != null) {
                    logs = auditLogService.getAuditLogsByEntityTypesAndDateRange(
                        List.of(entityType), startDate, endDate
                    );
                } else {
                    logs = auditLogService.getAuditLogsByDateRange(startDate, endDate);
                }
            } else if (employeeId != null) {
                logs = auditLogService.getAuditLogsByEmployee(employeeId);
            } else {
                logs = auditLogService.getAllAuditLogs();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("logs", logs);
            response.put("format", format);
            response.put("exportedAt", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to export audit logs: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
