package com.hrms.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.hrms.dto.EmployeeDTO;
import com.hrms.mapper.EmployeeMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;
import java.util.Objects;
import jakarta.servlet.http.HttpServletRequest;

import com.hrms.entity.Employee;
import com.hrms.service.EmployeeService;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    // -------------------------------------------------------
    // GET ALL (with search)
    // -------------------------------------------------------
    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees(
            @RequestParam(required = false) String search) {
        List<Employee> employees;
        if (search != null && !search.isEmpty()) {
            employees = employeeService.searchEmployees(search);
        } else {
            employees = employeeService.getAllEmployees();
        }
        List<EmployeeDTO> dtos = EmployeeMapper.toDTOList(employees);
        return ResponseEntity.ok(dtos);
    }

    // -------------------------------------------------------
    // GET BY ID
    // -------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable @NonNull Long id) {
        return employeeService.getEmployeeById(Objects.requireNonNull(id))
                .map(EmployeeMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------
    // CREATE EMPLOYEE
    // -------------------------------------------------------
    @PostMapping
    public ResponseEntity<Employee> createEmployee(
            @RequestBody Employee employee,
            @RequestParam(required = false) String userRole,
            HttpServletRequest httpRequest) {

        String role = (String) httpRequest.getAttribute("userRole");
        if (role == null) {
            role = userRole;
        }
        if (role == null || (!role.equals("SUPER_ADMIN") && !role.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Employee created = employeeService.createEmployee(Objects.requireNonNull(employee));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // -------------------------------------------------------
    // UPDATE EMPLOYEE
    // -------------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(
            @PathVariable @NonNull Long id,
            @RequestBody Employee employee,
            @RequestParam(required = false) String userRole,
            HttpServletRequest httpRequest) {

        String role = (String) httpRequest.getAttribute("userRole");
        if (role == null) {
            role = userRole;
        }
        if (role == null || (!role.equals("SUPER_ADMIN") && !role.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Employee updated = employeeService.updateEmployee(Objects.requireNonNull(id), Objects.requireNonNull(employee));
        return ResponseEntity.ok(updated);
    }

    // -------------------------------------------------------
    // DELETE EMPLOYEE
    // -------------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(
            @PathVariable @NonNull Long id,
            @RequestParam(required = false) String userRole,
            HttpServletRequest httpRequest) {

        String role = (String) httpRequest.getAttribute("userRole");
        if (role == null) {
            role = userRole;
        }
        if (role == null || (!role.equals("SUPER_ADMIN") && !role.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        employeeService.deleteEmployee(Objects.requireNonNull(id));
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------
    // CHANGE PASSWORD
    // -------------------------------------------------------
    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable @NonNull Long id,
            @RequestBody Map<String, Object> request) {

        try {
            String currentPassword = (String) request.get("currentPassword");
            String newPassword = (String) request.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Current password and new password are required"));
            }

            // Fetch employee
            Optional<Employee> employeeOpt = employeeService.getEmployeeById(Objects.requireNonNull(id));
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Employee not found"));
            }

            Employee employee = employeeOpt.get();

            // Validate current password
            if (!employeeService.authenticate(employee.getEmail(), currentPassword)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Current password is incorrect"));
            }

            // Update password only
            Employee passwordWrapper = new Employee();
            passwordWrapper.setPassword(newPassword);
            employeeService.updateEmployee(Objects.requireNonNull(id), java.util.Objects.requireNonNull(passwordWrapper));

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password changed successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
