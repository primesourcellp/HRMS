package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.hrms.entity.User;
import com.hrms.entity.WorkExperience;
import com.hrms.entity.EducationDetail;
import com.hrms.repository.UserRepository;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.PayrollRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.PerformanceRepository;
import com.hrms.repository.SalaryStructureRepository;
import com.hrms.repository.LeaveBalanceRepository;
import com.hrms.repository.ShiftChangeRequestRepository;
import com.hrms.repository.EmployeeDocumentRepository;
import com.hrms.repository.HRTicketRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private PerformanceRepository performanceRepository;

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private ShiftChangeRequestRepository shiftChangeRequestRepository;

    @Autowired
    private EmployeeDocumentRepository employeeDocumentRepository;

    @Autowired
    private HRTicketRepository hrTicketRepository;

    // -------------------- GET ALL USERS --------------------
    public List<User> getAllEmployees() {
        return userRepository.findAll();
    }

    // -------------------- GET USER BY ID --------------------
    @Transactional(readOnly = true)
    public Optional<User> getEmployeeById(long id) {
        // Fetch user with work experiences first (to avoid MultipleBagFetchException)
        Optional<User> userOpt = userRepository.findByIdWithWorkExperiences(java.lang.Long.valueOf(id));
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Fetch education details separately
            Optional<User> userWithEducation = userRepository.findByIdWithEducationDetails(java.lang.Long.valueOf(id));
            if (userWithEducation.isPresent()) {
                user.setEducationDetails(userWithEducation.get().getEducationDetails());
            }
            
            // Fetch dependent details separately
            Optional<User> userWithDependent = userRepository.findByIdWithDependentDetails(java.lang.Long.valueOf(id));
            if (userWithDependent.isPresent()) {
                user.setDependentDetails(userWithDependent.get().getDependentDetails());
            }
            
            // Force initialization of lazy collections by accessing them
            if (user.getWorkExperiences() != null) {
                user.getWorkExperiences().size(); // Force initialization
            }
            if (user.getEducationDetails() != null) {
                user.getEducationDetails().size(); // Force initialization
            }
            if (user.getDependentDetails() != null) {
                user.getDependentDetails().size(); // Force initialization
            }
        }
        return userOpt;
    }

    // -------------------- CREATE USER --------------------
    public User createEmployee(User employee) {
        // Set default date of joining to current date if not provided
        if (employee.getDateOfJoining() == null) {
            employee.setDateOfJoining(java.time.LocalDate.now());
        }

        // Auto-generate avatar if missing (using name initials)
        if (employee.getAvatar() == null || employee.getAvatar().isEmpty()) {
            if (employee.getName() != null && !employee.getName().trim().isEmpty()) {
                String[] nameParts = employee.getName().trim().split("\\s+");
                if (nameParts.length >= 2) {
                    String avatar = nameParts[0].charAt(0) + "" + nameParts[nameParts.length - 1].charAt(0);
                    employee.setAvatar(avatar.toUpperCase());
                } else if (nameParts.length == 1) {
                    employee.setAvatar(nameParts[0].substring(0, 1).toUpperCase());
                } else {
                    employee.setAvatar("U"); // Default to "U" for Unknown
                }
            } else {
                employee.setAvatar("U"); // Default to "U" for Unknown
            }
        }

        // Hash password if provided
        if (employee.getPassword() != null && !employee.getPassword().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(employee.getPassword()));
        }
        // Ensure `phone` is populated to avoid DB NOT NULL constraint errors.
        // Prefer explicit `phone`, otherwise fall back to personalMobileNumber or workPhoneNumber.
        if (employee.getPhone() == null || employee.getPhone().trim().isEmpty()) {
            if (employee.getPersonalMobileNumber() != null && !employee.getPersonalMobileNumber().trim().isEmpty()) {
                employee.setPhone(employee.getPersonalMobileNumber());
            } else if (employee.getWorkPhoneNumber() != null && !employee.getWorkPhoneNumber().trim().isEmpty()) {
                employee.setPhone(employee.getWorkPhoneNumber());
            } else {
                // Set empty string so the DB sees non-null value; alternatively
                // you could throw a validation exception here to force user input.
                employee.setPhone("");
            }
        }
        
        // Ensure `name` field is set before saving (safety check in addition to @PrePersist)
        if (employee.getName() == null || employee.getName().trim().isEmpty()) {
            employee.setName(""); // Set empty string if not provided
        }
        
        // Ensure `designation` (maps to `position` column) is set to avoid NOT NULL constraint error
        if (employee.getDesignation() == null || employee.getDesignation().trim().isEmpty()) {
            employee.setDesignation(""); // Set empty string to satisfy NOT NULL constraint
        }
        
        // CRITICAL: Preserve client field - ensure it's explicitly saved to database
        // The client field must be preserved exactly as provided (trimmed)
        String clientValue = employee.getClient();
        if (clientValue != null) {
            String trimmed = clientValue.trim();
            // Preserve the trimmed value - even if empty, we want to save what was provided
            // But typically we save non-empty values, so convert empty to null
            employee.setClient(trimmed.isEmpty() ? null : trimmed);
        }
        // Explicitly ensure client is set - don't let it be lost
        // If it was null originally, keep it null (field is nullable in DB)
        
        // Ensure `status` field is set (maps to database `status` column)
        // Use employeeStatus if status is not set, or default to "Active"
        if (employee.getStatus() == null || employee.getStatus().trim().isEmpty()) {
            if (employee.getEmployeeStatus() != null && !employee.getEmployeeStatus().trim().isEmpty()) {
                employee.setStatus(employee.getEmployeeStatus());
            } else {
                employee.setStatus("Active"); // Default to "Active" if not provided
            }
        }
        
        // Initialize nested collections if they are null to avoid issues
        if (employee.getWorkExperiences() == null) {
            employee.setWorkExperiences(new java.util.ArrayList<>());
        }
        if (employee.getEducationDetails() == null) {
            employee.setEducationDetails(new java.util.ArrayList<>());
        }
        if (employee.getDependentDetails() == null) {
            employee.setDependentDetails(new java.util.ArrayList<>());
        }
        
        // Ensure each nested entity has the user reference set
        if (employee.getWorkExperiences() != null) {
            for (com.hrms.entity.WorkExperience we : employee.getWorkExperiences()) {
                if (we != null) {
                    we.setEmployee(employee);
                }
            }
        }
        if (employee.getEducationDetails() != null) {
            for (com.hrms.entity.EducationDetail ed : employee.getEducationDetails()) {
                if (ed != null) {
                    ed.setEmployee(employee);
                }
            }
        }
        if (employee.getDependentDetails() != null) {
            for (com.hrms.entity.DependentDetail dd : employee.getDependentDetails()) {
                if (dd != null) {
                    dd.setEmployee(employee);
                }
            }
        }
        
        // CRITICAL: Explicitly preserve and set client field right before save
        // Store the original client value before any processing
        String originalClient = employee.getClient();
        System.out.println("DEBUG UserService: Original client value: '" + originalClient + "'");
        
        // Process and set the client field explicitly - DO NOT LOSE IT
        if (originalClient != null) {
            String trimmed = originalClient.trim();
            if (!trimmed.isEmpty()) {
                // Non-empty value - definitely save it
                employee.setClient(trimmed);
                System.out.println("DEBUG UserService: Setting client to trimmed value: '" + trimmed + "'");
            } else {
                // Empty string - set to null (field is nullable)
                employee.setClient(null);
                System.out.println("DEBUG UserService: Client was empty string, setting to null");
            }
        } else {
            // Already null - keep it null
            System.out.println("DEBUG UserService: Client was null, keeping as null");
        }
        
        // Force JPA to include the client field in the save operation
        // Use save() which will persist all fields including client
        System.out.println("DEBUG UserService: About to save with client: '" + employee.getClient() + "'");
        User savedEmployee = userRepository.save(employee);
        System.out.println("DEBUG UserService: After save, client is: '" + savedEmployee.getClient() + "'");
        
        // Double-check: If client was provided but not saved, force update
        if (originalClient != null && !originalClient.trim().isEmpty()) {
            String trimmedClient = originalClient.trim();
            if (savedEmployee.getClient() == null || !savedEmployee.getClient().equals(trimmedClient)) {
                // Client was lost - force update with explicit save
                System.out.println("DEBUG UserService: WARNING - Client was lost! Re-saving with value: '" + trimmedClient + "'");
                savedEmployee.setClient(trimmedClient);
                savedEmployee = userRepository.save(savedEmployee);
                System.out.println("DEBUG UserService: After re-save, client is: '" + savedEmployee.getClient() + "'");
            }
        }
        
        return savedEmployee;
    }

    // -------------------- UPDATE USER --------------------
    public User updateEmployee(long id, @NonNull User newData) {

        User emp = userRepository.findById(java.lang.Long.valueOf(id))
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // ---------------- UPDATE ALL FIELDS SAFE & FLEXIBLE ----------------
        if (newData.getEmployeeId() != null) emp.setEmployeeId(newData.getEmployeeId());
        if (newData.getName() != null) emp.setName(newData.getName());
        
        if (newData.getEmail() != null) emp.setEmail(newData.getEmail());
        if (newData.getSalary() != null) emp.setSalary(newData.getSalary());
        if (newData.getRole() != null) emp.setRole(newData.getRole());
        if (newData.getClient() != null) emp.setClient(newData.getClient());
        if (newData.getDepartment() != null) emp.setDepartment(newData.getDepartment());
        if (newData.getLocation() != null) emp.setLocation(newData.getLocation());
        if (newData.getDesignation() != null) emp.setDesignation(newData.getDesignation());
        if (newData.getEmploymentType() != null) emp.setEmploymentType(newData.getEmploymentType());
        if (newData.getEmployeeStatus() != null) emp.setEmployeeStatus(newData.getEmployeeStatus());
        if (newData.getSourceOfHire() != null) emp.setSourceOfHire(newData.getSourceOfHire());
        if (newData.getDateOfJoining() != null) emp.setDateOfJoining(newData.getDateOfJoining());

        if (newData.getDateOfBirth() != null) emp.setDateOfBirth(newData.getDateOfBirth());
        if (newData.getAge() != null) emp.setAge(newData.getAge());
        if (newData.getGender() != null) emp.setGender(newData.getGender());
        if (newData.getMaritalStatus() != null) emp.setMaritalStatus(newData.getMaritalStatus());
        if (newData.getAboutMe() != null) emp.setAboutMe(newData.getAboutMe());
        if (newData.getExpertise() != null) emp.setExpertise(newData.getExpertise());

        if (newData.getUan() != null) emp.setUan(newData.getUan());
        if (newData.getPan() != null) emp.setPan(newData.getPan());
        if (newData.getAadhaar() != null) emp.setAadhaar(newData.getAadhaar());
        if (newData.getBankAccountNumber() != null) emp.setBankAccountNumber(newData.getBankAccountNumber());

        if (newData.getWorkPhoneNumber() != null) emp.setWorkPhoneNumber(newData.getWorkPhoneNumber());
        if (newData.getPersonalMobileNumber() != null) emp.setPersonalMobileNumber(newData.getPersonalMobileNumber());
        if (newData.getExtension() != null) emp.setExtension(newData.getExtension());
        if (newData.getPersonalEmailAddress() != null) emp.setPersonalEmailAddress(newData.getPersonalEmailAddress());
        if (newData.getSeatingLocation() != null) emp.setSeatingLocation(newData.getSeatingLocation());
        if (newData.getTags() != null) emp.setTags(newData.getTags());

        if (newData.getPresentAddressLine1() != null) emp.setPresentAddressLine1(newData.getPresentAddressLine1());
        if (newData.getPresentAddressLine2() != null) emp.setPresentAddressLine2(newData.getPresentAddressLine2());
        if (newData.getPresentCity() != null) emp.setPresentCity(newData.getPresentCity());
        if (newData.getPresentCountry() != null) emp.setPresentCountry(newData.getPresentCountry());
        if (newData.getPresentState() != null) emp.setPresentState(newData.getPresentState());
        if (newData.getPresentPostalCode() != null) emp.setPresentPostalCode(newData.getPresentPostalCode());

        if (newData.getSameAsPresentAddress() != null) emp.setSameAsPresentAddress(newData.getSameAsPresentAddress());
        if (newData.getPermanentAddressLine1() != null) emp.setPermanentAddressLine1(newData.getPermanentAddressLine1());
        if (newData.getPermanentAddressLine2() != null) emp.setPermanentAddressLine2(newData.getPermanentAddressLine2());
        if (newData.getPermanentCity() != null) emp.setPermanentCity(newData.getPermanentCity());
        if (newData.getPermanentCountry() != null) emp.setPermanentCountry(newData.getPermanentCountry());
        if (newData.getPermanentState() != null) emp.setPermanentState(newData.getPermanentState());
        if (newData.getPermanentPostalCode() != null) emp.setPermanentPostalCode(newData.getPermanentPostalCode());

        if (newData.getDateOfExit() != null) emp.setDateOfExit(newData.getDateOfExit());

        if (newData.getPhone() != null) emp.setPhone(newData.getPhone());
        if (newData.getAvatar() != null) emp.setAvatar(newData.getAvatar());
        if (newData.getShift() != null) emp.setShift(newData.getShift());

        // Handle password update if provided
        if (newData.getPassword() != null && !newData.getPassword().isEmpty()) {
            // Only update password if a new one is provided
            emp.setPassword(passwordEncoder.encode(newData.getPassword()));
        }


        // Update nested collections (work experiences, education details, dependent details)
        if (newData.getWorkExperiences() != null) {
            if (emp.getWorkExperiences() != null) {
                emp.getWorkExperiences().clear();
            } else {
                emp.setWorkExperiences(new java.util.ArrayList<>());
            }
            for (WorkExperience we : newData.getWorkExperiences()) {
                we.setEmployee(emp);
                emp.getWorkExperiences().add(we);
            }
        }

        if (newData.getEducationDetails() != null) {
            if (emp.getEducationDetails() != null) {
                emp.getEducationDetails().clear();
            } else {
                emp.setEducationDetails(new java.util.ArrayList<>());
            }
            for (EducationDetail ed : newData.getEducationDetails()) {
                ed.setEmployee(emp);
                emp.getEducationDetails().add(ed);
            }
        }


        return userRepository.save(java.util.Objects.requireNonNull(emp));
    }

    // -------------------- DELETE USER --------------------
    @Transactional
    public void deleteEmployee(long id) {
        Long employeeId = java.lang.Long.valueOf(id);
        
        // Check if user exists
        if (!userRepository.existsById(employeeId)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        
        // Delete all related records first to avoid foreign key constraint violations
        try {
            // Delete attendance records
            attendanceRepository.deleteByEmployeeId(employeeId);
            
            // Delete payroll records
            payrollRepository.deleteByEmployeeId(employeeId);
            
            // Delete leave records
            leaveRepository.deleteByEmployeeId(employeeId);
            
            // Delete performance records
            performanceRepository.deleteByEmployeeId(employeeId);
            
            // Delete salary structure records
            salaryStructureRepository.deleteByEmployeeId(employeeId);
            
            // Delete leave balance records
            leaveBalanceRepository.deleteByEmployeeId(employeeId);
            
            // Delete shift change requests
            shiftChangeRequestRepository.deleteByEmployeeId(employeeId);
            
            // Delete user documents
            employeeDocumentRepository.deleteByEmployeeId(employeeId);
            
            // Delete HR tickets
            hrTicketRepository.deleteByEmployeeId(employeeId);
            
            // Finally, delete the user
            userRepository.deleteById(employeeId);
        } catch (Exception e) {
            throw new RuntimeException("Error deleting user and related records: " + e.getMessage(), e);
        }
    }

    // -------------------- SEARCH USERS --------------------
    public List<User> searchEmployees(String searchTerm) {
        return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm);
    }

    // -------------------- FIND BY EMAIL --------------------
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // -------------------- LOGIN AUTHENTICATION --------------------
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public boolean authenticate(String email, String password) {
        if (email == null || password == null || email.trim().isEmpty() || password.isEmpty()) {
            return false;
        }

        Optional<User> employee = userRepository.findByEmail(email.trim());

        if (employee.isPresent() && 
            employee.get().getEmployeeStatus() != null &&
            employee.get().getEmployeeStatus().equalsIgnoreCase("Active")) {
            
            String storedPassword = employee.get().getPassword();
            
            // If no password is set, don't allow login
            if (storedPassword == null || storedPassword.isEmpty()) {
                return false;
            }
            
            // Verify the password using BCrypt
            return passwordEncoder.matches(password, storedPassword);
        }

        return false;
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User employee = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        employee.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(employee);
    }
    
    // Additional methods from old UserService
    public User createUser(User user) {
        // Hash password before saving
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        // Ensure employeeStatus is set from active
        if (user.getActive() != null) {
            user.setActive(user.getActive());
        }
        return userRepository.save(java.util.Objects.requireNonNull(user));
    }

    public List<User> getAllUsers() {
        // Return all users (they can have different roles)
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        // Use getEmployeeById which handles fetching collections separately
        return getEmployeeById(id.longValue());
    }

    @org.springframework.transaction.annotation.Transactional
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (userDetails.getName() != null) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        if (userDetails.getActive() != null) {
            user.setActive(userDetails.getActive());
        }
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        // Handle client field - update if provided
        if (userDetails.getClient() != null) {
            user.setClient(userDetails.getClient().trim());
        }

        return userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        userRepository.delete(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Verify current password
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new RuntimeException("Current password is not set");
        }
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Update to new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}

