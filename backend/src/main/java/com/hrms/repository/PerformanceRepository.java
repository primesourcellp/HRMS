package com.hrms.repository;

import com.hrms.entity.Performance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {
    List<Performance> findByEmployeeId(Long employeeId);
    List<Performance> findByRatingGreaterThanEqual(Integer rating);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Performance p WHERE p.employeeId = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}

