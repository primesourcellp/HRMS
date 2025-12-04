package com.hrms.repository;

import com.hrms.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
    List<Applicant> findByJobPostingId(Long jobPostingId);
    List<Applicant> findByStatus(String status);
    List<Applicant> findByJobPostingIdAndStatus(Long jobPostingId, String status);
}

