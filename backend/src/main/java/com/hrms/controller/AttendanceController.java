package com.hrms.controller;

import com.hrms.entity.Attendance;
import com.hrms.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:3000")
public class AttendanceController {
    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attendance> getAttendanceById(@PathVariable Long id) {
        return attendanceService.getAttendanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Attendance>> getAttendanceByDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Attendance>> getAttendanceByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployeeId(employeeId));
    }

    @PostMapping("/check-in")
    public ResponseEntity<Map<String, Object>> checkIn(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            LocalDate date = request.containsKey("date") ? 
                LocalDate.parse(request.get("date").toString()) : LocalDate.now();
            java.time.LocalTime checkInTime = request.containsKey("checkInTime") ?
                java.time.LocalTime.parse(request.get("checkInTime").toString()) : java.time.LocalTime.now();
            Long shiftId = request.containsKey("shiftId") ? 
                Long.valueOf(request.get("shiftId").toString()) : null;
            Double latitude = request.containsKey("latitude") ? 
                Double.valueOf(request.get("latitude").toString()) : null;
            Double longitude = request.containsKey("longitude") ? 
                Double.valueOf(request.get("longitude").toString()) : null;
            String location = request.containsKey("location") ? 
                request.get("location").toString() : null;
            String method = request.containsKey("method") ? 
                request.get("method").toString() : "WEB";
            
            Attendance attendance = attendanceService.checkIn(employeeId, date, checkInTime, 
                shiftId, latitude, longitude, location, method);
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
    public ResponseEntity<Map<String, Object>> checkOut(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            LocalDate date = request.containsKey("date") ? 
                LocalDate.parse(request.get("date").toString()) : LocalDate.now();
            java.time.LocalTime checkOutTime = request.containsKey("checkOutTime") ?
                java.time.LocalTime.parse(request.get("checkOutTime").toString()) : java.time.LocalTime.now();
            Double latitude = request.containsKey("latitude") ? 
                Double.valueOf(request.get("latitude").toString()) : null;
            Double longitude = request.containsKey("longitude") ? 
                Double.valueOf(request.get("longitude").toString()) : null;
            String location = request.containsKey("location") ? 
                request.get("location").toString() : null;
            String method = request.containsKey("method") ? 
                request.get("method").toString() : "WEB";
            
            Attendance attendance = attendanceService.checkOut(employeeId, date, checkOutTime, 
                latitude, longitude, location, method);
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

    @GetMapping("/employee/{employeeId}/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyHours(
            @PathVariable Long employeeId, 
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
        
        return ResponseEntity.ok(attendanceService.markAttendance(employeeId, date, status, checkIn, checkOut));
    }
}

