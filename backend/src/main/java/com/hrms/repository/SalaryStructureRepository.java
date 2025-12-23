package com.hrms.repository;

import com.hrms.entity.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {
    List<SalaryStructure> findByEmployeeId(Long employeeId);
    Optional<SalaryStructure> findByEmployeeIdAndActiveTrue(Long employeeId);
    List<SalaryStructure> findByEmployeeIdAndEffectiveFromLessThanEqualAndEffectiveToGreaterThanEqual(
        Long employeeId, LocalDate date1, LocalDate date2);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM SalaryStructure s WHERE s.employeeId = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}

