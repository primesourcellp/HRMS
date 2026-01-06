package com.hrms.repository;

import com.hrms.entity.CTCTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CTCTemplateRepository extends JpaRepository<CTCTemplate, Long> {
    List<CTCTemplate> findByClientName(String clientName);
    List<CTCTemplate> findByActiveTrue();
    Optional<CTCTemplate> findByIdAndActiveTrue(Long id);
    List<CTCTemplate> findByClientNameAndActiveTrue(String clientName);
    List<CTCTemplate> findByTemplateNameContainingIgnoreCase(String templateName);
}

