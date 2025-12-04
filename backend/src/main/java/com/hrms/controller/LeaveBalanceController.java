package com.hrms.controller;

import com.hrms.entity.LeaveBalance;
import com.hrms.service.LeaveBalanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

