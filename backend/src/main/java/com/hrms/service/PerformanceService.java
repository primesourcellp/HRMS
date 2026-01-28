package com.hrms.service;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import com.hrms.entity.Performance;
import com.hrms.entity.Leave;
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

    public Performance createPerformance(@NonNull Performance performance) {
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
        if (performanceDetails.getGoalProgress() != null) {
            performance.setGoalProgress(performanceDetails.getGoalProgress());
        }
        if (performanceDetails.getOverallProgress() != null) {
            performance.setOverallProgress(performanceDetails.getOverallProgress());
        }

        // KPI fields
        if (performanceDetails.getKpiConfigId() != null) {
            performance.setKpiConfigId(performanceDetails.getKpiConfigId());
        }
        if (performanceDetails.getKpiResults() != null) {
            performance.setKpiResults(performanceDetails.getKpiResults());
        }

        // Review cycle
        if (performanceDetails.getReviewCycleId() != null) {
            performance.setReviewCycleId(performanceDetails.getReviewCycleId());
        }

        // Self and Manager evaluations
        if (performanceDetails.getSelfEvaluation() != null) {
            performance.setSelfEvaluation(performanceDetails.getSelfEvaluation());
        }
        if (performanceDetails.getManagerEvaluation() != null) {
            performance.setManagerEvaluation(performanceDetails.getManagerEvaluation());
        }

        return performanceRepository.save(java.util.Objects.requireNonNull(performance));
    }

    public void deletePerformance(@NonNull Long id) {
        Performance performance = performanceRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Performance not found with id: " + id));
        performanceRepository.delete(java.util.Objects.requireNonNull(performance));
    }

    public List<Leave> getAllLeaves() {
        // This method should be implemented in LeaveService
        // For now, return empty list to avoid compilation errors
        return new java.util.ArrayList<>();
    }

    public List<Object> getAllEmployees() {
        // This method should be implemented in EmployeeService
        // For now, return empty list to avoid compilation errors
        return new java.util.ArrayList<>();
    }

    public Map<String, Object> getGoalProgressAnalytics(@NonNull Long employeeId) {
        Map<String, Object> analytics = new java.util.HashMap<>();
        
        // Get all performances for employee
        List<Performance> employeePerformances = getPerformanceByEmployeeId(employeeId);
        
        if (employeePerformances.isEmpty()) {
            analytics.put("totalGoals", 0);
            analytics.put("completedGoals", 0);
            analytics.put("inProgressGoals", 0);
            analytics.put("overallProgress", 0);
            analytics.put("goalDistribution", new java.util.ArrayList<>());
            return analytics;
        }
        
        // Parse goals from all performances
        java.util.List<String> allGoals = new java.util.ArrayList<>();
        int completedCount = 0;
        int inProgressCount = 0;
        
        for (Performance performance : employeePerformances) {
            if (performance.getGoals() != null && !performance.getGoals().trim().isEmpty()) {
                String[] goals = performance.getGoals().split("\n");
                for (String goal : goals) {
                    if (!goal.trim().isEmpty()) {
                        allGoals.add(goal.trim());
                    }
                }
            }
            
            // Count from goal progress field if available
            if (performance.getGoalProgress() != null) {
                String[] progressGoals = performance.getGoalProgress().split("\n");
                for (String progressGoal : progressGoals) {
                    java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d+)%|completed\\s+(\\d+)%", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(progressGoal);
                    int percentage = 0;
                    if (matcher.find()) {
                        percentage = Integer.parseInt(matcher.group(1) != null ? matcher.group(1) : matcher.group(2));
                    }
                    
                    if (percentage == 100) {
                        completedCount++;
                    } else {
                        inProgressCount++;
                    }
                }
            }
        }
        
        // Remove duplicates and get unique goals
        java.util.Set<String> uniqueGoals = new java.util.HashSet<>(allGoals);
        java.util.List<String> finalGoals = new java.util.ArrayList<>(uniqueGoals);
        
        // Calculate percentages
        int totalGoalsCount = finalGoals.size();
        double overallProgressPercentage = totalGoalsCount > 0 ? 
            (double) (completedCount * 100) / totalGoalsCount : 0.0;
        
        // Prepare distribution data
        java.util.List<Map<String, Object>> distribution = new java.util.ArrayList<>();
        distribution.add(java.util.Map.of("name", "Completed", "value", completedCount, "color", "#10b981"));
        distribution.add(java.util.Map.of("name", "In Progress", "value", inProgressCount, "color", "#f59e0b"));
        
        analytics.put("totalGoals", totalGoalsCount);
        analytics.put("completedGoals", completedCount);
        analytics.put("inProgressGoals", inProgressCount);
        analytics.put("overallProgress", Math.round(overallProgressPercentage));
        analytics.put("goalDistribution", distribution);
        analytics.put("goals", finalGoals);
        
        return analytics;
    }
}
