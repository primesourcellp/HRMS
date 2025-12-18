package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import com.hrms.entity.Performance;
import com.hrms.repository.PerformanceRepository;

@Service
public class PerformanceService {
    @Autowired
    private PerformanceRepository performanceRepository;

    public List<Performance> getAllPerformance() {
        return performanceRepository.findAll();
    }

    public Optional<Performance> getPerformanceById(@NonNull Long id) {
        return performanceRepository.findById(java.util.Objects.requireNonNull(id));
    }

    public Performance createPerformance(Performance performance) {
        return performanceRepository.save(java.util.Objects.requireNonNull(performance));
    }

    public List<Performance> getPerformanceByEmployeeId(@NonNull Long employeeId) {
        return performanceRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
    }

    public List<Performance> getTopPerformers(Integer minRating) {
        return performanceRepository.findByRatingGreaterThanEqual(minRating);
    }

    @org.springframework.transaction.annotation.Transactional
    public Performance updatePerformance(@NonNull Long id, Performance performanceDetails) {
        Performance performance = performanceRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Performance not found with id: " + id));

        if (performanceDetails.getEmployeeId() != null) {
            performance.setEmployeeId(performanceDetails.getEmployeeId());
        }
        if (performanceDetails.getReviewDate() != null) {
            performance.setReviewDate(performanceDetails.getReviewDate());
        }
        if (performanceDetails.getPeriod() != null) {
            performance.setPeriod(performanceDetails.getPeriod());
        }
        if (performanceDetails.getRating() != null) {
            performance.setRating(performanceDetails.getRating());
        }
        if (performanceDetails.getFeedback() != null) {
            performance.setFeedback(performanceDetails.getFeedback());
        }
        if (performanceDetails.getGoals() != null) {
            performance.setGoals(performanceDetails.getGoals());
        }
        if (performanceDetails.getAchievements() != null) {
            performance.setAchievements(performanceDetails.getAchievements());
        }
        if (performanceDetails.getAreasForImprovement() != null) {
            performance.setAreasForImprovement(performanceDetails.getAreasForImprovement());
        }

        return performanceRepository.save(performance);
    }
}
