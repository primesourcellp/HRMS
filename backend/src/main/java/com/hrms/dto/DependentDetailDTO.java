package com.hrms.dto;

public class DependentDetailDTO {
    private Long id;
    private String dependentName;
    private String relationship;
    private String dateOfBirth;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDependentName() { return dependentName; }
    public void setDependentName(String dependentName) { this.dependentName = dependentName; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
}
