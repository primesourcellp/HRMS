package com.hrms.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.GratuityDTO;
import com.hrms.entity.Gratuity;
import com.hrms.mapper.DTOMapper;
import com.hrms.service.GratuityService;

@RestController
@RequestMapping("/api/gratuity")
@CrossOrigin(origins = "http://localhost:3000")
public class GratuityController {

    @Autowired
    private GratuityService gratuityService;

    @GetMapping
    public ResponseEntity<List<GratuityDTO>> getAllGratuities() {
        try {
            List<Gratuity> gratuities = gratuityService.getAllGratuities();
            return ResponseEntity.ok(DTOMapper.toGratuityDTOList(gratuities));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getGratuityById(@PathVariable @NonNull Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Gratuity gratuity = gratuityService.getGratuityById(Objects.requireNonNull(id))
                    .orElseThrow(() -> new RuntimeException("Gratuity not found"));
            response.put("success", true);
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<GratuityDTO>> getGratuitiesByEmployeeId(@PathVariable @NonNull Long employeeId) {
        try {
            List<Gratuity> gratuities = gratuityService.getGratuitiesByEmployeeId(Objects.requireNonNull(employeeId));
            return ResponseEntity.ok(DTOMapper.toGratuityDTOList(gratuities));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<GratuityDTO>> getGratuitiesByStatus(@PathVariable String status) {
        try {
            List<Gratuity> gratuities = gratuityService.getGratuitiesByStatus(status);
            return ResponseEntity.ok(DTOMapper.toGratuityDTOList(gratuities));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateGratuity(
            @RequestParam @NonNull Long employeeId,
            @RequestParam String exitDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (exitDate == null || exitDate.isBlank()) {
                throw new IllegalArgumentException("Exit date is required");
            }
            LocalDate exit = LocalDate.parse(exitDate);
            Gratuity gratuity = gratuityService.calculateGratuity(
                    Objects.requireNonNull(employeeId),
                    Objects.requireNonNull(exit));
            response.put("success", true);
            response.put("message", "Gratuity calculated successfully");
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createGratuity(@RequestBody GratuityDTO gratuityDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            Gratuity gratuity = gratuityService.createOrUpdateGratuity(gratuityDTO);
            response.put("success", true);
            response.put("message", "Gratuity created successfully");
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateGratuity(
            @PathVariable @NonNull Long id,
            @RequestBody GratuityDTO gratuityDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            gratuityDTO.setId(Objects.requireNonNull(id));
            Gratuity gratuity = gratuityService.createOrUpdateGratuity(gratuityDTO);
            response.put("success", true);
            response.put("message", "Gratuity updated successfully");
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveGratuity(
            @PathVariable @NonNull Long id,
            @RequestParam(required = false) Long approvedBy) {
        Map<String, Object> response = new HashMap<>();
        try {
            Gratuity gratuity = gratuityService.approveGratuity(Objects.requireNonNull(id), approvedBy);
            response.put("success", true);
            response.put("message", "Gratuity approved successfully");
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Map<String, Object>> markGratuityAsPaid(
            @PathVariable @NonNull Long id,
            @RequestParam(required = false) String paymentDate,
            @RequestParam(required = false) Long paidBy) {
        Map<String, Object> response = new HashMap<>();
        try {
            LocalDate payment = paymentDate != null ? LocalDate.parse(paymentDate) : null;
            Gratuity gratuity = gratuityService.markGratuityAsPaid(Objects.requireNonNull(id), payment, paidBy);
            response.put("success", true);
            response.put("message", "Gratuity marked as paid successfully");
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectGratuity(
            @PathVariable @NonNull Long id,
            @RequestParam String reason) {
        Map<String, Object> response = new HashMap<>();
        try {
            Gratuity gratuity = gratuityService.rejectGratuity(Objects.requireNonNull(id), reason);
            response.put("success", true);
            response.put("message", "Gratuity rejected successfully");
            response.put("gratuity", DTOMapper.toGratuityDTO(gratuity));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteGratuity(@PathVariable @NonNull Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            gratuityService.deleteGratuity(Objects.requireNonNull(id));
            response.put("success", true);
            response.put("message", "Gratuity deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    /**
     * Remove duplicate gratuity records
     */
    @PostMapping("/remove-duplicates")
    public ResponseEntity<Map<String, Object>> removeDuplicateGratuities() {
        Map<String, Object> response = new HashMap<>();
        try {
            int removed = gratuityService.removeDuplicateGratuities();
            response.put("success", true);
            response.put("message", "Removed " + removed + " duplicate gratuity record(s)");
            response.put("removedCount", removed);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error removing duplicates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

