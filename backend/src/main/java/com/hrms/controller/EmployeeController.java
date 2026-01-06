package com.hrms.controller;

import java.util.List;
import java.util.Map;
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
    public ResponseEntity<?> createEmployee(
            @RequestBody Employee employee,
            @RequestParam(required = false) String userRole,
            HttpServletRequest httpRequest) {

        String role = (String) httpRequest.getAttribute("userRole");
        if (role == null) {
            role = userRole;
        }
        if (role == null || (!role.equals("SUPER_ADMIN") && !role.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Only SUPER_ADMIN or ADMIN can create employees"));
        }

        try {
            // Validate that employee is not null
            if (employee == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Employee data is required"));
            }
            
            Employee created = employeeService.createEmployee(employee);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle database constraint violations
            e.printStackTrace();
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("doesn't have a default value")) {
                // Extract the field name from the error message
                String fieldName = "unknown field";
                if (errorMessage.contains("Field '")) {
                    int start = errorMessage.indexOf("Field '") + 7;
                    int end = errorMessage.indexOf("'", start);
                    if (end > start) {
                        fieldName = errorMessage.substring(start, end);
                    }
                }
                errorMessage = "Required field '" + fieldName + "' is missing. Please ensure all required fields are provided.";
            } else if (errorMessage != null && errorMessage.contains("cannot be null")) {
                // Extract the column name from the error message
                String columnName = "unknown column";
                if (errorMessage.contains("Column '")) {
                    int start = errorMessage.indexOf("Column '") + 8;
                    int end = errorMessage.indexOf("'", start);
                    if (end > start) {
                        columnName = errorMessage.substring(start, end);
                    }
                }
                errorMessage = "Required field '" + columnName + "' cannot be null. Please ensure all required fields are provided.";
            } else if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "Database constraint violation occurred while creating the employee";
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", errorMessage, "error", "DataIntegrityViolationException"));
        } catch (Exception e) {
            // Log the full exception for debugging
            e.printStackTrace();
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "An unexpected error occurred while creating the employee: " + e.getClass().getSimpleName();
            }
            // Include the root cause if available
            Throwable rootCause = e.getCause();
            if (rootCause != null && rootCause.getMessage() != null) {
                errorMessage += " - " + rootCause.getMessage();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", errorMessage, "error", e.getClass().getSimpleName()));
        }
    }

    // -------------------------------------------------------
    // UPDATE EMPLOYEE
    // -------------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(
            @PathVariable @NonNull Long id,
            @RequestBody Employee employee,
            @RequestParam(required = false) String userRole,
            HttpServletRequest httpRequest) {

        String role = (String) httpRequest.getAttribute("userRole");
        Long currentUserId = (Long) httpRequest.getAttribute("userId");
        
        if (role == null) {
            role = userRole;
        }
        
        // Authorization check
        if (role == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Unauthorized access"));
        }
        
        // SUPER_ADMIN and ADMIN can update any employee
        boolean isAdmin = role.equals("SUPER_ADMIN") || role.equals("ADMIN");
        
        // EMPLOYEE can only update their own profile
        boolean isOwnProfile = role.equals("EMPLOYEE") && currentUserId != null && currentUserId.equals(id);
        
        if (!isAdmin && !isOwnProfile) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "You can only update your own profile"));
        }
        
        // If employee is updating their own profile, restrict certain fields
        if (isOwnProfile && !isAdmin) {
            // Employees cannot update sensitive fields - set them to null so they won't be changed
            employee.setSalary(null);
            employee.setDepartment(null);
            employee.setDesignation(null);
            employee.setRole(null);
            employee.setEmployeeStatus(null);
            employee.setDateOfJoining(null);
            employee.setDateOfExit(null);
            employee.setClient(null);
            employee.setLocation(null);
            employee.setEmploymentType(null);
            employee.setEmployeeId(null); // Prevent changing employee ID
        }

        try {
            Employee updated = employeeService.updateEmployee(Objects.requireNonNull(id), Objects.requireNonNull(employee));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            // Log the exception for debugging
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            // Log the full exception for debugging
            e.printStackTrace();
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "An unexpected error occurred while updating the employee";
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", errorMessage, "error", e.getClass().getSimpleName()));
        }
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

   
}
