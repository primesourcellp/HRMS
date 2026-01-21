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
import com.hrms.service.HRTicketService;
import com.hrms.service.NotificationService;

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
    public ResponseEntity<Map<String, Object>> createTicket(@RequestBody HRTicket ticket) {
        Map<String, Object> response = new HashMap<>();
        try {
            HRTicket created = ticketService.createTicket(ticket);
            
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
    public ResponseEntity<Map<String, Object>> deleteTicket(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            ticketService.deleteTicket(id);
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

