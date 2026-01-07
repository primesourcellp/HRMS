package com.hrms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

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
    public ResponseEntity<List<PromotionHistory>> getPromotionsForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(promotionHistoryService.getPromotionsForEmployee(employeeId));
    }

    @PostMapping
    public ResponseEntity<PromotionHistory> createPromotion(@RequestBody PromotionHistory promotion) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionHistoryService.createPromotion(promotion));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromotionHistory> updatePromotion(@PathVariable Long id, @RequestBody PromotionHistory promotion) {
        return ResponseEntity.ok(promotionHistoryService.updatePromotion(id, promotion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePromotion(@PathVariable Long id) {
        try {
            promotionHistoryService.deletePromotion(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
