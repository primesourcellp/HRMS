package com.hrms.controller;

import com.hrms.entity.HRTicket;
import com.hrms.service.HRTicketService;
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
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "http://localhost:3000")
public class HRTicketController {

    @Autowired
    private HRTicketService ticketService;

    @GetMapping
    public ResponseEntity<List<HRTicket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/employee/{employeeId}")
<<<<<<< HEAD
    public ResponseEntity<List<HRTicket>> getEmployeeTickets(@PathVariable @NonNull Long employeeId) {
        return ResponseEntity.ok(ticketService.getEmployeeTickets(Objects.requireNonNull(employeeId)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<HRTicket>> getTicketsByStatus(@PathVariable @NonNull String status) {
        return ResponseEntity.ok(ticketService.getTicketsByStatus(Objects.requireNonNull(status)));
    }

    @GetMapping("/assigned/{assignedTo}")
    public ResponseEntity<List<HRTicket>> getAssignedTickets(@PathVariable @NonNull Long assignedTo) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(Objects.requireNonNull(assignedTo)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HRTicket> getTicketById(@PathVariable @NonNull Long id) {
        return ticketService.getTicketById(Objects.requireNonNull(id))
=======
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
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTicket(@RequestBody HRTicket ticket) {
        Map<String, Object> response = new HashMap<>();
        try {
<<<<<<< HEAD
            HRTicket created = ticketService.createTicket(Objects.requireNonNull(ticket));
=======
            HRTicket created = ticketService.createTicket(ticket);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> updateTicket(@PathVariable @NonNull Long id, @RequestBody HRTicket ticket) {
        Map<String, Object> response = new HashMap<>();
        try {
            HRTicket updated = ticketService.updateTicket(Objects.requireNonNull(id), Objects.requireNonNull(ticket));
=======
    public ResponseEntity<Map<String, Object>> updateTicket(@PathVariable Long id, @RequestBody HRTicket ticket) {
        Map<String, Object> response = new HashMap<>();
        try {
            HRTicket updated = ticketService.updateTicket(id, ticket);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> deleteTicket(@PathVariable @NonNull Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            ticketService.deleteTicket(Objects.requireNonNull(id));
=======
    public ResponseEntity<Map<String, Object>> deleteTicket(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            ticketService.deleteTicket(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
