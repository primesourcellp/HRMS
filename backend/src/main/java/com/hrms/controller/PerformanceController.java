package com.hrms.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePerformance(@PathVariable Long id) {
        try {
            performanceService.deletePerformance(id);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "Performance review deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete performance review");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getPerformanceDashboard() {
        try {
            Map<String, Object> dashboard = new java.util.HashMap<>();

            // Overall statistics
            List<Performance> allPerformances = performanceService.getAllPerformance();
            double averageRating = allPerformances.stream()
                .mapToDouble(p -> p.getRating() != null ? p.getRating() : 0)
                .average()
                .orElse(0.0);

            long topPerformers = allPerformances.stream()
                .filter(p -> p.getRating() != null && p.getRating() >= 4)
                .count();

            long needsImprovement = allPerformances.stream()
                .filter(p -> p.getRating() != null && p.getRating() < 3)
                .count();

            // Employee statistics
            long totalEmployees = performanceService.getAllEmployees().size();

            dashboard.put("performanceStats", Map.of(
                "totalReviews", allPerformances.size(),
                "averageRating", Math.round(averageRating * 10.0) / 10.0,
                "topPerformers", topPerformers,
                "needsImprovement", needsImprovement
            ));
                        
            dashboard.put("employeeStats", Map.of(
                "totalEmployees", totalEmployees
            ));

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", "Failed to fetch dashboard data");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/goal-progress/{employeeId}")
    public ResponseEntity<Map<String, Object>> getGoalProgressAnalytics(@PathVariable Long employeeId) {
        try {
            Map<String, Object> analytics = performanceService.getGoalProgressAnalytics(employeeId);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", "Failed to fetch goal progress analytics");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
