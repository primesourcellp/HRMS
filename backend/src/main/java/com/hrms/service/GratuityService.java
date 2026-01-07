package com.hrms.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.GratuityDTO;
import com.hrms.entity.Employee;
import com.hrms.entity.Gratuity;
import com.hrms.entity.SalaryStructure;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.GratuityRepository;
import com.hrms.repository.SalaryStructureRepository;

@Service
public class GratuityService {
    
    private static final double MAX_GRATUITY_AMOUNT = 2000000.0; // ₹20 lakhs maximum cap
    
    @Autowired
    private GratuityRepository gratuityRepository;
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private SalaryStructureRepository salaryStructureRepository;
    
    /**
     * Calculate gratuity for an employee
     * Formula: (Last drawn salary × 15/26) × Years of service
     * Maximum cap: ₹20 lakhs
     */
    public Gratuity calculateGratuity(@NonNull Long employeeId, @NonNull LocalDate exitDate) {
        Employee employee = employeeRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        LocalDate dateOfJoining = employee.getDateOfJoining();
        if (dateOfJoining == null) {
            throw new RuntimeException("Employee date of joining is not set");
        }
        
        // Calculate years of service
        long daysOfService = ChronoUnit.DAYS.between(dateOfJoining, exitDate);
        double yearsOfService = daysOfService / 365.25; // Account for leap years
        
        // Allow any years of service (no minimum requirement)
        
        // Get last drawn salary (Basic Salary + DA if applicable)
        // For now, we'll use the active salary structure's basic salary
        Optional<SalaryStructure> salaryOpt = salaryStructureRepository.findByEmployeeIdAndActiveTrue(employeeId);
        double lastDrawnSalary = 0.0;
        
        if (salaryOpt.isPresent()) {
            SalaryStructure salary = salaryOpt.get();
            // Last drawn salary = Basic Salary (DA is typically part of basic or separate)
            // In India, DA (Dearness Allowance) is often added to basic for gratuity calculation
            lastDrawnSalary = salary.getBasicSalary() != null ? salary.getBasicSalary() : 0.0;
            // If there's a DA component, add it here
            // For now, using basic salary only
        } else {
            // Fallback to employee's salary field if salary structure not found
            lastDrawnSalary = employee.getSalary() != null ? employee.getSalary() : 0.0;
        }
        
        if (lastDrawnSalary <= 0) {
            throw new RuntimeException("Last drawn salary is not available or invalid");
        }
        
        // Calculate gratuity: (Last drawn salary × 15/26) × Years of service
        double calculatedAmount = (lastDrawnSalary * 15.0 / 26.0) * yearsOfService;
        
        // Apply maximum cap of ₹20 lakhs
        double finalAmount = Math.min(calculatedAmount, MAX_GRATUITY_AMOUNT);
        
        // Create gratuity record
        Gratuity gratuity = new Gratuity();
        gratuity.setEmployeeId(employeeId);
        gratuity.setLastDrawnSalary(lastDrawnSalary);
        gratuity.setYearsOfService(yearsOfService);
        gratuity.setCalculatedAmount(calculatedAmount);
        gratuity.setFinalAmount(finalAmount);
        gratuity.setExitDate(exitDate);
        gratuity.setStatus("PENDING");
        gratuity.setCreatedAt(java.time.LocalDateTime.now());
        
        return gratuityRepository.save(gratuity);
    }
    
    /**
     * Create or update gratuity record
     */
    @Transactional
    public Gratuity createOrUpdateGratuity(GratuityDTO gratuityDTO) {
        Gratuity gratuity;
        
        if (gratuityDTO.getId() != null) {
            // Update existing
            gratuity = gratuityRepository.findById(gratuityDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Gratuity not found"));
        } else {
            // Create new
            gratuity = new Gratuity();
            gratuity.setCreatedAt(java.time.LocalDateTime.now());
        }
        
        // Update fields
        if (gratuityDTO.getEmployeeId() != null) {
            gratuity.setEmployeeId(gratuityDTO.getEmployeeId());
        }
        if (gratuityDTO.getLastDrawnSalary() != null) {
            gratuity.setLastDrawnSalary(gratuityDTO.getLastDrawnSalary());
        }
        if (gratuityDTO.getYearsOfService() != null) {
            gratuity.setYearsOfService(gratuityDTO.getYearsOfService());
        }
        
        // Calculate amounts if years of service and last drawn salary are provided
        if (gratuityDTO.getYearsOfService() != null && gratuityDTO.getLastDrawnSalary() != null) {
            double yearsOfService = gratuityDTO.getYearsOfService();
            double lastDrawnSalary = gratuityDTO.getLastDrawnSalary();
            
            // Calculate gratuity: (Last drawn salary × 15/26) × Years of service
            double calculatedAmount = (lastDrawnSalary * 15.0 / 26.0) * yearsOfService;
            
            // Apply maximum cap of ₹20 lakhs
            double finalAmount = Math.min(calculatedAmount, MAX_GRATUITY_AMOUNT);
            
            gratuity.setCalculatedAmount(calculatedAmount);
            gratuity.setFinalAmount(finalAmount);
        } else {
            // Use provided values if calculation not possible
            if (gratuityDTO.getCalculatedAmount() != null) {
                gratuity.setCalculatedAmount(gratuityDTO.getCalculatedAmount());
            }
            if (gratuityDTO.getFinalAmount() != null) {
                gratuity.setFinalAmount(gratuityDTO.getFinalAmount());
            }
        }
        if (gratuityDTO.getExitDate() != null) {
            gratuity.setExitDate(gratuityDTO.getExitDate());
        }
        if (gratuityDTO.getPaymentDate() != null) {
            gratuity.setPaymentDate(gratuityDTO.getPaymentDate());
        }
        if (gratuityDTO.getStatus() != null) {
            gratuity.setStatus(gratuityDTO.getStatus());
        }
        if (gratuityDTO.getNotes() != null) {
            gratuity.setNotes(gratuityDTO.getNotes());
        }
        if (gratuityDTO.getCreatedBy() != null) {
            gratuity.setCreatedBy(gratuityDTO.getCreatedBy());
        }
        
        return gratuityRepository.save(gratuity);
    }
    
    /**
     * Get all gratuity records
     */
    public List<Gratuity> getAllGratuities() {
        return gratuityRepository.findAll();
    }
    
    /**
     * Get gratuity by ID
     */
    public Optional<Gratuity> getGratuityById(@NonNull Long id) {
        return gratuityRepository.findById(java.util.Objects.requireNonNull(id));
    }
    
    /**
     * Get gratuities by employee ID
     */
    public List<Gratuity> getGratuitiesByEmployeeId(@NonNull Long employeeId) {
        return gratuityRepository.findByEmployeeId(java.util.Objects.requireNonNull(employeeId));
    }
    
    /**
     * Get gratuities by status
     */
    public List<Gratuity> getGratuitiesByStatus(String status) {
        return gratuityRepository.findByStatus(status);
    }
    
    /**
     * Approve gratuity
     */
    @Transactional
    public Gratuity approveGratuity(@NonNull Long id, Long approvedBy) {
        Gratuity gratuity = gratuityRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Gratuity not found"));
        
        if (!"PENDING".equals(gratuity.getStatus())) {
            throw new RuntimeException("Only PENDING gratuities can be approved. Current status: " + gratuity.getStatus());
        }
        
        gratuity.setStatus("APPROVED");
        gratuity.setApprovedAt(java.time.LocalDateTime.now());
        gratuity.setApprovedBy(approvedBy);
        
        return gratuityRepository.save(gratuity);
    }
    
    /**
     * Mark gratuity as paid
     */
    @Transactional
    public Gratuity markGratuityAsPaid(@NonNull Long id, LocalDate paymentDate, Long paidBy) {
        Gratuity gratuity = gratuityRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Gratuity not found"));
        
        if (!"APPROVED".equals(gratuity.getStatus())) {
            throw new RuntimeException("Only APPROVED gratuities can be marked as paid. Current status: " + gratuity.getStatus());
        }
        
        gratuity.setStatus("PAID");
        gratuity.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
        gratuity.setPaidAt(java.time.LocalDateTime.now());
        gratuity.setPaidBy(paidBy);
        
        return gratuityRepository.save(gratuity);
    }
    
    /**
     * Reject gratuity
     */
    @Transactional
    public Gratuity rejectGratuity(@NonNull Long id, String reason) {
        Gratuity gratuity = gratuityRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Gratuity not found"));
        
        if (!"PENDING".equals(gratuity.getStatus())) {
            throw new RuntimeException("Only PENDING gratuities can be rejected. Current status: " + gratuity.getStatus());
        }
        
        gratuity.setStatus("REJECTED");
        gratuity.setNotes(gratuity.getNotes() != null ? gratuity.getNotes() + "\nRejection Reason: " + reason : "Rejection Reason: " + reason);
        
        return gratuityRepository.save(gratuity);
    }
    
    /**
     * Delete gratuity
     */
    @Transactional
    public void deleteGratuity(@NonNull Long id) {
        Gratuity gratuity = gratuityRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Gratuity not found"));
        
        if ("PAID".equals(gratuity.getStatus())) {
            throw new RuntimeException("Cannot delete a PAID gratuity");
        }
        
        gratuityRepository.delete(gratuity);
    }
}

