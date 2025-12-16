package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import com.hrms.entity.Performance;
import com.hrms.repository.PerformanceRepository;

@Service
public class PerformanceService {
    @Autowired
    private PerformanceRepository performanceRepository;

    public List<Performance> getAllPerformance() {
        return performanceRepository.findAll();
    }

<<<<<<< HEAD
    public Optional<Performance> getPerformanceById(@NonNull Long id) {
        return performanceRepository.findById(java.util.Objects.requireNonNull(id));
    }

    public Performance createPerformance(Performance performance) {
        return performanceRepository.save(java.util.Objects.requireNonNull(performance));
    }

    public List<Performance> getPerformanceByEmployeeId(@NonNull Long employeeId) {
        return performanceRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
=======
    public Optional<Performance> getPerformanceById(Long id) {
        return performanceRepository.findById(id);
    }

    public Performance createPerformance(Performance performance) {
        return performanceRepository.save(performance);
    }

    public List<Performance> getPerformanceByEmployeeId(Long employeeId) {
        return performanceRepository.findByEmployeeId(employeeId);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public List<Performance> getTopPerformers(Integer minRating) {
        return performanceRepository.findByRatingGreaterThanEqual(minRating);
    }
<<<<<<< HEAD
}
=======

    public Performance updatePerformance(Long id, Performance performanceDetails) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance review not found"));

        if (performanceDetails.getReviewDate() != null) {
            performance.setReviewDate(performanceDetails.getReviewDate());
        }
        if (performanceDetails.getPeriod() != null) {
            performance.setPeriod(performanceDetails.getPeriod());
        }
        if (performanceDetails.getRating() != null) {
            performance.setRating(performanceDetails.getRating());
        }
        if (performanceDetails.getGoals() != null) {
            performance.setGoals(performanceDetails.getGoals());
        }
        if (performanceDetails.getAchievements() != null) {
            performance.setAchievements(performanceDetails.getAchievements());
        }
        if (performanceDetails.getFeedback() != null) {
            performance.setFeedback(performanceDetails.getFeedback());
        }
        if (performanceDetails.getAreasForImprovement() != null) {
            performance.setAreasForImprovement(performanceDetails.getAreasForImprovement());
        }

        return performanceRepository.save(performance);
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
