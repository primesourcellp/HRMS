package com.hrms.controller;

import com.hrms.entity.Holiday;
import com.hrms.service.HolidayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
@CrossOrigin(origins = "http://localhost:3000")
public class HolidayController {

    @Autowired
    private HolidayService holidayService;

    @GetMapping
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<List<Holiday>> getHolidaysByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(holidayService.getHolidaysByYear(year));
    }

    @GetMapping("/between")
    public ResponseEntity<List<Holiday>> getHolidaysBetween(
            @RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(holidayService.getHolidaysBetweenDates(startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createHoliday(@RequestBody Holiday holiday) {
        Map<String, Object> response = new HashMap<>();
        try {
            Holiday created = holidayService.createHoliday(holiday);
            response.put("success", true);
            response.put("message", "Holiday created successfully");
            response.put("holiday", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateHoliday(@PathVariable Long id, @RequestBody Holiday holiday) {
        Map<String, Object> response = new HashMap<>();
        try {
            Holiday updated = holidayService.updateHoliday(id, holiday);
            response.put("success", true);
            response.put("message", "Holiday updated successfully");
            response.put("holiday", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteHoliday(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            holidayService.deleteHoliday(id);
            response.put("success", true);
            response.put("message", "Holiday deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

