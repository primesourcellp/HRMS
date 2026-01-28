package com.hrms.controller;

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
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.PromotionHistory;
import com.hrms.service.PromotionHistoryService;

@RestController
@RequestMapping("/api/promotions")
@CrossOrigin(origins = "http://localhost:3000")
public class PromotionHistoryController {
    @Autowired
    private PromotionHistoryService promotionHistoryService;

    @GetMapping
    public ResponseEntity<List<PromotionHistory>> getAllPromotions() {
        return ResponseEntity.ok(promotionHistoryService.getAllPromotions());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PromotionHistory>> getPromotionsForEmployee(@PathVariable @NonNull Long employeeId) {
        return ResponseEntity.ok(
            promotionHistoryService.getPromotionsForEmployee(Objects.requireNonNull(employeeId))
        );
    }

    @PostMapping
    public ResponseEntity<?> createPromotion(@RequestBody PromotionHistory promotion) {
        try {
            PromotionHistory created = promotionHistoryService.createPromotion(Objects.requireNonNull(promotion));
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePromotion(@PathVariable @NonNull Long id,
                                             @RequestBody PromotionHistory promotion) {
        try {
            PromotionHistory updated = promotionHistoryService.updatePromotion(
                    Objects.requireNonNull(id),
                    Objects.requireNonNull(promotion)
            );
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePromotion(@PathVariable @NonNull Long id) {
        try {
            promotionHistoryService.deletePromotion(Objects.requireNonNull(id));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
