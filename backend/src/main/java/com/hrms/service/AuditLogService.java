package com.hrms.service;

import com.hrms.entity.AuditLog;
import com.hrms.entity.User;
import com.hrms.repository.AuditLogRepository;
import com.hrms.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Log an audit event
     */
    @Transactional
    public AuditLog logEvent(String entityType, Long entityId, String action, Long userId, 
                            Object oldValue, Object newValue, String description, HttpServletRequest request) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            String userName = user != null ? user.getName() : "Unknown";
            String userRole = user != null ? (user.getRole() != null ? user.getRole() : "N/A") : "N/A";
            
            AuditLog auditLog = new AuditLog(entityType, entityId, action, userId, userName, userRole);
            
            // Convert old and new values to JSON
            if (oldValue != null) {
                try {
                    auditLog.setOldValue(objectMapper.writeValueAsString(oldValue));
                } catch (Exception e) {
                    auditLog.setOldValue(oldValue.toString());
                }
            }
            
            if (newValue != null) {
                try {
                    auditLog.setNewValue(objectMapper.writeValueAsString(newValue));
                } catch (Exception e) {
                    auditLog.setNewValue(newValue.toString());
                }
            }
            
            auditLog.setDescription(description);
            
            // Get IP address from request
            if (request != null) {
                String ipAddress = getClientIpAddress(request);
                auditLog.setIpAddress(ipAddress);
            }
            
            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            // Log error but don't fail the transaction
            System.err.println("Error creating audit log: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Log payroll-related events
     */
    @Transactional
    public AuditLog logPayrollEvent(Long payrollId, Long employeeId, String employeeName, 
                                   String action, Long userId, Object oldValue, Object newValue, 
                                   String description, HttpServletRequest request) {
        AuditLog auditLog = logEvent("PAYROLL", payrollId, action, userId, oldValue, newValue, description, request);
        if (auditLog != null) {
            auditLog.setEmployeeId(employeeId);
            auditLog.setEmployeeName(employeeName);
            return auditLogRepository.save(auditLog);
        }
        return null;
    }
    
    /**
     * Log salary structure changes
     */
    @Transactional
    public AuditLog logSalaryStructureEvent(Long salaryStructureId, Long employeeId, String employeeName,
                                           String action, Long userId, Object oldValue, Object newValue,
                                           String description, HttpServletRequest request) {
        AuditLog auditLog = logEvent("SALARY_STRUCTURE", salaryStructureId, action, userId, oldValue, newValue, description, request);
        if (auditLog != null) {
            auditLog.setEmployeeId(employeeId);
            auditLog.setEmployeeName(employeeName);
            return auditLogRepository.save(auditLog);
        }
        return null;
    }
    
    /**
     * Get audit logs for an entity
     */
    public List<AuditLog> getAuditLogsByEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }
    
    /**
     * Get audit logs for an employee
     */
    public List<AuditLog> getAuditLogsByEmployee(Long employeeId) {
        return auditLogRepository.findByEmployeeIdOrderByTimestampDesc(employeeId);
    }
    
    /**
     * Get audit logs by date range
     */
    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate);
    }
    
    /**
     * Get audit logs for specific entity types in date range
     */
    public List<AuditLog> getAuditLogsByEntityTypesAndDateRange(List<String> entityTypes, 
                                                                LocalDateTime startDate, 
                                                                LocalDateTime endDate) {
        return auditLogRepository.findByEntityTypesAndTimestampBetween(entityTypes, startDate, endDate);
    }
    
    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        // Handle multiple IPs (X-Forwarded-For can contain multiple IPs)
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress;
    }
}

