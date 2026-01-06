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

import com.hrms.entity.AppraisalCompensation;
import com.hrms.service.AppraisalCompensationService;

@RestController
@RequestMapping("/api/compensations")
@CrossOrigin(origins = "http://localhost:3000")
public class AppraisalCompensationController {
    @Autowired
    private AppraisalCompensationService service;

    @GetMapping
    public ResponseEntity<List<AppraisalCompensation>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/performance/{performanceId}")
    public ResponseEntity<List<AppraisalCompensation>> getByPerformance(@PathVariable Long performanceId) {
        return ResponseEntity.ok(service.getByPerformance(performanceId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AppraisalCompensation>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(service.getByEmployee(employeeId));
    }

    @PostMapping
    public ResponseEntity<AppraisalCompensation> create(@RequestBody AppraisalCompensation c) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(c));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppraisalCompensation> update(@PathVariable Long id, @RequestBody AppraisalCompensation c) {
        return ResponseEntity.ok(service.update(id, c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
