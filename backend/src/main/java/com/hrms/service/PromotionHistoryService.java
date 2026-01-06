package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.PromotionHistory;
import com.hrms.repository.PromotionHistoryRepository;

@Service
public class PromotionHistoryService {
    @Autowired
    private PromotionHistoryRepository promotionHistoryRepository;

    public List<PromotionHistory> getPromotionsForEmployee(Long employeeId) {
        return promotionHistoryRepository.findByEmployeeIdOrderByEffectiveDateDesc(employeeId);
    }

    public PromotionHistory createPromotion(PromotionHistory promotion) {
        return promotionHistoryRepository.save(promotion);
    }

    public PromotionHistory updatePromotion(Long id, PromotionHistory promotion) {
        promotion.setId(id);
        return promotionHistoryRepository.save(promotion);
    }

    public void deletePromotion(Long id) {
        promotionHistoryRepository.deleteById(id);
    }

    public List<PromotionHistory> getAllPromotions() {
        return promotionHistoryRepository.findAll();
    }
}
