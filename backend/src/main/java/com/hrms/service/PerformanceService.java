package com.hrms.service;

import com.hrms.entity.Performance;
import com.hrms.repository.PerformanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PerformanceService {
    @Autowired
    private PerformanceRepository performanceRepository;

    public List<Performance> getAllPerformance() {
        return performanceRepository.findAll();
    }

    public Optional<Performance> getPerformanceById(Long id) {
        return performanceRepository.findById(id);
    }

    public Performance createPerformance(Performance performance) {
        return performanceRepository.save(performance);
    }

    public List<Performance> getPerformanceByEmployeeId(Long employeeId) {
        return performanceRepository.findByEmployeeId(employeeId);
    }

    public List<Performance> getTopPerformers(Integer minRating) {
        return performanceRepository.findByRatingGreaterThanEqual(minRating);
    }
}

