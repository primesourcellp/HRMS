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
import com.hrms.entity.User;
import com.hrms.entity.Payroll;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.UserRepository;
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
    private UserRepository userRepository;
    
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
                Optional<User> userOpt = userRepository.findById(employeeId);
                if (userOpt.isEmpty()) {
                    stats.put("error", "User not found");
                    return ResponseEntity.status(404).body(stats);
                }
                
                User user = userOpt.get();
                
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
                
                // User's department (for display)
                stats.put("department", user.getDepartment());
                stats.put("employeeName", user.getName());
                
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
                long totalEmployees = userRepository.count();
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
                List<User> users = userRepository.findAll();
                Map<String, Long> departmentCount = users.stream()
                        .filter(user -> user != null && user.getDepartment() != null)
                        .collect(Collectors.groupingBy(
                                User::getDepartment,
                                Collectors.counting()
                        ));
                stats.put("departmentDistribution", departmentCount);
                
                // Active vs Inactive employees
                long activeEmployees = users.stream()
                        .filter(user -> user != null && "Active".equals(user.getStatus()))
                        .count();
                long inactiveEmployees = totalEmployees - activeEmployees;
                stats.put("activeEmployees", activeEmployees);
                stats.put("inactiveEmployees", inactiveEmployees);
                
                // Recent employees (last 5)
                List<User> recentUsers = users.stream()
                        .filter(user -> user != null && user.getDateOfJoining() != null)
                        .sorted((a, b) -> b.getDateOfJoining().compareTo(a.getDateOfJoining()))
                        .limit(5)
                        .collect(Collectors.toList());
                stats.put("recentEmployees", recentUsers);
                
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

    @GetMapping("/executive")
    public ResponseEntity<Map<String, Object>> getExecutiveDashboard(
            @RequestParam(required = false) Integer months,
            @RequestParam(required = false) String selectedMonth) {
        
        if (months == null || months <= 0) {
            months = 12; // Default to last 12 months
        }
        
        Map<String, Object> dashboard = new HashMap<>();
        
        try {
            LocalDate today = LocalDate.now();
            
            List<User> allUsers = userRepository.findAll();
            
            // ========== REAL-TIME KPIs ==========
            
            // 1. Headcount (Total Active Employees)
            long totalHeadcount = allUsers.stream()
                    .filter(user -> user != null && 
                            (user.getEmployeeStatus() == null || 
                             "Active".equalsIgnoreCase(user.getEmployeeStatus())))
                    .count();
            dashboard.put("headcount", totalHeadcount);
            
            // 2. Attrition Rate (Employees who exited in last 12 months)
            LocalDate twelveMonthsAgo = today.minusMonths(12);
            long exitedEmployees = allUsers.stream()
                    .filter(user -> user != null && user.getDateOfExit() != null &&
                            user.getDateOfExit().isAfter(twelveMonthsAgo) &&
                            user.getDateOfExit().isBefore(today.plusDays(1)))
                    .count();
            
            // Calculate average headcount over the period
            long avgHeadcount = totalHeadcount; // Simplified - can be enhanced
            double attritionRate = avgHeadcount > 0 
                    ? (double) exitedEmployees / avgHeadcount * 100 
                    : 0.0;
            dashboard.put("attritionRate", Math.round(attritionRate * 100.0) / 100.0);
            dashboard.put("exitedEmployees", exitedEmployees);
            
            // 3. Attendance % (Current Month)
            LocalDate monthStart = today.withDayOfMonth(1);
            List<Attendance> monthAttendance = attendanceRepository.findAll().stream()
                    .filter(a -> a != null && a.getDate() != null &&
                            !a.getDate().isBefore(monthStart) &&
                            !a.getDate().isAfter(today))
                    .collect(Collectors.toList());
            
            long presentCount = monthAttendance.stream()
                    .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                    .count();
            long totalAttendanceRecords = monthAttendance.size();
            double attendancePercentage = totalHeadcount > 0 && totalAttendanceRecords > 0
                    ? (double) presentCount / (totalHeadcount * today.getDayOfMonth()) * 100
                    : 0.0;
            dashboard.put("attendancePercentage", Math.round(attendancePercentage * 100.0) / 100.0);
            
            // 4. Payroll Cost (Current Month)
            String currentMonth = today.toString().substring(0, 7); // yyyy-MM
            List<Payroll> currentMonthPayrolls = payrollRepository.findByMonth(currentMonth);
            double payrollCost = currentMonthPayrolls.stream()
                    .filter(p -> p != null && p.getAmount() != null)
                    .mapToDouble(Payroll::getAmount)
                    .sum();
            dashboard.put("payrollCost", payrollCost);
            
            // ========== MONTHLY ATTENDANCE TRENDS ==========
            List<Map<String, Object>> monthlyAttendance = new java.util.ArrayList<>();
            for (int i = months - 1; i >= 0; i--) {
                LocalDate month = today.minusMonths(i).withDayOfMonth(1);
                LocalDate monthEnd = month.plusMonths(1).minusDays(1);
                
                List<Attendance> allAttendanceForMonth = attendanceRepository.findAll();
                List<Attendance> monthData = allAttendanceForMonth.stream()
                        .filter(a -> a != null && a.getDate() != null &&
                                !a.getDate().isBefore(month) &&
                                !a.getDate().isAfter(monthEnd))
                        .collect(Collectors.toList());
                
                long monthPresent = monthData.stream()
                        .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                        .count();
                
                // Calculate working days in month
                long workingDays = 0;
                LocalDate temp = month;
                while (!temp.isAfter(monthEnd) && !temp.isAfter(today)) {
                    int dayOfWeek = temp.getDayOfWeek().getValue();
                    if (dayOfWeek < 6) { // Monday to Friday
                        workingDays++;
                    }
                    temp = temp.plusDays(1);
                }
                
                double monthAttendanceRate = totalHeadcount > 0 && workingDays > 0
                        ? (double) monthPresent / (totalHeadcount * workingDays) * 100
                        : 0.0;
                
                // Calculate absent count for the month
                long monthAbsent = monthData.stream()
                        .filter(a -> "Absent".equalsIgnoreCase(a.getStatus()))
                        .count();
                
                Map<String, Object> monthDataMap = new HashMap<>();
                monthDataMap.put("month", month.toString().substring(0, 7));
                monthDataMap.put("attendanceRate", Math.round(monthAttendanceRate * 100.0) / 100.0);
                monthDataMap.put("present", monthPresent);
                monthDataMap.put("absent", monthAbsent);
                monthDataMap.put("workingDays", workingDays);
                monthlyAttendance.add(monthDataMap);
            }
            dashboard.put("monthlyAttendanceTrends", monthlyAttendance);
            
            // ========== DAILY ATTENDANCE TRENDS (Complete Month) ==========
            List<Map<String, Object>> dailyAttendance = new java.util.ArrayList<>();
            List<Attendance> allAttendance = attendanceRepository.findAll();
            
            // Determine which month to show
            LocalDate targetMonth;
            if (selectedMonth != null && !selectedMonth.isEmpty()) {
                try {
                    // Parse YYYY-MM format
                    targetMonth = LocalDate.parse(selectedMonth + "-01");
                } catch (Exception e) {
                    targetMonth = today.withDayOfMonth(1); // Default to current month
                }
            } else {
                targetMonth = today.withDayOfMonth(1); // Default to current month
            }
            
            LocalDate dailyMonthStart = targetMonth.withDayOfMonth(1);
            LocalDate dailyMonthEnd = targetMonth.withDayOfMonth(targetMonth.lengthOfMonth());
            
            // Get all days in the selected month
            for (LocalDate date = dailyMonthStart; !date.isAfter(dailyMonthEnd); date = date.plusDays(1)) {
                final LocalDate currentDate = date; // Make effectively final for lambda
                List<Attendance> dayData = allAttendance.stream()
                        .filter(a -> a != null && a.getDate() != null && a.getDate().equals(currentDate))
                        .collect(Collectors.toList());
                
                long dayPresent = dayData.stream()
                        .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                        .count();
                
                long dayAbsent = dayData.stream()
                        .filter(a -> "Absent".equalsIgnoreCase(a.getStatus()))
                        .count();
                
                // Format date similar to monthly view: "YYYY-MM-DD" format
                String dateLabel = currentDate.toString(); // "YYYY-MM-DD" format
                boolean isToday = currentDate.equals(today);
                String displayLabel = isToday ? dateLabel + " (Today)" : dateLabel;
                
                Map<String, Object> dayDataMap = new HashMap<>();
                dayDataMap.put("date", dateLabel);
                dayDataMap.put("displayLabel", displayLabel);
                dayDataMap.put("fullDate", currentDate.toString());
                dayDataMap.put("present", dayPresent);
                dayDataMap.put("absent", dayAbsent);
                dayDataMap.put("isToday", isToday);
                dailyAttendance.add(dayDataMap);
            }
            dashboard.put("dailyAttendanceTrends", dailyAttendance);
            dashboard.put("selectedMonth", targetMonth.toString().substring(0, 7)); // YYYY-MM
            
            // ========== LEAVE PATTERNS ==========
            List<com.hrms.entity.Leave> allLeaves = leaveRepository.findAll();
            List<Map<String, Object>> leavePatterns = new java.util.ArrayList<>();
            
            for (int i = months - 1; i >= 0; i--) {
                LocalDate month = today.minusMonths(i).withDayOfMonth(1);
                LocalDate monthEnd = month.plusMonths(1).minusDays(1);
                
                long monthLeaves = allLeaves.stream()
                        .filter(l -> l != null && l.getStartDate() != null &&
                                !l.getStartDate().isAfter(monthEnd) &&
                                !l.getEndDate().isBefore(month))
                        .count();
                
                long approvedLeaves = allLeaves.stream()
                        .filter(l -> l != null && l.getStartDate() != null &&
                                !l.getStartDate().isAfter(monthEnd) &&
                                !l.getEndDate().isBefore(month) &&
                                "Approved".equalsIgnoreCase(l.getStatus()))
                        .count();
                
                Map<String, Object> leaveData = new HashMap<>();
                leaveData.put("month", month.toString().substring(0, 7));
                leaveData.put("totalLeaves", monthLeaves);
                leaveData.put("approvedLeaves", approvedLeaves);
                leaveData.put("pendingLeaves", monthLeaves - approvedLeaves);
                leavePatterns.add(leaveData);
            }
            dashboard.put("leavePatterns", leavePatterns);
            
            // ========== PAYROLL VARIANCE ==========
            List<Map<String, Object>> payrollVariance = new java.util.ArrayList<>();
            double previousMonthPayroll = 0.0;
            
            for (int i = months - 1; i >= 0; i--) {
                LocalDate month = today.minusMonths(i).withDayOfMonth(1);
                String monthStr = month.toString().substring(0, 7);
                
                List<Payroll> monthPayrolls = payrollRepository.findByMonth(monthStr);
                double monthPayroll = monthPayrolls.stream()
                        .filter(p -> p != null && p.getAmount() != null)
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                
                double variance = previousMonthPayroll > 0
                        ? ((monthPayroll - previousMonthPayroll) / previousMonthPayroll) * 100
                        : 0.0;
                
                Map<String, Object> payrollData = new HashMap<>();
                payrollData.put("month", monthStr);
                payrollData.put("amount", monthPayroll);
                payrollData.put("variance", Math.round(variance * 100.0) / 100.0);
                payrollVariance.add(payrollData);
                
                previousMonthPayroll = monthPayroll;
            }
            dashboard.put("payrollVariance", payrollVariance);
            
            // ========== DEPARTMENT-WISE ANALYTICS ==========
            Map<String, Map<String, Object>> departmentAnalytics = new HashMap<>();
            Map<String, Long> deptHeadcount = allUsers.stream()
                    .filter(user -> user != null && user.getDepartment() != null &&
                            (user.getEmployeeStatus() == null || 
                             "Active".equalsIgnoreCase(user.getEmployeeStatus())))
                    .collect(Collectors.groupingBy(
                            User::getDepartment,
                            Collectors.counting()
                    ));
            
            for (Map.Entry<String, Long> entry : deptHeadcount.entrySet()) {
                String dept = entry.getKey();
                long deptCount = entry.getValue();
                
                // Department attendance
                long deptPresent = monthAttendance.stream()
                        .filter(a -> {
                            Optional<User> user = allUsers.stream()
                                    .filter(e -> e != null && e.getId() != null && 
                                            e.getId().equals(a.getEmployeeId()))
                                    .findFirst();
                            return user.isPresent() && dept.equals(user.get().getDepartment());
                        })
                        .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                        .count();
                
                double deptAttendanceRate = deptCount > 0
                        ? (double) deptPresent / (deptCount * today.getDayOfMonth()) * 100
                        : 0.0;
                
                // Department payroll
                double deptPayroll = currentMonthPayrolls.stream()
                        .filter(p -> {
                            Optional<User> user = allUsers.stream()
                                    .filter(e -> e != null && e.getId() != null && 
                                            e.getId().equals(p.getEmployeeId()))
                                    .findFirst();
                            return user.isPresent() && dept.equals(user.get().getDepartment());
                        })
                        .filter(p -> p.getAmount() != null)
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                
                Map<String, Object> deptData = new HashMap<>();
                deptData.put("headcount", deptCount);
                deptData.put("attendanceRate", Math.round(deptAttendanceRate * 100.0) / 100.0);
                deptData.put("payrollCost", deptPayroll);
                departmentAnalytics.put(dept, deptData);
            }
            dashboard.put("departmentAnalytics", departmentAnalytics);
            
            // ========== LOCATION-WISE ANALYTICS ==========
            Map<String, Map<String, Object>> locationAnalytics = new HashMap<>();
            Map<String, Long> locationHeadcount = allUsers.stream()
                    .filter(user -> user != null && user.getLocation() != null &&
                            (user.getEmployeeStatus() == null || 
                             "Active".equalsIgnoreCase(user.getEmployeeStatus())))
                    .collect(Collectors.groupingBy(
                            User::getLocation,
                            Collectors.counting()
                    ));
            
            for (Map.Entry<String, Long> entry : locationHeadcount.entrySet()) {
                String location = entry.getKey();
                long locCount = entry.getValue();
                
                // Location attendance
                long locPresent = monthAttendance.stream()
                        .filter(a -> {
                            Optional<User> user = allUsers.stream()
                                    .filter(e -> e != null && e.getId() != null && 
                                            e.getId().equals(a.getEmployeeId()))
                                    .findFirst();
                            return user.isPresent() && location.equals(user.get().getLocation());
                        })
                        .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                        .count();
                
                double locAttendanceRate = locCount > 0
                        ? (double) locPresent / (locCount * today.getDayOfMonth()) * 100
                        : 0.0;
                
                // Location payroll
                double locPayroll = currentMonthPayrolls.stream()
                        .filter(p -> {
                            Optional<User> user = allUsers.stream()
                                    .filter(e -> e != null && e.getId() != null && 
                                            e.getId().equals(p.getEmployeeId()))
                                    .findFirst();
                            return user.isPresent() && location.equals(user.get().getLocation());
                        })
                        .filter(p -> p.getAmount() != null)
                        .mapToDouble(Payroll::getAmount)
                        .sum();
                
                Map<String, Object> locData = new HashMap<>();
                locData.put("headcount", locCount);
                locData.put("attendanceRate", Math.round(locAttendanceRate * 100.0) / 100.0);
                locData.put("payrollCost", locPayroll);
                locationAnalytics.put(location, locData);
            }
            dashboard.put("locationAnalytics", locationAnalytics);
            
        } catch (Exception e) {
            e.printStackTrace();
            dashboard.put("error", "Error calculating executive dashboard: " + 
                    (e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
        
        return ResponseEntity.ok(dashboard);
    }
}

