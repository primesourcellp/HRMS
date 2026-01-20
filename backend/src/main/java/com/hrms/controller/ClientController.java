package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.Client;
import com.hrms.entity.User;
import com.hrms.mapper.EmployeeMapper;
import com.hrms.repository.ClientRepository;
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

    @Autowired
    private ClientRepository clientRepository;

    /**
     * Get all unique client names from employees
     * Used for filtering and client-wise segregation in multi-client payroll management
     */
    @GetMapping
    public ResponseEntity<List<String>> getClients() {
        try {
            // Get clients from Client table
            List<String> clientsFromTable = clientRepository.findAll().stream()
                    .map(Client::getName)
                    .collect(Collectors.toList());
            
            // Also get clients from employees (for backward compatibility)
            List<User> users = userService.getAllEmployees();
            List<String> clientsFromEmployees = users.stream()
                    .filter(emp -> emp.getRole() == null || !emp.getRole().equalsIgnoreCase("SUPER_ADMIN"))
                    .map(User::getClient)
                    .filter(client -> client != null && !client.trim().isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
            
            // Combine and deduplicate
            clientsFromTable.addAll(clientsFromEmployees);
            List<String> allClients = clientsFromTable.stream()
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(allClients);
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
            
            // Count employees per client
            Map<String, Long> counts = actualEmployees.stream()
                    .filter(emp -> emp.getClient() != null && !emp.getClient().trim().isEmpty())
                    .collect(Collectors.groupingBy(
                            User::getClient,
                            Collectors.counting()
                    ));
            
            // Get all clients from Client table and add them with 0 count if they don't have employees
            List<Client> allClients = clientRepository.findAll();
            for (Client client : allClients) {
                counts.putIfAbsent(client.getName(), 0L);
            }
            
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

    /**
     * Create a new client
     * This endpoint validates and stores a client name for future use
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createClient(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String clientNameInput = request.get("name");
            
            if (clientNameInput == null || clientNameInput.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Client name is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            final String clientName = clientNameInput.trim();
            
            // Check if client already exists in Client table
            if (clientRepository.existsByNameIgnoreCase(clientName)) {
                response.put("success", false);
                response.put("message", "Client already exists");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Check if client exists in employees (for backward compatibility)
            List<User> employees = userService.getAllEmployees();
            boolean clientExistsInEmployees = employees.stream()
                    .filter(emp -> emp.getRole() == null || !emp.getRole().equalsIgnoreCase("SUPER_ADMIN"))
                    .anyMatch(emp -> {
                        String empClient = emp.getClient();
                        return empClient != null && empClient.equalsIgnoreCase(clientName);
                    });
            
            if (clientExistsInEmployees) {
                // Client exists in employees but not in Client table - create it in table for consistency
                Client client = new Client();
                client.setName(clientName);
                clientRepository.save(client);
                response.put("success", true);
                response.put("message", "Client created successfully");
                response.put("clientName", clientName);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            }
            
            // Create new client
            Client client = new Client();
            client.setName(clientName);
            Client savedClient = clientRepository.save(client);
            
            response.put("success", true);
            response.put("message", "Client created successfully");
            response.put("clientName", savedClient.getName());
            response.put("clientId", savedClient.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to create client: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

