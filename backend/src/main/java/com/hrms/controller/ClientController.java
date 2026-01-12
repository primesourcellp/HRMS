package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.User;
import com.hrms.mapper.EmployeeMapper;
import com.hrms.service.UserService;

/**
 * Client Controller
 * Returns list of unique client names from employees for multi-client payroll management
 */
@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "http://localhost:3000")
public class ClientController {

    @Autowired
    private UserService userService;

    /**
     * Get all unique client names from employees
     * Used for filtering and client-wise segregation in multi-client payroll management
     */
    @GetMapping
    public ResponseEntity<List<String>> getClients() {
        try {
            List<User> users = userService.getAllEmployees();
            // Filter out SUPER_ADMIN users - they are not employees
            List<String> clients = users.stream()
                    .filter(emp -> emp.getRole() == null || !emp.getRole().equalsIgnoreCase("SUPER_ADMIN"))
                    .map(User::getClient)
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

    /**
     * Get employee count per client
     * Returns a map of client names to employee counts
     */
    @GetMapping("/employee-counts")
    public ResponseEntity<Map<String, Object>> getEmployeeCountsByClient() {
        try {
            List<User> employees = userService.getAllEmployees();
            // Filter out SUPER_ADMIN users - they are not employees
            List<User> actualEmployees = employees.stream()
                    .filter(emp -> emp.getRole() == null || !emp.getRole().equalsIgnoreCase("SUPER_ADMIN"))
                    .collect(Collectors.toList());
            
            Map<String, Long> counts = actualEmployees.stream()
                    .filter(emp -> emp.getClient() != null && !emp.getClient().trim().isEmpty())
                    .collect(Collectors.groupingBy(
                            User::getClient,
                            Collectors.counting()
                    ));
            
            // Also count unassigned employees (excluding SUPER_ADMIN)
            long unassignedCount = actualEmployees.stream()
                    .filter(emp -> emp.getClient() == null || emp.getClient().trim().isEmpty())
                    .count();
            
            Map<String, Object> result = new HashMap<>();
            result.put("clientCounts", counts);
            result.put("unassignedCount", unassignedCount);
            result.put("totalClients", counts.size());
            result.put("totalEmployees", actualEmployees.size());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch employee counts");
            error.put("message", e.getMessage());
            return ResponseEntity.ok(error);
        }
    }

    /**
     * Get all employees assigned to a specific client
     */
    @GetMapping("/{clientName}/employees")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByClient(@PathVariable String clientName) {
        try {
            List<User> employees = userService.getAllEmployees();
            // Filter out SUPER_ADMIN users and filter by client
            List<User> clientEmployees = employees.stream()
                    .filter(emp -> emp.getRole() == null || !emp.getRole().equalsIgnoreCase("SUPER_ADMIN"))
                    .filter(emp -> {
                        String empClient = emp.getClient();
                        return empClient != null && empClient.equalsIgnoreCase(clientName);
                    })
                    .collect(Collectors.toList());
            
            List<EmployeeDTO> dtos = EmployeeMapper.toDTOList(clientEmployees);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
}

