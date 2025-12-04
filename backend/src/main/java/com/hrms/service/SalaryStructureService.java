package com.hrms.service;

import com.hrms.entity.SalaryStructure;
import com.hrms.entity.Employee;
import com.hrms.repository.SalaryStructureRepository;
import com.hrms.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SalaryStructureService {

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public SalaryStructure createSalaryStructure(SalaryStructure salaryStructure) {
        employeeRepository.findById(salaryStructure.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Deactivate previous salary structures
        Optional<SalaryStructure> existing = salaryStructureRepository
                .findByEmployeeIdAndActiveTrue(salaryStructure.getEmployeeId());
        if (existing.isPresent()) {
            SalaryStructure prev = existing.get();
            prev.setActive(false);
            prev.setEffectiveTo(LocalDate.now().minusDays(1));
            salaryStructureRepository.save(prev);
        }

        // Calculate gross and net salary
        calculateSalaries(salaryStructure);

        return salaryStructureRepository.save(salaryStructure);
    }

    public SalaryStructure updateSalaryStructure(Long id, SalaryStructure salaryDetails) {
        SalaryStructure salaryStructure = salaryStructureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary structure not found"));

        salaryStructure.setBasicSalary(salaryDetails.getBasicSalary());
        salaryStructure.setHra(salaryDetails.getHra());
        salaryStructure.setTransportAllowance(salaryDetails.getTransportAllowance());
        salaryStructure.setMedicalAllowance(salaryDetails.getMedicalAllowance());
        salaryStructure.setSpecialAllowance(salaryDetails.getSpecialAllowance());
        salaryStructure.setOtherAllowances(salaryDetails.getOtherAllowances());
        salaryStructure.setPf(salaryDetails.getPf());
        salaryStructure.setEsi(salaryDetails.getEsi());
        salaryStructure.setTds(salaryDetails.getTds());
        salaryStructure.setProfessionalTax(salaryDetails.getProfessionalTax());
        salaryStructure.setOtherDeductions(salaryDetails.getOtherDeductions());

        calculateSalaries(salaryStructure);

        return salaryStructureRepository.save(salaryStructure);
    }

    private void calculateSalaries(SalaryStructure salaryStructure) {
        // Calculate Gross Salary
        double gross = (salaryStructure.getBasicSalary() != null ? salaryStructure.getBasicSalary() : 0.0) +
                      (salaryStructure.getHra() != null ? salaryStructure.getHra() : 0.0) +
                      (salaryStructure.getTransportAllowance() != null ? salaryStructure.getTransportAllowance() : 0.0) +
                      (salaryStructure.getMedicalAllowance() != null ? salaryStructure.getMedicalAllowance() : 0.0) +
                      (salaryStructure.getSpecialAllowance() != null ? salaryStructure.getSpecialAllowance() : 0.0) +
                      (salaryStructure.getOtherAllowances() != null ? salaryStructure.getOtherAllowances() : 0.0);
        salaryStructure.setGrossSalary(gross);

        // Calculate Net Salary
        double deductions = (salaryStructure.getPf() != null ? salaryStructure.getPf() : 0.0) +
                           (salaryStructure.getEsi() != null ? salaryStructure.getEsi() : 0.0) +
                           (salaryStructure.getTds() != null ? salaryStructure.getTds() : 0.0) +
                           (salaryStructure.getProfessionalTax() != null ? salaryStructure.getProfessionalTax() : 0.0) +
                           (salaryStructure.getOtherDeductions() != null ? salaryStructure.getOtherDeductions() : 0.0);
        salaryStructure.setNetSalary(gross - deductions);
    }

    public Optional<SalaryStructure> getCurrentSalaryStructure(Long employeeId) {
        return salaryStructureRepository.findByEmployeeIdAndActiveTrue(employeeId);
    }

    public List<SalaryStructure> getEmployeeSalaryHistory(Long employeeId) {
        return salaryStructureRepository.findByEmployeeId(employeeId);
    }

    public void deleteSalaryStructure(Long id) {
        salaryStructureRepository.deleteById(id);
    }
}

