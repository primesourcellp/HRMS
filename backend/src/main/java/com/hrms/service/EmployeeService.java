package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;

import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // -------------------- GET ALL EMPLOYEES --------------------
=======
import org.springframework.transaction.annotation.Transactional;

import com.hrms.entity.Employee;
import com.hrms.entity.EmployeeDocument;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeDocumentRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.HRTicketRepository;
import com.hrms.repository.LeaveBalanceRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.PayrollRepository;
import com.hrms.repository.PerformanceRepository;
import com.hrms.repository.SalaryStructureRepository;
import com.hrms.util.FileStorageService;

@Service
public class EmployeeService {
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private PayrollRepository payrollRepository;
    
    @Autowired
    private LeaveRepository leaveRepository;
    
    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;
    
    @Autowired
    private EmployeeDocumentRepository employeeDocumentRepository;
    
    @Autowired
    private SalaryStructureRepository salaryStructureRepository;
    
    @Autowired
    private PerformanceRepository performanceRepository;
    
    @Autowired
    private HRTicketRepository hrTicketRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

<<<<<<< HEAD
    // -------------------- GET EMPLOYEE BY ID --------------------
    public Optional<Employee> getEmployeeById(long id) {
        return employeeRepository.findById(java.lang.Long.valueOf(id));
    }

    // -------------------- CREATE EMPLOYEE --------------------
    public Employee createEmployee(Employee employee) {
        // Set default date of joining to current date if not provided
        if (employee.getDateOfJoining() == null) {
            employee.setDateOfJoining(java.time.LocalDate.now());
        }

        // Auto-generate avatar if missing (using first & last name initials)
        if (employee.getAvatar() == null || employee.getAvatar().isEmpty()) {
            if (employee.getFirstName() != null && employee.getLastName() != null) {
                String avatar = employee.getFirstName().charAt(0) + "" + employee.getLastName().charAt(0);
                employee.setAvatar(avatar.toUpperCase());
            }
        }

=======
    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    public Employee createEmployee(Employee employee) {
        if (employee.getAvatar() == null || employee.getAvatar().isEmpty()) {
            String avatar = employee.getName().split(" ").length > 1
                    ? employee.getName().split(" ")[0].charAt(0) + "" + employee.getName().split(" ")[1].charAt(0)
                    : employee.getName().charAt(0) + "";
            employee.setAvatar(avatar.toUpperCase());
        }
        
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        // Hash password if provided
        if (employee.getPassword() != null && !employee.getPassword().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(employee.getPassword()));
        }
<<<<<<< HEAD
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
        return employeeRepository.save(employee);
    }

    // -------------------- UPDATE EMPLOYEE --------------------
    public Employee updateEmployee(long id, @NonNull Employee newData) {

        Employee emp = employeeRepository.findById(java.lang.Long.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        // ---------------- UPDATE ALL FIELDS SAFE & FLEXIBLE ----------------
        if (newData.getEmployeeId() != null) emp.setEmployeeId(newData.getEmployeeId());
        if (newData.getFirstName() != null) emp.setFirstName(newData.getFirstName());
        if (newData.getLastName() != null) emp.setLastName(newData.getLastName());
        if (newData.getEmail() != null) emp.setEmail(newData.getEmail());

        if (newData.getRole() != null) emp.setRole(newData.getRole());
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

    
        return employeeRepository.save(java.util.Objects.requireNonNull(emp));
    }

    // -------------------- DELETE EMPLOYEE --------------------
    public void deleteEmployee(long id) {
        employeeRepository.deleteById(java.lang.Long.valueOf(id));
    }

    // -------------------- SEARCH EMPLOYEES --------------------
    public List<Employee> searchEmployees(String searchTerm) {
        return employeeRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // -------------------- FIND BY EMAIL --------------------
=======
        
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        
        if (employeeDetails.getName() != null) {
            employee.setName(employeeDetails.getName());
        }
        if (employeeDetails.getEmail() != null) {
            employee.setEmail(employeeDetails.getEmail());
        }
        if (employeeDetails.getPhone() != null) {
            employee.setPhone(employeeDetails.getPhone());
        }
        if (employeeDetails.getDepartment() != null) {
            employee.setDepartment(employeeDetails.getDepartment());
        }
        if (employeeDetails.getPosition() != null) {
            employee.setPosition(employeeDetails.getPosition());
        }
        if (employeeDetails.getSalary() != null) {
            employee.setSalary(employeeDetails.getSalary());
        }
        if (employeeDetails.getJoinDate() != null) {
            employee.setJoinDate(employeeDetails.getJoinDate());
        }
        if (employeeDetails.getStatus() != null) {
            employee.setStatus(employeeDetails.getStatus());
        }
        
        // Update shiftId if provided
        if (employeeDetails.getShiftId() != null) {
            employee.setShiftId(employeeDetails.getShiftId());
        }
        
        // Update password if provided (will be hashed)
        if (employeeDetails.getPassword() != null && !employeeDetails.getPassword().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(employeeDetails.getPassword()));
        }
        
        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        // Check if employee exists
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found with id: " + id);
        }
        
        // Delete all related records first to avoid foreign key constraint violations
        try {
            // Delete attendance records
            attendanceRepository.deleteAll(attendanceRepository.findByEmployeeId(id));
            
            // Delete payroll records
            payrollRepository.deleteAll(payrollRepository.findByEmployeeId(id));
            
            // Delete leave records
            leaveRepository.deleteAll(leaveRepository.findByEmployeeId(id));
            
            // Delete leave balance records
            leaveBalanceRepository.deleteAll(leaveBalanceRepository.findByEmployeeId(id));
            
            // Delete employee documents and their physical files
            List<EmployeeDocument> documents = employeeDocumentRepository.findByEmployeeId(id);
            for (EmployeeDocument doc : documents) {
                if (doc.getFilePath() != null) {
                    fileStorageService.deleteFile(doc.getFilePath());
                }
            }
            employeeDocumentRepository.deleteAll(documents);
            
            // Delete salary structures
            salaryStructureRepository.deleteAll(salaryStructureRepository.findByEmployeeId(id));
            
            // Delete performance records
            performanceRepository.deleteAll(performanceRepository.findByEmployeeId(id));
            
            // Delete HR tickets
            hrTicketRepository.deleteAll(hrTicketRepository.findByEmployeeId(id));
            
            // Finally, delete the employee
            employeeRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete employee: " + e.getMessage(), e);
        }
    }

    public List<Employee> searchEmployees(String searchTerm) {
        return employeeRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm);
    }

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    public Optional<Employee> findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

<<<<<<< HEAD
    // -------------------- LOGIN AUTHENTICATION --------------------
    public boolean authenticate(String email, String password) {

        if (email == null || password == null || email.trim().isEmpty() || password.isEmpty()) {
            return false;
        }

        Optional<Employee> employee = employeeRepository.findByEmail(email.trim());

        if (employee.isPresent() && 
            employee.get().getEmployeeStatus() != null &&
            employee.get().getEmployeeStatus().equalsIgnoreCase("Active")) {

            String storedPassword = employee.get().getPassword();

            if (storedPassword == null || storedPassword.isEmpty()) {
                return false;
            }

            return passwordEncoder.matches(password, storedPassword);
        }

        return false;
    }
}
=======
    public boolean authenticate(String email, String password) {
        if (email == null || password == null || email.trim().isEmpty() || password.isEmpty()) {
            return false;
        }
        
        Optional<Employee> employee = employeeRepository.findByEmail(email.trim());
        if (employee.isPresent() && "Active".equals(employee.get().getStatus())) {
            String storedPassword = employee.get().getPassword();
            if (storedPassword == null || storedPassword.isEmpty()) {
                return false;
            }
            return passwordEncoder.matches(password, storedPassword);
        }
        return false;
    }
}

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
