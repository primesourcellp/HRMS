package com.hrms.controller;

import java.util.List;

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
    public ResponseEntity<List<LeaveBalance>> getEmployeeLeaveBalances(
            @PathVariable Long employeeId, @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(leaveBalanceService.getEmployeeLeaveBalances(employeeId, year));
    }

    @PostMapping("/carry-forward")
    public ResponseEntity<String> carryForwardLeaves(
            @RequestParam Long employeeId,
            @RequestParam Integer fromYear,
            @RequestParam Integer toYear) {
        leaveBalanceService.carryForwardLeaves(employeeId, fromYear, toYear);
        return ResponseEntity.ok("Leave carry forward completed");
    }
}

