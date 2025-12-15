package com.hrms.repository;

import com.hrms.entity.HRTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HRTicketRepository extends JpaRepository<HRTicket, Long> {
    List<HRTicket> findByEmployeeId(Long employeeId);
    List<HRTicket> findByStatus(String status);
    List<HRTicket> findByAssignedTo(Long assignedTo);
    List<HRTicket> findByTicketType(String ticketType);
}

