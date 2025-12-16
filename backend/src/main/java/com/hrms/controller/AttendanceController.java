package com.hrms.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
import com.hrms.entity.Attendance;
import com.hrms.service.AttendanceService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:3000")
public class AttendanceController {
    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<?> getAllAttendance() {
        try {
            return ResponseEntity.ok(attendanceService.getAllAttendance());
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching attendance: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
<<<<<<< HEAD
    public ResponseEntity<Attendance> getAttendanceById(@PathVariable long id) {
=======
    public ResponseEntity<Attendance> getAttendanceById(@PathVariable Long id) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        return attendanceService.getAttendanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<?> getAttendanceByDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching attendance by date: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/employee/{employeeId}")
<<<<<<< HEAD
    public ResponseEntity<?> getAttendanceByEmployeeId(@PathVariable long employeeId) {
=======
    public ResponseEntity<?> getAttendanceByEmployeeId(@PathVariable Long employeeId) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        try {
            return ResponseEntity.ok(attendanceService.getAttendanceByEmployeeId(employeeId));
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching employee attendance: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/check-in")
    public ResponseEntity<Map<String, Object>> checkIn(@RequestBody Map<String, Object> request, 
                                                        HttpServletRequest httpRequest) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Safely get employeeId with null check
            Object employeeIdObj = request.get("employeeId");
            if (employeeIdObj == null) {
                response.put("success", false);
                response.put("message", "Employee ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            Long employeeId = Long.valueOf(employeeIdObj.toString());
            
            // Safely get date
            LocalDate date = LocalDate.now();
            if (request.containsKey("date") && request.get("date") != null) {
                date = LocalDate.parse(request.get("date").toString());
            }
            
            // Safely get checkInTime
            java.time.LocalTime checkInTime = java.time.LocalTime.now();
            if (request.containsKey("checkInTime") && request.get("checkInTime") != null) {
                checkInTime = java.time.LocalTime.parse(request.get("checkInTime").toString());
            }
            
            // Safely get shiftId
            Long shiftId = null;
            if (request.containsKey("shiftId") && request.get("shiftId") != null) {
                shiftId = Long.valueOf(request.get("shiftId").toString());
            }
            
            // Safely get latitude
            Double latitude = null;
            if (request.containsKey("latitude") && request.get("latitude") != null) {
                latitude = Double.valueOf(request.get("latitude").toString());
            }
            
            // Safely get longitude
            Double longitude = null;
            if (request.containsKey("longitude") && request.get("longitude") != null) {
                longitude = Double.valueOf(request.get("longitude").toString());
            }
            
            // Safely get location
            String location = null;
            if (request.containsKey("location") && request.get("location") != null) {
                location = request.get("location").toString();
            }
            
            // Safely get method
            String method = "WEB";
            if (request.containsKey("method") && request.get("method") != null) {
                method = request.get("method").toString();
            }
            
            // Get client IP address
            String ipAddress = getClientIpAddress(httpRequest);
            
<<<<<<< HEAD
            Attendance attendance = attendanceService.checkIn(employeeId.longValue(),
                date, checkInTime,
=======
            Attendance attendance = attendanceService.checkIn(employeeId, date, checkInTime, 
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                shiftId, latitude, longitude, location, ipAddress, method);
            response.put("success", true);
            response.put("message", "Check-in successful");
            response.put("attendance", attendance);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/check-out")
    public ResponseEntity<Map<String, Object>> checkOut(@RequestBody Map<String, Object> request,
                                                         HttpServletRequest httpRequest) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Safely get employeeId with null check
            Object employeeIdObj = request.get("employeeId");
            if (employeeIdObj == null) {
                response.put("success", false);
                response.put("message", "Employee ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            Long employeeId = Long.valueOf(employeeIdObj.toString());
            
            // Safely get date
            LocalDate date = LocalDate.now();
            if (request.containsKey("date") && request.get("date") != null) {
                date = LocalDate.parse(request.get("date").toString());
            }
            
            // Safely get checkOutTime
            java.time.LocalTime checkOutTime = java.time.LocalTime.now();
            if (request.containsKey("checkOutTime") && request.get("checkOutTime") != null) {
                checkOutTime = java.time.LocalTime.parse(request.get("checkOutTime").toString());
            }
            
            // Safely get latitude
            Double latitude = null;
            if (request.containsKey("latitude") && request.get("latitude") != null) {
                latitude = Double.valueOf(request.get("latitude").toString());
            }
            
            // Safely get longitude
            Double longitude = null;
            if (request.containsKey("longitude") && request.get("longitude") != null) {
                longitude = Double.valueOf(request.get("longitude").toString());
            }
            
            // Safely get location
            String location = null;
            if (request.containsKey("location") && request.get("location") != null) {
                location = request.get("location").toString();
            }
            
            // Safely get method
            String method = "WEB";
            if (request.containsKey("method") && request.get("method") != null) {
                method = request.get("method").toString();
            }
            
            // Get client IP address
            String ipAddress = getClientIpAddress(httpRequest);
            
<<<<<<< HEAD
            Attendance attendance = attendanceService.checkOut(employeeId.longValue(), date, checkOutTime,
=======
            Attendance attendance = attendanceService.checkOut(employeeId, date, checkOutTime, 
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                latitude, longitude, location, ipAddress, method);
            response.put("success", true);
            response.put("message", "Check-out successful");
            response.put("attendance", attendance);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Get client IP address from HttpServletRequest
     * Handles cases where request goes through proxy/load balancer
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        // If multiple IPs, take the first one
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress != null ? ipAddress : "Unknown";
    }

    @GetMapping("/employee/{employeeId}/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyHours(
<<<<<<< HEAD
            @PathVariable long employeeId,
=======
            @PathVariable Long employeeId, 
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        Map<String, Object> response = new HashMap<>();
        double weeklyHours = attendanceService.getWeeklyHours(employeeId, weekStart);
        response.put("weeklyHours", weeklyHours);
        response.put("weekStart", weekStart);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mark")
    public ResponseEntity<Attendance> markAttendance(@RequestBody Map<String, Object> request) {
        Long employeeId = Long.valueOf(request.get("employeeId").toString());
        LocalDate date = LocalDate.parse(request.get("date").toString());
        String status = request.get("status").toString();
        String checkIn = request.containsKey("checkIn") ? request.get("checkIn").toString() : null;
        String checkOut = request.containsKey("checkOut") ? request.get("checkOut").toString() : null;
        
<<<<<<< HEAD
        return ResponseEntity.ok(attendanceService.markAttendance(employeeId.longValue(), date, status, checkIn, checkOut));
    }
}
=======
        return ResponseEntity.ok(attendanceService.markAttendance(employeeId, date, status, checkIn, checkOut));
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
