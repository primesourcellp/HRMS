package com.hrms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
public class Holiday {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "is_national", nullable = false)
    private Boolean isNational = true; // National holiday or regional

    @Column(columnDefinition = "TEXT")
    private String description;

    // Constructors
    public Holiday() {
    }

    public Holiday(Long id, String name, LocalDate date, Integer year, Boolean isNational, String description) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.year = year;
        this.isNational = isNational != null ? isNational : true;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Boolean getIsNational() {
        return isNational;
    }

    public void setIsNational(Boolean isNational) {
        this.isNational = isNational;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

