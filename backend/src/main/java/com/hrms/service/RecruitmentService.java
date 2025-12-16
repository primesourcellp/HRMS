package com.hrms.service;

import com.hrms.entity.JobPosting;
import com.hrms.entity.Applicant;
import com.hrms.repository.JobPostingRepository;
import com.hrms.repository.ApplicantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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

<<<<<<< HEAD
    public JobPosting updateJobPosting(@NonNull Long id, JobPosting jobDetails) {
        JobPosting jobPosting = jobPostingRepository.findById(java.util.Objects.requireNonNull(id))
=======
    public JobPosting updateJobPosting(Long id, JobPosting jobDetails) {
        JobPosting jobPosting = jobPostingRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
        return jobPostingRepository.save(java.util.Objects.requireNonNull(jobPosting));
    }

    public void deleteJobPosting(@NonNull Long id) {
        jobPostingRepository.deleteById(java.util.Objects.requireNonNull(id));
=======
        return jobPostingRepository.save(jobPosting);
    }

    public void deleteJobPosting(Long id) {
        jobPostingRepository.deleteById(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    // Applicant methods
    public Applicant createApplicant(Applicant applicant) {
<<<<<<< HEAD
        jobPostingRepository.findById(java.util.Objects.requireNonNull(applicant.getJobPostingId()))
=======
        jobPostingRepository.findById(applicant.getJobPostingId())
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Job posting not found"));

        if (applicant.getStatus() == null) {
            applicant.setStatus("APPLIED");
        }

<<<<<<< HEAD
        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public List<Applicant> getApplicantsByJobPosting(@NonNull Long jobPostingId) {
        return applicantRepository.findByJobPostingId(java.util.Objects.requireNonNull(jobPostingId));
=======
        return applicantRepository.save(applicant);
    }

    public List<Applicant> getApplicantsByJobPosting(Long jobPostingId) {
        return applicantRepository.findByJobPostingId(jobPostingId);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public List<Applicant> getApplicantsByStatus(String status) {
        return applicantRepository.findByStatus(status);
    }

<<<<<<< HEAD
    public Applicant updateApplicantStatus(@NonNull Long id, String status, String feedback) {
        Applicant applicant = applicantRepository.findById(java.util.Objects.requireNonNull(id))
=======
    public Applicant updateApplicantStatus(Long id, String status, String feedback) {
        Applicant applicant = applicantRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        applicant.setStatus(status);
        if (feedback != null) {
            applicant.setInterviewFeedback(feedback);
        }

<<<<<<< HEAD
        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public Applicant scheduleInterview(@NonNull Long id, LocalDate interviewDate) {
        Applicant applicant = applicantRepository.findById(java.util.Objects.requireNonNull(id))
=======
        return applicantRepository.save(applicant);
    }

    public Applicant scheduleInterview(Long id, LocalDate interviewDate) {
        Applicant applicant = applicantRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        applicant.setInterviewDate(interviewDate);
        applicant.setStatus("INTERVIEWED");

<<<<<<< HEAD
        return applicantRepository.save(java.util.Objects.requireNonNull(applicant));
    }

    public void deleteApplicant(@NonNull Long id) {
        applicantRepository.deleteById(java.util.Objects.requireNonNull(id));
    }
}
=======
        return applicantRepository.save(applicant);
    }

    public void deleteApplicant(Long id) {
        applicantRepository.deleteById(id);
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
