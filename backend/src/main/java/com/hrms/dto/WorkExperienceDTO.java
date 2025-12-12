package com.hrms.dto;

public class WorkExperienceDTO {
    private Long id;
    private String companyName;
    private String jobTitle;
    private String fromDate;
    private String toDate;
    private String jobDescription;
    private boolean relevant;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getFromDate() { return fromDate; }
    public void setFromDate(String fromDate) { this.fromDate = fromDate; }
    public String getToDate() { return toDate; }
    public void setToDate(String toDate) { this.toDate = toDate; }
    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }
    public boolean isRelevant() { return relevant; }
    public void setRelevant(boolean relevant) { this.relevant = relevant; }
}
