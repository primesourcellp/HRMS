package com.hrms.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.entity.Payroll;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.PayrollRepository;

/**
 * Dashboard Controller
 * 
 * IMPORTANT: If your IDE shows "cannot find symbol" errors for getter methods (getStatus(), getAmount(), etc.),
 * these are FALSE POSITIVES. Lombok's @Data annotation generates these methods at compile time.
 * 
 * The code compiles and runs correctly - verified with: mvn clean compile
 * 
 * To resolve IDE warnings:
 * 1. Install Lombok plugin for your IDE (NetBeans/IntelliJ/Eclipse)
 * 2. Enable annotation processing in your IDE settings
 * 3. Restart your IDE after installing Lombok plugin
 * 
 * All entity classes (Attendance, Payroll, Employee) use @Data annotation which generates:
 * - getStatus() from 'status' field
 * - getAmount() from 'amount' field  
 * - getDepartment() from 'department' field
 * - getJoinDate() from 'joinDate' field
 * - And all other getters/setters automatically
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private LeaveRepository leaveRepository;
    
    @Autowired
    private PayrollRepository payrollRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long employeeId) {
        
        if (date == null) {
            date = LocalDate.now();
        }

        Map<String, Object> stats = new HashMap<>();
        
        try {
            // If employeeId is provided, show only that employee's data
            if (employeeId != null) {
                Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
                if (employeeOpt.isEmpty()) {
                    stats.put("error", "Employee not found");
                    return ResponseEntity.status(404).body(stats);
                }
                
                Employee employee = employeeOpt.get();
                
                // Employee's attendance today
                Optional<Attendance> todayAttendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, date);
                boolean isPresentToday = todayAttendance.isPresent() && "Present".equals(todayAttendance.get().getStatus());
                stats.put("presentToday", isPresentToday ? 1 : 0);
                stats.put("absentToday", isPresentToday ? 0 : 1);
                
                // Employee's pending leaves
                List<com.hrms.entity.Leave> employeeLeaves = leaveRepository.findByEmployeeId(employeeId);
                long pendingLeaves = employeeLeaves.stream()
                        .filter(l -> l != null && "Pending".equals(l.getStatus()))
                        .count();
                stats.put("pendingLeaves", pendingLeaves);
                
                // Employee's approved leaves
                long approvedLeaves = employeeLeaves.stream()
                        .filter(l -> l != null && "Approved".equals(l.getStatus()))
                        .count();
                stats.put("approvedLeaves", approvedLeaves);
                
                // Employee's total payroll
                List<Payroll> employeePayrolls = payrollRepository.findByEmployeeId(employeeId);
                double totalPayroll = employeePayrolls.stream()
                        .filter(p -> p != null && p.getAmount() != null)
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                stats.put("totalPayroll", totalPayroll);
                
                // Employee's monthly payroll (current month)
                String currentMonth = LocalDate.now().toString().substring(0, 7); // yyyy-MM
                double monthlyPayroll = employeePayrolls.stream()
                        .filter(p -> p != null && p.getAmount() != null && 
                                p.getMonth() != null && p.getMonth().startsWith(currentMonth))
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                stats.put("monthlyPayroll", monthlyPayroll);
                
                // Employee's department (for display)
                stats.put("department", employee.getDepartment());
                stats.put("employeeName", employee.getName());
                
                // Employee's attendance history (last 7 days for chart)
                LocalDate weekStart = date.minusDays(6);
                List<Attendance> weekAttendance = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, weekStart, date);
                stats.put("weekAttendance", weekAttendance);
                
                // Employee's attendance rate (last 30 days)
                LocalDate monthStart = date.minusDays(29);
                List<Attendance> monthAttendance = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, monthStart, date);
                long presentDays = monthAttendance.stream()
                        .filter(a -> a != null && "Present".equals(a.getStatus()))
                        .count();
                double attendanceRate = !monthAttendance.isEmpty() 
                        ? (double) presentDays / monthAttendance.size() * 100 
                        : 0.0;
                stats.put("attendanceRate", Math.round(attendanceRate * 100.0) / 100.0);
                
                // Set isEmployeeDashboard flag
                stats.put("isEmployeeDashboard", true);
                
            } else {
                // Admin/All employees view
                // Total employees
                long totalEmployees = employeeRepository.count();
                stats.put("totalEmployees", totalEmployees);
                
                // Present today
                List<Attendance> todayAttendance = attendanceRepository.findByDate(date);
                long presentToday = todayAttendance.stream()
                        .filter(a -> a != null && "Present".equals(a.getStatus()))
                        .count();
                stats.put("presentToday", presentToday);
                
                // Absent today
                long absentToday = todayAttendance.stream()
                        .filter(a -> a != null && "Absent".equals(a.getStatus()))
                        .count();
                stats.put("absentToday", absentToday);
                
                // Pending leaves
                long pendingLeaves = leaveRepository.findByStatus("Pending").size();
                stats.put("pendingLeaves", pendingLeaves);
                
                // Approved leaves
                long approvedLeaves = leaveRepository.findByStatus("Approved").size();
                stats.put("approvedLeaves", approvedLeaves);
                
                // Total payroll
                List<Payroll> allPayrolls = payrollRepository.findAll();
                double totalPayroll = allPayrolls.stream()
                        .filter(p -> p != null && p.getAmount() != null)
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                stats.put("totalPayroll", totalPayroll);
                
                // Monthly payroll (current month)
                String currentMonth = LocalDate.now().toString().substring(0, 7); // yyyy-MM
                double monthlyPayroll = payrollRepository.findByMonth(currentMonth).stream()
                        .filter(p -> p != null && p.getAmount() != null)
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                stats.put("monthlyPayroll", monthlyPayroll);
                
                // Department distribution
                List<Employee> employees = employeeRepository.findAll();
                Map<String, Long> departmentCount = employees.stream()
                        .filter(emp -> emp != null && emp.getDepartment() != null)
                        .collect(Collectors.groupingBy(
                                Employee::getDepartment,
                                Collectors.counting()
                        ));
                stats.put("departmentDistribution", departmentCount);
                
                // Active vs Inactive employees
                long activeEmployees = employees.stream()
                        .filter(emp -> emp != null && "Active".equals(emp.getStatus()))
                        .count();
                long inactiveEmployees = totalEmployees - activeEmployees;
                stats.put("activeEmployees", activeEmployees);
                stats.put("inactiveEmployees", inactiveEmployees);
                
                // Recent employees (last 5)
                List<Employee> recentEmployees = employees.stream()
                        .filter(emp -> emp != null && emp.getJoinDate() != null)
                        .sorted((a, b) -> b.getJoinDate().compareTo(a.getJoinDate()))
                        .limit(5)
                        .collect(Collectors.toList());
                stats.put("recentEmployees", recentEmployees);
                
                // Attendance rate
                double attendanceRate = totalEmployees > 0 
                        ? (double) presentToday / totalEmployees * 100 
                        : 0.0;
                stats.put("attendanceRate", Math.round(attendanceRate * 100.0) / 100.0);
                
                stats.put("isEmployeeDashboard", false);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            stats.put("error", "Error calculating dashboard statistics: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
            // Return empty/default values to prevent frontend errors
            if (!stats.containsKey("totalEmployees")) stats.put("totalEmployees", 0);
            if (!stats.containsKey("presentToday")) stats.put("presentToday", 0);
            if (!stats.containsKey("pendingLeaves")) stats.put("pendingLeaves", 0);
            if (!stats.containsKey("totalPayroll")) stats.put("totalPayroll", 0.0);
        }
        
        return ResponseEntity.ok(stats);
    }
}

