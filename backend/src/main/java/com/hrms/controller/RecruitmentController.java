package com.hrms.controller;

import com.hrms.entity.JobPosting;
import com.hrms.entity.Applicant;
import com.hrms.service.RecruitmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
import java.util.Objects;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recruitment")
@CrossOrigin(origins = "http://localhost:3000")
public class RecruitmentController {

    @Autowired
    private RecruitmentService recruitmentService;

    // Job Posting endpoints
    @GetMapping("/jobs")
    public ResponseEntity<List<JobPosting>> getAllJobPostings() {
        return ResponseEntity.ok(recruitmentService.getAllJobPostings());
    }

    @GetMapping("/jobs/open")
    public ResponseEntity<List<JobPosting>> getOpenJobPostings() {
        return ResponseEntity.ok(recruitmentService.getOpenJobPostings());
    }

    @PostMapping("/jobs")
    public ResponseEntity<Map<String, Object>> createJobPosting(@RequestBody JobPosting jobPosting) {
        Map<String, Object> response = new HashMap<>();
        try {
            JobPosting created = recruitmentService.createJobPosting(jobPosting);
            response.put("success", true);
            response.put("message", "Job posting created successfully");
            response.put("jobPosting", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/jobs/{id}")
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> updateJobPosting(@PathVariable @NonNull Long id, @RequestBody JobPosting jobPosting) {
        Map<String, Object> response = new HashMap<>();
        try {
            JobPosting updated = recruitmentService.updateJobPosting(Objects.requireNonNull(id), jobPosting);
=======
    public ResponseEntity<Map<String, Object>> updateJobPosting(@PathVariable Long id, @RequestBody JobPosting jobPosting) {
        Map<String, Object> response = new HashMap<>();
        try {
            JobPosting updated = recruitmentService.updateJobPosting(id, jobPosting);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            response.put("success", true);
            response.put("message", "Job posting updated successfully");
            response.put("jobPosting", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/jobs/{id}")
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> deleteJobPosting(@PathVariable @NonNull Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            recruitmentService.deleteJobPosting(Objects.requireNonNull(id));
=======
    public ResponseEntity<Map<String, Object>> deleteJobPosting(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            recruitmentService.deleteJobPosting(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            response.put("success", true);
            response.put("message", "Job posting deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // Applicant endpoints
    @GetMapping("/applicants/job/{jobPostingId}")
<<<<<<< HEAD
    public ResponseEntity<List<Applicant>> getApplicantsByJobPosting(@PathVariable @NonNull Long jobPostingId) {
        return ResponseEntity.ok(recruitmentService.getApplicantsByJobPosting(Objects.requireNonNull(jobPostingId)));
=======
    public ResponseEntity<List<Applicant>> getApplicantsByJobPosting(@PathVariable Long jobPostingId) {
        return ResponseEntity.ok(recruitmentService.getApplicantsByJobPosting(jobPostingId));
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    @GetMapping("/applicants/status/{status}")
    public ResponseEntity<List<Applicant>> getApplicantsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(recruitmentService.getApplicantsByStatus(status));
    }

    @PostMapping("/applicants")
    public ResponseEntity<Map<String, Object>> createApplicant(@RequestBody Applicant applicant) {
        Map<String, Object> response = new HashMap<>();
        try {
            Applicant created = recruitmentService.createApplicant(applicant);
            response.put("success", true);
            response.put("message", "Application submitted successfully");
            response.put("applicant", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/applicants/{id}/status")
    public ResponseEntity<Map<String, Object>> updateApplicantStatus(
<<<<<<< HEAD
            @PathVariable @NonNull Long id,
=======
            @PathVariable Long id,
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Applicant updated = recruitmentService.updateApplicantStatus(
<<<<<<< HEAD
                Objects.requireNonNull(id), request.get("status"), request.get("feedback"));
=======
                id, request.get("status"), request.get("feedback"));
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            response.put("success", true);
            response.put("message", "Applicant status updated successfully");
            response.put("applicant", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/applicants/{id}/interview")
    public ResponseEntity<Map<String, Object>> scheduleInterview(
<<<<<<< HEAD
            @PathVariable @NonNull Long id, @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            LocalDate interviewDate = LocalDate.parse(request.get("interviewDate"));
            Applicant updated = recruitmentService.scheduleInterview(Objects.requireNonNull(id), interviewDate);
=======
            @PathVariable Long id, @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            LocalDate interviewDate = LocalDate.parse(request.get("interviewDate"));
            Applicant updated = recruitmentService.scheduleInterview(id, interviewDate);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            response.put("success", true);
            response.put("message", "Interview scheduled successfully");
            response.put("applicant", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
