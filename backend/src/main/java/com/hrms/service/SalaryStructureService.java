package com.hrms.service;

import com.hrms.entity.SalaryStructure;
<<<<<<< HEAD
=======
import com.hrms.entity.Employee;
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
import com.hrms.repository.SalaryStructureRepository;
import com.hrms.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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
<<<<<<< HEAD
        employeeRepository.findById(java.util.Objects.requireNonNull(salaryStructure.getEmployeeId()))
=======
        employeeRepository.findById(salaryStructure.getEmployeeId())
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Deactivate previous salary structures
        Optional<SalaryStructure> existing = salaryStructureRepository
<<<<<<< HEAD
                .findByEmployeeIdAndActiveTrue(java.util.Objects.requireNonNull(salaryStructure.getEmployeeId()));
=======
                .findByEmployeeIdAndActiveTrue(salaryStructure.getEmployeeId());
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        if (existing.isPresent()) {
            SalaryStructure prev = existing.get();
            prev.setActive(false);
            prev.setEffectiveTo(LocalDate.now().minusDays(1));
<<<<<<< HEAD
            salaryStructureRepository.save(java.util.Objects.requireNonNull(prev));
=======
            salaryStructureRepository.save(prev);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        }

        // Calculate gross and net salary
        calculateSalaries(salaryStructure);

<<<<<<< HEAD
        return salaryStructureRepository.save(java.util.Objects.requireNonNull(salaryStructure));
    }

    public SalaryStructure updateSalaryStructure(@NonNull Long id, SalaryStructure salaryDetails) {
        SalaryStructure salaryStructure = salaryStructureRepository.findById(java.util.Objects.requireNonNull(id))
=======
        return salaryStructureRepository.save(salaryStructure);
    }

    public SalaryStructure updateSalaryStructure(Long id, SalaryStructure salaryDetails) {
        SalaryStructure salaryStructure = salaryStructureRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
        return salaryStructureRepository.save(java.util.Objects.requireNonNull(salaryStructure));
=======
        return salaryStructureRepository.save(salaryStructure);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
    public Optional<SalaryStructure> getCurrentSalaryStructure(@NonNull Long employeeId) {
        return salaryStructureRepository.findByEmployeeIdAndActiveTrue(java.util.Objects.requireNonNull(employeeId));
    }

    public List<SalaryStructure> getEmployeeSalaryHistory(@NonNull Long employeeId) {
        return salaryStructureRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
    }

    public void deleteSalaryStructure(@NonNull Long id) {
        salaryStructureRepository.deleteById(java.util.Objects.requireNonNull(id));
    }
}
=======
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

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
