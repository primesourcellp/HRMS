package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.HRTicket;
import com.hrms.entity.User;
import com.hrms.repository.UserRepository;
import com.hrms.repository.AuditLogRepository;
import com.hrms.service.HRTicketService;
import com.hrms.service.NotificationService;
import com.hrms.service.AuditLogService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "http://localhost:3000")
public class HRTicketController {

    @Autowired
    private HRTicketService ticketService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private Long getCurrentUserId(HttpServletRequest request) {
        Object userIdObj = request.getAttribute("userId");
        if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        } else if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<HRTicket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<HRTicket>> getEmployeeTickets(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ticketService.getEmployeeTickets(employeeId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<HRTicket>> getTicketsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ticketService.getTicketsByStatus(status));
    }

    @GetMapping("/assigned/{assignedTo}")
    public ResponseEntity<List<HRTicket>> getAssignedTickets(@PathVariable Long assignedTo) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(assignedTo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HRTicket> getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTicket(@RequestBody HRTicket ticket, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            HRTicket created = ticketService.createTicket(ticket);
            
            // Log audit event
            Long userId = getCurrentUserId(request);
            if (userId != null) {
                User employee = userRepository.findById(created.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                Map<String, Object> ticketData = new HashMap<>();
                ticketData.put("subject", created.getSubject());
                ticketData.put("type", created.getTicketType());
                ticketData.put("priority", created.getPriority());
                ticketData.put("status", created.getStatus());
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent(
                    "HR_TICKET",
                    created.getId(),
                    "CREATE_TICKET",
                    userId,
                    null, // oldValue
                    ticketData, // newValue
                    "Created HR ticket: " + created.getSubject() + " for employee: " + employeeName,
                    request
                );
                // Set employee information
                if (auditLog != null) {
                    auditLog.setEmployeeId(created.getEmployeeId());
                    auditLog.setEmployeeName(employeeName);
                    auditLogRepository.save(auditLog);
                }
            }
            
            // Send notification to HR_ADMIN if employee is in their team
            try {
                User employee = userRepository.findById(created.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                notificationService.notifyHRTicketCreated(
                    created.getEmployeeId(),
                    created.getId(),
                    employeeName,
                    created.getSubject()
                );
            } catch (Exception e) {
                // Log but don't fail the request if notification fails
                System.err.println("Failed to send HR ticket notification: " + e.getMessage());
            }
            
            response.put("success", true);
            response.put("message", "Ticket created successfully");
            response.put("ticket", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTicket(@PathVariable Long id, @RequestBody HRTicket ticket, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long currentUserId = getCurrentUserId(request);
            
            // If status is being changed to RESOLVED or CLOSED, and assignedTo is not set or is being changed,
            // set assignedTo to the current user (the one resolving it)
            if (ticket.getStatus() != null && 
                ("RESOLVED".equals(ticket.getStatus()) || "CLOSED".equals(ticket.getStatus())) &&
                currentUserId != null) {
                // If assignedTo is null or empty, set it to current user
                if (ticket.getAssignedTo() == null) {
                    ticket.setAssignedTo(currentUserId);
                }
            }
            
            HRTicket updated = ticketService.updateTicket(id, ticket);
            
            // Log audit event
            if (currentUserId != null) {
                User employee = userRepository.findById(updated.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                String action = "UPDATE_TICKET";
                if ("RESOLVED".equals(updated.getStatus())) {
                    action = "RESOLVE_TICKET";
                } else if ("CLOSED".equals(updated.getStatus())) {
                    action = "CLOSE_TICKET";
                }
                Map<String, Object> ticketData = new HashMap<>();
                ticketData.put("subject", updated.getSubject());
                ticketData.put("status", updated.getStatus());
                ticketData.put("priority", updated.getPriority());
                ticketData.put("employeeId", updated.getEmployeeId());
                ticketData.put("employeeName", employeeName);
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent(
                    "HR_TICKET",
                    updated.getId(),
                    action,
                    currentUserId,
                    null, // oldValue (could be enhanced to track previous state)
                    ticketData, // newValue
                    "Updated HR ticket: " + updated.getSubject() + " (Status: " + updated.getStatus() + ") for employee: " + employeeName,
                    request
                );
                // Set employee information
                if (auditLog != null) {
                    auditLog.setEmployeeId(updated.getEmployeeId());
                    auditLog.setEmployeeName(employeeName);
                    auditLogRepository.save(auditLog);
                }
            }
            
            response.put("success", true);
            response.put("message", "Ticket updated successfully");
            response.put("ticket", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTicket(@PathVariable Long id, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Get ticket info before deletion for audit log
            HRTicket ticket = ticketService.getTicketById(id).orElse(null);
            
            ticketService.deleteTicket(id);
            
            // Log audit event
            Long userId = getCurrentUserId(request);
            if (userId != null && ticket != null) {
                User employee = userRepository.findById(ticket.getEmployeeId()).orElse(null);
                String employeeName = employee != null ? employee.getName() : "Unknown";
                Map<String, Object> ticketData = new HashMap<>();
                ticketData.put("subject", ticket.getSubject() != null ? ticket.getSubject() : "N/A");
                ticketData.put("type", ticket.getTicketType());
                ticketData.put("status", ticket.getStatus());
                ticketData.put("employeeId", ticket.getEmployeeId());
                ticketData.put("employeeName", employeeName);
                com.hrms.entity.AuditLog auditLog = auditLogService.logEvent(
                    "HR_TICKET",
                    id,
                    "DELETE_TICKET",
                    userId,
                    ticketData, // oldValue (ticket being deleted)
                    null, // newValue
                    "Deleted HR ticket: " + (ticket.getSubject() != null ? ticket.getSubject() : "Ticket #" + id) + " for employee: " + employeeName,
                    request
                );
                // Set employee information
                if (auditLog != null) {
                    auditLog.setEmployeeId(ticket.getEmployeeId());
                    auditLog.setEmployeeName(employeeName);
                    auditLogRepository.save(auditLog);
                }
            }
            
            response.put("success", true);
            response.put("message", "Ticket deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

