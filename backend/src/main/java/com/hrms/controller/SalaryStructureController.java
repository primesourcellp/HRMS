package com.hrms.controller;

import com.hrms.entity.SalaryStructure;
import com.hrms.service.SalaryStructureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
import java.util.Objects;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salary-structures")
@CrossOrigin(origins = "http://localhost:3000")
public class SalaryStructureController {

    @Autowired
    private SalaryStructureService salaryStructureService;

    @GetMapping("/employee/{employeeId}")
<<<<<<< HEAD
    public ResponseEntity<SalaryStructure> getCurrentSalaryStructure(@PathVariable @NonNull Long employeeId) {
        return salaryStructureService.getCurrentSalaryStructure(Objects.requireNonNull(employeeId))
=======
    public ResponseEntity<SalaryStructure> getCurrentSalaryStructure(@PathVariable Long employeeId) {
        return salaryStructureService.getCurrentSalaryStructure(employeeId)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}/history")
<<<<<<< HEAD
    public ResponseEntity<List<SalaryStructure>> getSalaryHistory(@PathVariable @NonNull Long employeeId) {
        return ResponseEntity.ok(salaryStructureService.getEmployeeSalaryHistory(Objects.requireNonNull(employeeId)));
=======
    public ResponseEntity<List<SalaryStructure>> getSalaryHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(salaryStructureService.getEmployeeSalaryHistory(employeeId));
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
            @PathVariable @NonNull Long id, @RequestBody SalaryStructure salaryStructure) {
        Map<String, Object> response = new HashMap<>();
        try {
            SalaryStructure updated = salaryStructureService.updateSalaryStructure(Objects.requireNonNull(id), Objects.requireNonNull(salaryStructure));
=======
            @PathVariable Long id, @RequestBody SalaryStructure salaryStructure) {
        Map<String, Object> response = new HashMap<>();
        try {
            SalaryStructure updated = salaryStructureService.updateSalaryStructure(id, salaryStructure);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> deleteSalaryStructure(@PathVariable long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            salaryStructureService.deleteSalaryStructure(Objects.requireNonNull(id));
=======
    public ResponseEntity<Map<String, Object>> deleteSalaryStructure(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            salaryStructureService.deleteSalaryStructure(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
