package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.hrms.entity.PromotionHistory;
import com.hrms.repository.PromotionHistoryRepository;

@Service
public class PromotionHistoryService {
    @Autowired
    private PromotionHistoryRepository promotionHistoryRepository;

    public List<PromotionHistory> getPromotionsForEmployee(@NonNull Long employeeId) {
        return promotionHistoryRepository.findByEmployeeIdOrderByEffectiveDateDesc(
                java.util.Objects.requireNonNull(employeeId));
    }

    public PromotionHistory createPromotion(@NonNull PromotionHistory promotion) {
        return promotionHistoryRepository.save(java.util.Objects.requireNonNull(promotion));
    }

    public PromotionHistory updatePromotion(@NonNull Long id, @NonNull PromotionHistory promotion) {
        promotion.setId(java.util.Objects.requireNonNull(id));
        return promotionHistoryRepository.save(java.util.Objects.requireNonNull(promotion));
    }

    public void deletePromotion(@NonNull Long id) {
        promotionHistoryRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public List<PromotionHistory> getAllPromotions() {
        return promotionHistoryRepository.findAll();
    }
}
