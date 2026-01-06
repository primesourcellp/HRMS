package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.ReviewCycle;
import com.hrms.repository.ReviewCycleRepository;

@Service
public class ReviewCycleService {
    @Autowired
    private ReviewCycleRepository reviewCycleRepository;

    public List<ReviewCycle> getAllCycles() {
        return reviewCycleRepository.findAll();
    }

    public ReviewCycle getCycleById(Long id) {
        return reviewCycleRepository.findById(id).orElse(null);
    }

    public ReviewCycle createCycle(ReviewCycle cycle) {
        return reviewCycleRepository.save(cycle);
    }

    public ReviewCycle updateCycle(Long id, ReviewCycle cycle) {
        return reviewCycleRepository.findById(id).map(existing -> {
            existing.setName(cycle.getName());
            existing.setStartDate(cycle.getStartDate());
            existing.setEndDate(cycle.getEndDate());
            existing.setActive(cycle.getActive());
            return reviewCycleRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Review cycle not found"));
    }

    public void deleteCycle(Long id) {
        reviewCycleRepository.deleteById(id);
    }
}
