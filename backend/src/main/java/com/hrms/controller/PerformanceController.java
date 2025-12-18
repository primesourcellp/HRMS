package com.hrms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.Performance;
import com.hrms.service.PerformanceService;

@RestController
@RequestMapping("/api/performance")
@CrossOrigin(origins = "http://localhost:3000")
public class PerformanceController {
    @Autowired
    private PerformanceService performanceService;

    @GetMapping
    public ResponseEntity<?> getAllPerformance() {
        try {
            return ResponseEntity.ok(performanceService.getAllPerformance());
        } catch (Exception e) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", "Failed to fetch performance data");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Performance> getPerformanceById(@PathVariable Long id) {
        return performanceService.getPerformanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Performance>> getPerformanceByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(performanceService.getPerformanceByEmployeeId(employeeId));
    }

    @GetMapping("/top/{minRating}")
    public ResponseEntity<List<Performance>> getTopPerformers(@PathVariable Integer minRating) {
        return ResponseEntity.ok(performanceService.getTopPerformers(minRating));
    }

    @PostMapping
    public ResponseEntity<Performance> createPerformance(@RequestBody Performance performance) {
        return ResponseEntity.status(HttpStatus.CREATED).body(performanceService.createPerformance(performance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePerformance(@PathVariable Long id, @RequestBody Performance performance) {
        try {
            Performance updated = performanceService.updatePerformance(id, performance);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", "Failed to update performance review");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

