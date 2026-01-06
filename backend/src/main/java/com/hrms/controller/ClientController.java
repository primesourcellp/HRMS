package com.hrms.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.Employee;
import com.hrms.service.EmployeeService;

/**
 * Client Controller
 * Returns list of unique client names from employees for multi-client payroll management
 */
@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "http://localhost:3000")
public class ClientController {

    @Autowired
    private EmployeeService employeeService;

    /**
     * Get all unique client names from employees
     * Used for filtering and client-wise segregation in multi-client payroll management
     */
    @GetMapping
    public ResponseEntity<List<String>> getClients() {
        try {
            List<Employee> employees = employeeService.getAllEmployees();
            List<String> clients = employees.stream()
                    .map(Employee::getClient)
                    .filter(client -> client != null && !client.trim().isEmpty())
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());
            return ResponseEntity.ok(clients);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of()); // Return empty list on error
        }
    }
}

