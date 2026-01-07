package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "dependent_details")
public class DependentDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dependentName;
    private String relationship;
    private LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    @JsonIgnore
    private User employee;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDependentName() { return dependentName; }
    public void setDependentName(String dependentName) { this.dependentName = dependentName; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }
}
