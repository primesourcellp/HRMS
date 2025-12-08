package com.hrms.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AttendanceDTO {
    private Long id;
    private Long employeeId;
    private LocalDate date;
    private String status;
    private LocalTime checkIn;
    private LocalTime checkOut;
    private Long shiftId;
    private Double workingHours;
    private Double overtimeHours;
    private Double undertimeHours;
    private Double checkInLatitude;
    private Double checkInLongitude;
    private Double checkOutLatitude;
    private Double checkOutLongitude;
    private String checkInLocation;
    private String checkOutLocation;
    private String checkInIpAddress;
    private String checkOutIpAddress;
    private String checkInMethod;
    private String checkOutMethod;

    // Constructors
    public AttendanceDTO() {
    }

    public AttendanceDTO(Long id, Long employeeId, LocalDate date, String status,
                        LocalTime checkIn, LocalTime checkOut, Long shiftId, Double workingHours,
                        Double overtimeHours, Double undertimeHours, Double checkInLatitude,
                        Double checkInLongitude, Double checkOutLatitude, Double checkOutLongitude,
                        String checkInLocation, String checkOutLocation, String checkInIpAddress,
                        String checkOutIpAddress, String checkInMethod, String checkOutMethod) {
        this.id = id;
        this.employeeId = employeeId;
        this.date = date;
        this.status = status;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.shiftId = shiftId;
        this.workingHours = workingHours;
        this.overtimeHours = overtimeHours;
        this.undertimeHours = undertimeHours;
        this.checkInLatitude = checkInLatitude;
        this.checkInLongitude = checkInLongitude;
        this.checkOutLatitude = checkOutLatitude;
        this.checkOutLongitude = checkOutLongitude;
        this.checkInLocation = checkInLocation;
        this.checkOutLocation = checkOutLocation;
        this.checkInIpAddress = checkInIpAddress;
        this.checkOutIpAddress = checkOutIpAddress;
        this.checkInMethod = checkInMethod;
        this.checkOutMethod = checkOutMethod;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalTime getCheckIn() {
        return checkIn;
    }

    public void setCheckIn(LocalTime checkIn) {
        this.checkIn = checkIn;
    }

    public LocalTime getCheckOut() {
        return checkOut;
    }

    public void setCheckOut(LocalTime checkOut) {
        this.checkOut = checkOut;
    }

    public Long getShiftId() {
        return shiftId;
    }

    public void setShiftId(Long shiftId) {
        this.shiftId = shiftId;
    }

    public Double getWorkingHours() {
        return workingHours;
    }

    public void setWorkingHours(Double workingHours) {
        this.workingHours = workingHours;
    }

    public Double getOvertimeHours() {
        return overtimeHours;
    }

    public void setOvertimeHours(Double overtimeHours) {
        this.overtimeHours = overtimeHours;
    }

    public Double getUndertimeHours() {
        return undertimeHours;
    }

    public void setUndertimeHours(Double undertimeHours) {
        this.undertimeHours = undertimeHours;
    }

    public Double getCheckInLatitude() {
        return checkInLatitude;
    }

    public void setCheckInLatitude(Double checkInLatitude) {
        this.checkInLatitude = checkInLatitude;
    }

    public Double getCheckInLongitude() {
        return checkInLongitude;
    }

    public void setCheckInLongitude(Double checkInLongitude) {
        this.checkInLongitude = checkInLongitude;
    }

    public Double getCheckOutLatitude() {
        return checkOutLatitude;
    }

    public void setCheckOutLatitude(Double checkOutLatitude) {
        this.checkOutLatitude = checkOutLatitude;
    }

    public Double getCheckOutLongitude() {
        return checkOutLongitude;
    }

    public void setCheckOutLongitude(Double checkOutLongitude) {
        this.checkOutLongitude = checkOutLongitude;
    }

    public String getCheckInLocation() {
        return checkInLocation;
    }

    public void setCheckInLocation(String checkInLocation) {
        this.checkInLocation = checkInLocation;
    }

    public String getCheckOutLocation() {
        return checkOutLocation;
    }

    public void setCheckOutLocation(String checkOutLocation) {
        this.checkOutLocation = checkOutLocation;
    }

    public String getCheckInIpAddress() {
        return checkInIpAddress;
    }

    public void setCheckInIpAddress(String checkInIpAddress) {
        this.checkInIpAddress = checkInIpAddress;
    }

    public String getCheckOutIpAddress() {
        return checkOutIpAddress;
    }

    public void setCheckOutIpAddress(String checkOutIpAddress) {
        this.checkOutIpAddress = checkOutIpAddress;
    }

    public String getCheckInMethod() {
        return checkInMethod;
    }

    public void setCheckInMethod(String checkInMethod) {
        this.checkInMethod = checkInMethod;
    }

    public String getCheckOutMethod() {
        return checkOutMethod;
    }

    public void setCheckOutMethod(String checkOutMethod) {
        this.checkOutMethod = checkOutMethod;
    }
}

