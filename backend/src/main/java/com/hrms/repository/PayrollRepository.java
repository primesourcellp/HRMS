package com.hrms.repository;

import com.hrms.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByEmployeeId(Long employeeId);
    List<Payroll> findByMonth(String month);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Payroll p WHERE p.employeeId = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
    
    // Find payrolls by employee, month, and year (for duplicate detection)
    List<Payroll> findByEmployeeIdAndMonthAndYear(Long employeeId, String month, Integer year);
    
    // Find payrolls by date range
    @Query("SELECT p FROM Payroll p WHERE p.startDate BETWEEN :startDate AND :endDate ORDER BY p.startDate DESC")
    List<Payroll> findByStartDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Find payrolls by employee and date range
    @Query("SELECT p FROM Payroll p WHERE p.employeeId = :employeeId AND p.startDate BETWEEN :startDate AND :endDate ORDER BY p.startDate DESC")
    List<Payroll> findByEmployeeIdAndStartDateBetween(@Param("employeeId") Long employeeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

