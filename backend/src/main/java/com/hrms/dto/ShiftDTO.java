package com.hrms.dto;

import java.time.LocalTime;

public class ShiftDTO {
    private Long id;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer breakDuration;
    private Double workingHours;
    private String description;
    private Boolean active;

    // Constructors
    public ShiftDTO() {
    }

    public ShiftDTO(Long id, String name, LocalTime startTime, LocalTime endTime,
                   Integer breakDuration, Double workingHours, String description, Boolean active) {
        this.id = id;
        this.name = name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.breakDuration = breakDuration;
        this.workingHours = workingHours;
        this.description = description;
        this.active = active;
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

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Integer getBreakDuration() {
        return breakDuration;
    }

    public void setBreakDuration(Integer breakDuration) {
        this.breakDuration = breakDuration;
    }

    public Double getWorkingHours() {
        return workingHours;
    }

    public void setWorkingHours(Double workingHours) {
        this.workingHours = workingHours;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}

