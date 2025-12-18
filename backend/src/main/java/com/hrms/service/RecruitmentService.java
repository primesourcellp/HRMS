package com.hrms.service;

import com.hrms.entity.JobPosting;
import com.hrms.entity.Applicant;
import com.hrms.repository.JobPostingRepository;
import com.hrms.repository.ApplicantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class RecruitmentService {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    // Job Posting methods
    public List<JobPosting> getAllJobPostings() {
        return jobPostingRepository.findAll();
    }

    public List<JobPosting> getOpenJobPostings() {
        return jobPostingRepository.findByStatus("OPEN");
    }

    public JobPosting createJobPosting(JobPosting jobPosting) {
        return jobPostingRepository.save(java.util.Objects.requireNonNull(jobPosting));
    }

    public JobPosting updateJobPosting(@NonNull Long id, JobPosting jobPostingDetails) {
        JobPosting jobPosting = jobPostingRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Job posting not found"));

        jobPosting.setTitle(jobPostingDetails.getTitle());
        jobPosting.setDescription(jobPostingDetails.getDescription());
        jobPosting.setDepartment(jobPostingDetails.getDepartment());
        jobPosting.setPosition(jobPostingDetails.getPosition());
        jobPosting.setJobType(jobPostingDetails.getJobType());
        jobPosting.setExperienceRequired(jobPostingDetails.getExperienceRequired());
        jobPosting.setStatus(jobPostingDetails.getStatus());
        jobPosting.setRequirements(jobPostingDetails.getRequirements());
        jobPosting.setPostedDate(jobPostingDetails.getPostedDate());
        jobPosting.setClosingDate(jobPostingDetails.getClosingDate());
        jobPosting.setNoOfVacancies(jobPostingDetails.getNoOfVacancies());

        return jobPostingRepository.save(java.util.Objects.requireNonNull(jobPosting));
    }

    public void deleteJobPosting(@NonNull Long id) {
        jobPostingRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    // Applicant methods
    public List<Applicant> getApplicantsByJobPosting(@NonNull Long jobPostingId) {
        return applicantRepository.findByJobPostingId(java.util.Objects.requireNonNull(jobPostingId));
    }

    public List<Applicant> getApplicantsByStatus(String status) {
        return applicantRepository.findByStatus(status);
    }

    public Applicant createApplicant(Applicant applicant) {
        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public Applicant updateApplicantStatus(@NonNull Long id, String status, String feedback) {
        Applicant applicant = applicantRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        applicant.setStatus(status);
        if (feedback != null) {
            applicant.setInterviewFeedback(feedback);
        }

        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public Applicant scheduleInterview(@NonNull Long id, LocalDate interviewDate) {
        Applicant applicant = applicantRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        applicant.setInterviewDate(interviewDate);
        applicant.setStatus("INTERVIEW_SCHEDULED");

        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }
}

