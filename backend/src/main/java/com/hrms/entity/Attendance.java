package com.hrms.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "attendance")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String status; // Present, Absent

    @Column(name = "check_in")
    private LocalTime checkIn;

    @Column(name = "check_out")
    private LocalTime checkOut;

    @Column(name = "shift_id")
    private Long shiftId;

    @Column(name = "working_hours")
    private Double workingHours; // Calculated working hours

    @Column(name = "overtime_hours")
    private Double overtimeHours = 0.0;

    @Column(name = "undertime_hours")
    private Double undertimeHours = 0.0;

    @Column(name = "check_in_latitude")
    private Double checkInLatitude; // GPS coordinates

    @Column(name = "check_in_longitude")
    private Double checkInLongitude;

    @Column(name = "check_out_latitude")
    private Double checkOutLatitude;

    @Column(name = "check_out_longitude")
    private Double checkOutLongitude;

    @Column(name = "check_in_location")
    private String checkInLocation; // Address from GPS (optional, for mobile)

    @Column(name = "check_out_location")
    private String checkOutLocation;

    @Column(name = "check_in_ip_address")
    private String checkInIpAddress; // IP address for laptop/desktop tracking

    @Column(name = "check_out_ip_address")
    private String checkOutIpAddress;

    @Column(name = "check_in_method")
    private String checkInMethod; // WEB, MOBILE, BIOMETRIC

    @Column(name = "check_out_method")
    private String checkOutMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Shift shift;

    // Constructors
    public Attendance() {
    }

    public Attendance(Long id, Long employeeId, LocalDate date, String status, 
                     LocalTime checkIn, LocalTime checkOut, Long shiftId, Double workingHours,
                     Double overtimeHours, Double undertimeHours, Double checkInLatitude,
                     Double checkInLongitude, Double checkOutLatitude, Double checkOutLongitude,
                     String checkInLocation, String checkOutLocation, String checkInIpAddress,
                     String checkOutIpAddress, String checkInMethod, String checkOutMethod, 
                     Employee employee, Shift shift) {
        this.id = id;
        this.employeeId = employeeId;
        this.date = date;
        this.status = status;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.shiftId = shiftId;
        this.workingHours = workingHours;
        this.overtimeHours = overtimeHours != null ? overtimeHours : 0.0;
        this.undertimeHours = undertimeHours != null ? undertimeHours : 0.0;
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
        this.employee = employee;
        this.shift = shift;
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

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Shift getShift() {
        return shift;
    }

    public void setShift(Shift shift) {
        this.shift = shift;
    }
}
