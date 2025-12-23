package com.hrms.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.entity.Leave;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {
    List<Leave> findByStatus(String status);
    List<Leave> findByEmployeeId(Long employeeId);
    List<Leave> findByEmployeeIdAndStatus(Long employeeId, String status);
    List<Leave> findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(Long employeeId, LocalDate date1, LocalDate date2);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Leave l WHERE l.employeeId = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}

