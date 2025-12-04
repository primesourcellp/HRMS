package com.hrms.repository;

import com.hrms.entity.Leave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {
    List<Leave> findByStatus(String status);
    List<Leave> findByEmployeeId(Long employeeId);
}

