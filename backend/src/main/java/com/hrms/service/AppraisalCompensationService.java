package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.AppraisalCompensation;
import com.hrms.repository.AppraisalCompensationRepository;

@Service
public class AppraisalCompensationService {
    @Autowired
    private AppraisalCompensationRepository repo;

    public List<AppraisalCompensation> getAll() {
        return repo.findAll();
    }

    public List<AppraisalCompensation> getByPerformance(Long performanceId) {
        return repo.findByPerformanceIdOrderByCreatedAtDesc(performanceId);
    }

    public List<AppraisalCompensation> getByEmployee(Long employeeId) {
        return repo.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public AppraisalCompensation create(AppraisalCompensation c) {
        return repo.save(c);
    }

    public AppraisalCompensation update(Long id, AppraisalCompensation c) {
        c.setId(id);
        return repo.save(c);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
