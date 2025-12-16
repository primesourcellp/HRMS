package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import com.hrms.entity.Employee;
import com.hrms.entity.WorkExperience;
import com.hrms.entity.EducationDetail;
import com.hrms.repository.EmployeeRepository;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // -------------------- GET ALL EMPLOYEES --------------------
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

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
        if (newData.getNickName() != null) emp.setNickName(newData.getNickName());
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

        // Update password (hashed)
        if (newData.getPassword() != null && !newData.getPassword().isEmpty()) {
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
    public Optional<Employee> findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

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
