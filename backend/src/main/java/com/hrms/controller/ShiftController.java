package com.hrms.controller;

import com.hrms.entity.Shift;
import com.hrms.service.ShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
import java.util.Objects;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shifts")
@CrossOrigin(origins = "http://localhost:3000")
public class ShiftController {

    @Autowired
    private ShiftService shiftService;

    @GetMapping
    public ResponseEntity<List<Shift>> getAllShifts() {
        return ResponseEntity.ok(shiftService.getAllShifts());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Shift>> getActiveShifts() {
        return ResponseEntity.ok(shiftService.getActiveShifts());
    }

    @GetMapping("/{id}")
<<<<<<< HEAD
    public ResponseEntity<Shift> getShiftById(@PathVariable @NonNull Long id) {
        return shiftService.getShiftById(Objects.requireNonNull(id))
=======
    public ResponseEntity<Shift> getShiftById(@PathVariable Long id) {
        return shiftService.getShiftById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createShift(@RequestBody Shift shift) {
        Map<String, Object> response = new HashMap<>();
        try {
            Shift created = shiftService.createShift(shift);
            response.put("success", true);
            response.put("message", "Shift created successfully");
            response.put("shift", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> updateShift(@PathVariable long id, @RequestBody Shift shift) {
        Map<String, Object> response = new HashMap<>();
        try {
            Shift updated = shiftService.updateShift(Objects.requireNonNull(id), shift);
=======
    public ResponseEntity<Map<String, Object>> updateShift(@PathVariable Long id, @RequestBody Shift shift) {
        Map<String, Object> response = new HashMap<>();
        try {
            Shift updated = shiftService.updateShift(id, shift);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            response.put("success", true);
            response.put("message", "Shift updated successfully");
            response.put("shift", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> deleteShift(@PathVariable long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            shiftService.deleteShift(Objects.requireNonNull(id));
=======
    public ResponseEntity<Map<String, Object>> deleteShift(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            shiftService.deleteShift(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            response.put("success", true);
            response.put("message", "Shift deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
