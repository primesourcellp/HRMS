package com.hrms.controller;

import java.util.List;
import java.util.Map;
<<<<<<< HEAD
import java.util.Optional;

import com.hrms.dto.EmployeeDTO;
import com.hrms.mapper.EmployeeMapper;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
<<<<<<< HEAD
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;
import java.util.Objects;
import jakarta.servlet.http.HttpServletRequest;

import com.hrms.entity.Employee;
=======
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.Employee;
import com.hrms.mapper.DTOMapper;
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
import com.hrms.service.EmployeeService;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeController {
<<<<<<< HEAD

    @Autowired
    private EmployeeService employeeService;

    // -------------------------------------------------------
    // GET ALL (with search)
    // -------------------------------------------------------
    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees(
            @RequestParam(required = false) String search) {
=======
    @Autowired
    private EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees(@RequestParam(required = false) String search) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        List<Employee> employees;
        if (search != null && !search.isEmpty()) {
            employees = employeeService.searchEmployees(search);
        } else {
            employees = employeeService.getAllEmployees();
        }
<<<<<<< HEAD
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
=======
        return ResponseEntity.ok(DTOMapper.toEmployeeDTOList(employees));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id)
                .map(DTOMapper::toEmployeeDTO)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

<<<<<<< HEAD
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

=======
    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(@RequestBody Employee employee, @RequestParam(required = false) String userRole) {
        // Both SUPER_ADMIN and ADMIN can create employees
        if (userRole == null || (!userRole.equals("SUPER_ADMIN") && !userRole.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Employee created = employeeService.createEmployee(employee);
        return ResponseEntity.status(HttpStatus.CREATED).body(DTOMapper.toEmployeeDTO(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable Long id, @RequestBody Employee employee, @RequestParam(required = false) String userRole) {
        // Both SUPER_ADMIN and ADMIN can update employees
        if (userRole == null || (!userRole.equals("SUPER_ADMIN") && !userRole.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Employee updated = employeeService.updateEmployee(id, employee);
        return ResponseEntity.ok(DTOMapper.toEmployeeDTO(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id, @RequestParam(required = false) String userRole) {
        // Both SUPER_ADMIN and ADMIN can delete employees
        if (userRole == null || (!userRole.equals("SUPER_ADMIN") && !userRole.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only ADMIN or SUPER_ADMIN can delete employees"));
        }
        try {
            employeeService.deleteEmployee(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Employee deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete employee: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String currentPassword = (String) request.get("currentPassword");
            String newPassword = (String) request.get("newPassword");
            
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Current password and new password are required"));
            }
<<<<<<< HEAD

            // Fetch employee
            Optional<Employee> employeeOpt = employeeService.getEmployeeById(Objects.requireNonNull(id));
=======
            
            // Verify current password
            java.util.Optional<com.hrms.entity.Employee> employeeOpt = employeeService.getEmployeeById(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Employee not found"));
            }
<<<<<<< HEAD

            Employee employee = employeeOpt.get();

            // Validate current password
=======
            
            com.hrms.entity.Employee employee = employeeOpt.get();
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            if (!employeeService.authenticate(employee.getEmail(), currentPassword)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Current password is incorrect"));
            }
<<<<<<< HEAD

            // Update password only
            Employee passwordWrapper = new Employee();
            passwordWrapper.setPassword(newPassword);
            employeeService.updateEmployee(Objects.requireNonNull(id), java.util.Objects.requireNonNull(passwordWrapper));

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password changed successfully"));

=======
            
            // Update password - create a new employee object with just the password
            Employee passwordUpdate = new Employee();
            passwordUpdate.setPassword(newPassword);
            employeeService.updateEmployee(id, passwordUpdate);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
