package com.hrms.service;

import com.hrms.entity.HRTicket;
import com.hrms.repository.HRTicketRepository;
import com.hrms.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class HRTicketService {

    @Autowired
    private HRTicketRepository ticketRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public HRTicket createTicket(HRTicket ticket) {
        employeeRepository.findById(java.util.Objects.requireNonNull(ticket.getEmployeeId()))
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setStatus("OPEN");
        if (ticket.getPriority() == null) {
            ticket.setPriority("MEDIUM");
        }

        return ticketRepository.save(java.util.Objects.requireNonNull(ticket));
    }

    public List<HRTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<HRTicket> getEmployeeTickets(@NonNull Long employeeId) {
        return ticketRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
    }

    public List<HRTicket> getTicketsByStatus(String status) {
        return ticketRepository.findByStatus(status);
    }

    public List<HRTicket> getAssignedTickets(@NonNull Long assignedTo) {
        return ticketRepository.findByAssignedTo(java.util.Objects.requireNonNull(assignedTo));
    }

    public HRTicket updateTicket(@NonNull Long id, HRTicket ticketDetails) {
        HRTicket ticket = ticketRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setSubject(ticketDetails.getSubject());
        ticket.setDescription(ticketDetails.getDescription());
        ticket.setStatus(ticketDetails.getStatus());
        ticket.setPriority(ticketDetails.getPriority());
        ticket.setAssignedTo(ticketDetails.getAssignedTo());
        ticket.setUpdatedAt(LocalDateTime.now());

        if ("RESOLVED".equals(ticketDetails.getStatus()) || "CLOSED".equals(ticketDetails.getStatus())) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolution(ticketDetails.getResolution());
        }

        return ticketRepository.save(java.util.Objects.requireNonNull(ticket));
    }

    public void deleteTicket(@NonNull Long id) {
        ticketRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public Optional<HRTicket> getTicketById(@NonNull Long id) {
        return ticketRepository.findById(java.util.Objects.requireNonNull(id));
    }
}
