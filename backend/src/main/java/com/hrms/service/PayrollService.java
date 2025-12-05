package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.Payroll;
import com.hrms.repository.PayrollRepository;

@Service
public class PayrollService {
    @Autowired
    private PayrollRepository payrollRepository;

    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    public Optional<Payroll> getPayrollById(Long id) {
        return payrollRepository.findById(id);
    }

    public Payroll createPayroll(Payroll payroll) {
        // Calculate net amount
        double amount = payroll.getBaseSalary() + payroll.getAllowances() + payroll.getBonus() - payroll.getDeductions();
        payroll.setAmount(amount);
        return payrollRepository.save(payroll);
    }

    public List<Payroll> getPayrollsByEmployeeId(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
    }

    public List<Payroll> getPayrollsByMonth(String month) {
        return payrollRepository.findByMonth(month);
    }

    public Payroll generatePayroll(Long employeeId, String month, Integer year) {
        // This would typically fetch salary structure and calculate payroll
        // For now, creating a basic payroll entry
        Payroll payroll = new Payroll();
        payroll.setEmployeeId(employeeId);
        payroll.setMonth(month);
        payroll.setYear(year);
        payroll.setBaseSalary(0.0);
        payroll.setAllowances(0.0);
        payroll.setBonus(0.0);
        payroll.setDeductions(0.0);
        payroll.setAmount(0.0);
        payroll.setNetSalary(0.0);
        payroll.setStatus("PENDING");
        return payrollRepository.save(payroll);
    }
}

