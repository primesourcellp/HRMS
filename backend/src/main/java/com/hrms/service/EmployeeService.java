package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;

@Service
public class EmployeeService {
    @Autowired
    private EmployeeRepository employeeRepository;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    public Employee createEmployee(Employee employee) {
        if (employee.getAvatar() == null || employee.getAvatar().isEmpty()) {
            String avatar = employee.getName().split(" ").length > 1
                    ? employee.getName().split(" ")[0].charAt(0) + "" + employee.getName().split(" ")[1].charAt(0)
                    : employee.getName().charAt(0) + "";
            employee.setAvatar(avatar.toUpperCase());
        }
        
        // Hash password if provided
        if (employee.getPassword() != null && !employee.getPassword().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(employee.getPassword()));
        }
        
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        
        employee.setName(employeeDetails.getName());
        employee.setEmail(employeeDetails.getEmail());
        employee.setPhone(employeeDetails.getPhone());
        employee.setDepartment(employeeDetails.getDepartment());
        employee.setPosition(employeeDetails.getPosition());
        employee.setSalary(employeeDetails.getSalary());
        employee.setJoinDate(employeeDetails.getJoinDate());
        employee.setStatus(employeeDetails.getStatus());
        
        // Update password if provided
        if (employeeDetails.getPassword() != null && !employeeDetails.getPassword().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(employeeDetails.getPassword()));
        }
        
        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    public List<Employee> searchEmployees(String searchTerm) {
        return employeeRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm);
    }

    public Optional<Employee> findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

    public boolean authenticate(String email, String password) {
        if (email == null || password == null || email.trim().isEmpty() || password.isEmpty()) {
            return false;
        }
        
        Optional<Employee> employee = employeeRepository.findByEmail(email.trim());
        if (employee.isPresent() && "Active".equals(employee.get().getStatus())) {
            String storedPassword = employee.get().getPassword();
            if (storedPassword == null || storedPassword.isEmpty()) {
                return false;
            }
            return passwordEncoder.matches(password, storedPassword);
        }
        return false;
    }
}

