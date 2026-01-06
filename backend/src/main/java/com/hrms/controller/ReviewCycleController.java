package com.hrms.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.ReviewCycle;
import com.hrms.service.ReviewCycleService;

@RestController
@RequestMapping("/api/review-cycles")
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewCycleController {
    @Autowired
    private ReviewCycleService reviewCycleService;

    @GetMapping
    public ResponseEntity<List<ReviewCycle>> getAllCycles() {
        return ResponseEntity.ok(reviewCycleService.getAllCycles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewCycle> getCycleById(@PathVariable Long id) {
        ReviewCycle rc = reviewCycleService.getCycleById(id);
        if (rc == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(rc);
    }

    @PostMapping
    public ResponseEntity<ReviewCycle> createCycle(@RequestBody ReviewCycle cycle) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewCycleService.createCycle(cycle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCycle(@PathVariable Long id, @RequestBody ReviewCycle cycle) {
        try {
            return ResponseEntity.ok(reviewCycleService.updateCycle(id, cycle));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCycle(@PathVariable Long id) {
        reviewCycleService.deleteCycle(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}