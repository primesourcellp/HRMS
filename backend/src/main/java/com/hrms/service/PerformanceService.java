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
}
