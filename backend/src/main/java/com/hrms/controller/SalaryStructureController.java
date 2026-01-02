package com.hrms.controller;

import com.hrms.entity.SalaryStructure;
import com.hrms.service.SalaryStructureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salary-structures")
@CrossOrigin(origins = "http://localhost:3000")
public class SalaryStructureController {

    @Autowired
    private SalaryStructureService salaryStructureService;

    @GetMapping
    public ResponseEntity<List<SalaryStructure>> getAllSalaryStructures() {
        try {
            return ResponseEntity.ok(salaryStructureService.getAllSalaryStructures());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryStructure> getSalaryStructureById(@PathVariable Long id) {
        return salaryStructureService.getSalaryStructureById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<SalaryStructure> getCurrentSalaryStructure(@PathVariable Long employeeId) {
        return salaryStructureService.getCurrentSalaryStructure(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<List<SalaryStructure>> getSalaryHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(salaryStructureService.getEmployeeSalaryHistory(employeeId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSalaryStructure(@RequestBody SalaryStructure salaryStructure) {
        Map<String, Object> response = new HashMap<>();
        try {
            SalaryStructure created = salaryStructureService.createSalaryStructure(salaryStructure);
            response.put("success", true);
            response.put("message", "Salary structure created successfully");
            response.put("salaryStructure", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSalaryStructure(
            @PathVariable Long id, @RequestBody SalaryStructure salaryStructure) {
        Map<String, Object> response = new HashMap<>();
        try {
            SalaryStructure updated = salaryStructureService.updateSalaryStructure(id, salaryStructure);
            response.put("success", true);
            response.put("message", "Salary structure updated successfully");
            response.put("salaryStructure", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSalaryStructure(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            salaryStructureService.deleteSalaryStructure(id);
            response.put("success", true);
            response.put("message", "Salary structure deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

