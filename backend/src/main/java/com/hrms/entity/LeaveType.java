package com.hrms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_types")
public class LeaveType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // CL, SL, PL, Maternity, Paternity, Unpaid Leave, Custom Leave

    @Column(name = "code", nullable = false, unique = true)
    private String code; // CL, SL, PL, MAT, PAT, UL, etc.

    @Column(name = "max_days")
    private Integer maxDays; // Maximum days allowed per year

    @Column(name = "carry_forward", nullable = false)
    private Boolean carryForward = false; // Can carry forward to next year

    @Column(name = "max_carry_forward")
    private Integer maxCarryForward; // Maximum days that can be carried forward

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean active = true;

    // Constructors
    public LeaveType() {
    }

    public LeaveType(Long id, String name, String code, Integer maxDays, Boolean carryForward, 
                    Integer maxCarryForward, String description, Boolean active) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.maxDays = maxDays;
        this.carryForward = carryForward != null ? carryForward : false;
        this.maxCarryForward = maxCarryForward;
        this.description = description;
        this.active = active != null ? active : true;
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

