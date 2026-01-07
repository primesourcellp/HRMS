package com.hrms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hrms.entity.PromotionHistory;

@Repository
public interface PromotionHistoryRepository extends JpaRepository<PromotionHistory, Long> {
    List<PromotionHistory> findByEmployeeIdOrderByEffectiveDateDesc(Long employeeId);
}
