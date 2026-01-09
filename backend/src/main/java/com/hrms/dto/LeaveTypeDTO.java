package com.hrms.dto;

public class LeaveTypeDTO {
    private Long id;
    private String name;
    private String code;
    private Integer maxDays;
    private Boolean carryForward;
    private Integer maxCarryForward;
    private Boolean monthlyLeave;
    private String description;
    private Boolean active;

    // Constructors
    public LeaveTypeDTO() {
    }

    public LeaveTypeDTO(Long id, String name, String code, Integer maxDays,
                       Boolean carryForward, Integer maxCarryForward, Boolean monthlyLeave, String description, Boolean active) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.maxDays = maxDays;
        this.carryForward = carryForward;
        this.maxCarryForward = maxCarryForward;
        this.monthlyLeave = monthlyLeave;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Integer getMaxDays() {
        return maxDays;
    }

    public void setMaxDays(Integer maxDays) {
        this.maxDays = maxDays;
    }

    public Boolean getCarryForward() {
        return carryForward;
    }

    public void setCarryForward(Boolean carryForward) {
        this.carryForward = carryForward;
    }

    public Integer getMaxCarryForward() {
        return maxCarryForward;
    }

    public void setMaxCarryForward(Integer maxCarryForward) {
        this.maxCarryForward = maxCarryForward;
    }

    public Boolean getMonthlyLeave() {
        return monthlyLeave;
    }

    public void setMonthlyLeave(Boolean monthlyLeave) {
        this.monthlyLeave = monthlyLeave;
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

