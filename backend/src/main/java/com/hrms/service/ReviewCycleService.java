package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
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

    public ReviewCycle getCycleById(@NonNull Long id) {
        return reviewCycleRepository.findById(java.util.Objects.requireNonNull(id)).orElse(null);
    }

    public ReviewCycle createCycle(@NonNull ReviewCycle cycle) {
        return reviewCycleRepository.save(java.util.Objects.requireNonNull(cycle));
    }

    public ReviewCycle updateCycle(@NonNull Long id, ReviewCycle cycle) {
        return reviewCycleRepository.findById(java.util.Objects.requireNonNull(id)).map(existing -> {
            existing.setName(cycle.getName());
            existing.setStartDate(cycle.getStartDate());
            existing.setEndDate(cycle.getEndDate());
            existing.setActive(cycle.getActive());
            return reviewCycleRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Review cycle not found"));
    }

    public void deleteCycle(@NonNull Long id) {
        reviewCycleRepository.deleteById(java.util.Objects.requireNonNull(id));
    }
}
