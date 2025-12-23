package com.hrms.repository;

import com.hrms.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    List<LeaveBalance> findByEmployeeId(Long employeeId);
    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);
    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndYear(Long employeeId, Long leaveTypeId, Integer year);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM LeaveBalance lb WHERE lb.employeeId = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}

