package com.hrms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.LeaveBalance;
import com.hrms.service.LeaveBalanceService;

@RestController
@RequestMapping("/api/leave-balances")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveBalanceController {

    @Autowired
    private LeaveBalanceService leaveBalanceService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeLeaveBalances(
            @PathVariable Long employeeId, @RequestParam(required = false) Integer year) {
        try {
            return ResponseEntity.ok(leaveBalanceService.getEmployeeLeaveBalances(employeeId, year));
        } catch (Exception e) {
            System.err.println("Error fetching leave balances: " + e.getMessage());
            return ResponseEntity.status(500).body("Error fetching leave balances: " + e.getMessage());
        }
    }

    @PostMapping("/carry-forward")
    public ResponseEntity<String> carryForwardLeaves(
            @RequestParam Long employeeId,
            @RequestParam Integer fromYear,
            @RequestParam Integer toYear) {
        leaveBalanceService.carryForwardLeaves(employeeId, fromYear, toYear);
        return ResponseEntity.ok("Leave carry forward completed");
    }

    @PostMapping("/initialize/{employeeId}")
    public ResponseEntity<?> initializeLeaveBalances(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year) {
        try {
            if (year == null) {
                year = java.time.LocalDate.now().getYear();
            }
            return ResponseEntity.ok(leaveBalanceService.initializeLeaveBalances(employeeId, year));
        } catch (Exception e) {
            System.err.println("Error initializing leave balances: " + e.getMessage());
            return ResponseEntity.status(500).body("Error initializing leave balances: " + e.getMessage());
        }
    }

    @PostMapping("/assign")
    public ResponseEntity<LeaveBalance> assignLeaveBalance(
            @RequestParam Long employeeId,
            @RequestParam Long leaveTypeId,
            @RequestParam Double totalDays,
            @RequestParam(required = false) Integer year) {
        if (year == null) {
            year = java.time.LocalDate.now().getYear();
        }
        return ResponseEntity.ok(leaveBalanceService.assignLeaveBalance(employeeId, leaveTypeId, year, totalDays));
    }
}

