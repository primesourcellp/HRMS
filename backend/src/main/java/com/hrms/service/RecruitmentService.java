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

@Service
public class RecruitmentService {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    // Job Posting methods
    public JobPosting createJobPosting(JobPosting jobPosting) {
        if (jobPosting.getPostedDate() == null) {
            jobPosting.setPostedDate(LocalDate.now());
        }
        if (jobPosting.getStatus() == null) {
            jobPosting.setStatus("OPEN");
        }
        return jobPostingRepository.save(jobPosting);
    }

    public List<JobPosting> getAllJobPostings() {
        return jobPostingRepository.findAll();
    }

    public List<JobPosting> getOpenJobPostings() {
        return jobPostingRepository.findByStatus("OPEN");
    }

    public JobPosting updateJobPosting(@NonNull Long id, JobPosting jobDetails) {
        JobPosting jobPosting = jobPostingRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Job posting not found"));

        jobPosting.setTitle(jobDetails.getTitle());
        jobPosting.setDepartment(jobDetails.getDepartment());
        jobPosting.setPosition(jobDetails.getPosition());
        jobPosting.setJobType(jobDetails.getJobType());
        jobPosting.setExperienceRequired(jobDetails.getExperienceRequired());
        jobPosting.setDescription(jobDetails.getDescription());
        jobPosting.setRequirements(jobDetails.getRequirements());
        jobPosting.setClosingDate(jobDetails.getClosingDate());
        jobPosting.setStatus(jobDetails.getStatus());
        jobPosting.setNoOfVacancies(jobDetails.getNoOfVacancies());

        return jobPostingRepository.save(java.util.Objects.requireNonNull(jobPosting));
    }

    public void deleteJobPosting(@NonNull Long id) {
        jobPostingRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    // Applicant methods
    public Applicant createApplicant(Applicant applicant) {
        jobPostingRepository.findById(java.util.Objects.requireNonNull(applicant.getJobPostingId()))
                .orElseThrow(() -> new RuntimeException("Job posting not found"));

        if (applicant.getStatus() == null) {
            applicant.setStatus("APPLIED");
        }

        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public List<Applicant> getApplicantsByJobPosting(@NonNull Long jobPostingId) {
        return applicantRepository.findByJobPostingId(java.util.Objects.requireNonNull(jobPostingId));
    }

    public List<Applicant> getApplicantsByStatus(String status) {
        return applicantRepository.findByStatus(status);
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
        applicant.setStatus("INTERVIEWED");

        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public void deleteApplicant(@NonNull Long id) {
        applicantRepository.deleteById(java.util.Objects.requireNonNull(id));
    }
}
