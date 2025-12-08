package com.hrms.dto;

import java.time.LocalDate;

public class HolidayDTO {
    private Long id;
    private String name;
    private LocalDate date;
    private Integer year;
    private Boolean isNational;
    private String description;

    // Constructors
    public HolidayDTO() {
    }

    public HolidayDTO(Long id, String name, LocalDate date, Integer year, Boolean isNational, String description) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.year = year;
        this.isNational = isNational;
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

