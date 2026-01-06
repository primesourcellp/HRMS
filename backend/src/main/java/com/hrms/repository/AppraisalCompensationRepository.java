package com.hrms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hrms.entity.AppraisalCompensation;

@Repository
public interface AppraisalCompensationRepository extends JpaRepository<AppraisalCompensation, Long> {
    List<AppraisalCompensation> findByPerformanceIdOrderByCreatedAtDesc(Long performanceId);
    List<AppraisalCompensation> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
}
