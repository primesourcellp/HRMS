package com.hrms.entity;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "employees")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Employee {
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }


    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }


    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getEmployeeStatus() { return employeeStatus; }
    public void setEmployeeStatus(String employeeStatus) { this.employeeStatus = employeeStatus; }

    public String getSourceOfHire() { return sourceOfHire; }
    public void setSourceOfHire(String sourceOfHire) { this.sourceOfHire = sourceOfHire; }
    
    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }
    
    @Column(nullable = false, length = 255)
    private String password;
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public String getAboutMe() { return aboutMe; }
    public void setAboutMe(String aboutMe) { this.aboutMe = aboutMe; }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic Information
    private String employeeId;
    private String firstName;
    private String lastName;
 
    private String email;
    private String name;


    // Work Information
    private String role;
    private String department;
    private String location;
    
    @Column(name = "position")
    private String designation;
    
    private String employmentType;
    private String employeeStatus;
    
    @Column(name = "status")
    private String status;
    
    private String sourceOfHire;
    
    @Column(name = "join_date")
    private LocalDate dateOfJoining;
    
    @Column(name = "salary")
    private Double salary;

    @Column(name = "client")
    private String client;


    // Personal Details
    private LocalDate dateOfBirth;
    private String age;
    private String gender;
    private String maritalStatus;

    @Column(length = 2000)
    private String aboutMe;

    private String expertise;

    // Identity Info
   
    private String pan;
    private String aadhaar;

    // Contact Info
    private String workPhoneNumber;
    private String personalMobileNumber;
    private String extension;
    private String personalEmailAddress;
    private String seatingLocation;
    private String tags;

    // Present Address
    private String presentAddressLine1;
    private String presentAddressLine2;
    private String presentCity;
    private String presentCountry;
    private String presentState;
    private String presentPostalCode;

    // Permanent Address
    private Boolean sameAsPresentAddress;
    private String permanentAddressLine1;
    private String permanentAddressLine2;
    private String permanentCity;
    private String permanentCountry;
    private String permanentState;
    private String permanentPostalCode;

    // Exit and Other Info
    private LocalDate dateOfExit;
    private String phone;
    
    private String avatar;

    // Shift Assignment Dates
    @Column(name = "shift_assignment_start_date")
    private LocalDate shiftAssignmentStartDate;

    @Column(name = "shift_assignment_end_date")
    private LocalDate shiftAssignmentEndDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", insertable = false, updatable = false)
    @JsonIgnore
    private com.hrms.entity.Shift shift;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkExperience> workExperiences;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EducationDetail> educationDetails;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DependentDetail> dependentDetails;

    public String getExpertise() { return expertise; }
    public void setExpertise(String expertise) { this.expertise = expertise; }

    

    public String getPan() { return pan; }
    public void setPan(String pan) { this.pan = pan; }

    public String getAadhaar() { return aadhaar; }
    public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }

    public String getWorkPhoneNumber() { return workPhoneNumber; }
    public void setWorkPhoneNumber(String workPhoneNumber) { this.workPhoneNumber = workPhoneNumber; }

    public String getPersonalMobileNumber() { return personalMobileNumber; }
    public void setPersonalMobileNumber(String personalMobileNumber) { this.personalMobileNumber = personalMobileNumber; }

    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }

    public String getPersonalEmailAddress() { return personalEmailAddress; }
    public void setPersonalEmailAddress(String personalEmailAddress) { this.personalEmailAddress = personalEmailAddress; }

    public String getSeatingLocation() { return seatingLocation; }
    public void setSeatingLocation(String seatingLocation) { this.seatingLocation = seatingLocation; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getPresentAddressLine1() { return presentAddressLine1; }
    public void setPresentAddressLine1(String presentAddressLine1) { this.presentAddressLine1 = presentAddressLine1; }

    public String getPresentAddressLine2() { return presentAddressLine2; }
    public void setPresentAddressLine2(String presentAddressLine2) { this.presentAddressLine2 = presentAddressLine2; }

    public String getPresentCity() { return presentCity; }
    public void setPresentCity(String presentCity) { this.presentCity = presentCity; }

    public String getPresentCountry() { return presentCountry; }
    public void setPresentCountry(String presentCountry) { this.presentCountry = presentCountry; }

    public String getPresentState() { return presentState; }
    public void setPresentState(String presentState) { this.presentState = presentState; }

    public String getPresentPostalCode() { return presentPostalCode; }
    public void setPresentPostalCode(String presentPostalCode) { this.presentPostalCode = presentPostalCode; }

    public Boolean getSameAsPresentAddress() { return sameAsPresentAddress; }
    public void setSameAsPresentAddress(Boolean sameAsPresentAddress) { this.sameAsPresentAddress = sameAsPresentAddress; }

    public String getPermanentAddressLine1() { return permanentAddressLine1; }
    public void setPermanentAddressLine1(String permanentAddressLine1) { this.permanentAddressLine1 = permanentAddressLine1; }

    public String getPermanentAddressLine2() { return permanentAddressLine2; }
    public void setPermanentAddressLine2(String permanentAddressLine2) { this.permanentAddressLine2 = permanentAddressLine2; }

    public String getPermanentCity() { return permanentCity; }
    public void setPermanentCity(String permanentCity) { this.permanentCity = permanentCity; }

    public String getPermanentCountry() { return permanentCountry; }
    public void setPermanentCountry(String permanentCountry) { this.permanentCountry = permanentCountry; }

    public String getPermanentState() { return permanentState; }
    public void setPermanentState(String permanentState) { this.permanentState = permanentState; }

    public String getPermanentPostalCode() { return permanentPostalCode; }
    public void setPermanentPostalCode(String permanentPostalCode) { this.permanentPostalCode = permanentPostalCode; }

    public LocalDate getDateOfExit() { return dateOfExit; }
    public void setDateOfExit(LocalDate dateOfExit) { this.dateOfExit = dateOfExit; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

   

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    // Shift Assignment Dates
    public LocalDate getShiftAssignmentStartDate() { return shiftAssignmentStartDate; }
    public void setShiftAssignmentStartDate(LocalDate shiftAssignmentStartDate) { this.shiftAssignmentStartDate = shiftAssignmentStartDate; }

    public LocalDate getShiftAssignmentEndDate() { return shiftAssignmentEndDate; }
    public void setShiftAssignmentEndDate(LocalDate shiftAssignmentEndDate) { this.shiftAssignmentEndDate = shiftAssignmentEndDate; }

    // Removed duplicate shiftId getter/setter

    public com.hrms.entity.Shift getShift() { return shift; }
    public void setShift(com.hrms.entity.Shift shift) { this.shift = shift; }

    public List<WorkExperience> getWorkExperiences() { return workExperiences; }
    public void setWorkExperiences(List<WorkExperience> workExperiences) { this.workExperiences = workExperiences; }

    public List<EducationDetail> getEducationDetails() { return educationDetails; }
    public void setEducationDetails(List<EducationDetail> educationDetails) { this.educationDetails = educationDetails; }

    public List<DependentDetail> getDependentDetails() { return dependentDetails; }
    public void setDependentDetails(List<DependentDetail> dependentDetails) { this.dependentDetails = dependentDetails; }

    // Convenience methods for backwards compatibility
    public String getName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        if (firstName != null) {
            return firstName;
        }
        if (lastName != null) {
            return lastName;
        }
        return ""; // Return empty string instead of null to prevent NullPointerException
    }

    public void setName(String name) {
        this.name = name;
        // If name is provided but firstName/lastName are not set, try to split the name
        if (name != null && !name.trim().isEmpty()) {
            if ((firstName == null || firstName.trim().isEmpty()) && 
                (lastName == null || lastName.trim().isEmpty())) {
                String[] parts = name.trim().split("\\s+", 2);
                if (parts.length > 0 && firstName == null) {
                    firstName = parts[0];
                }
                if (parts.length > 1 && lastName == null) {
                    lastName = parts[1];
                } else if (parts.length == 1 && lastName == null) {
                    // If only one part, set it as firstName
                    firstName = parts[0];
                }
            }
        }
    }

    public String getStatus() { 
        // Return status field if set, otherwise fall back to employeeStatus for backwards compatibility
        if (status != null && !status.trim().isEmpty()) {
            return status;
        }
        return employeeStatus; 
    }
    public void setStatus(String status) { 
        this.status = status;
        // Also set employeeStatus for backwards compatibility
        if (status != null) {
            this.employeeStatus = status;
        }
    }

    public String getPosition() { return designation; }
    public void setPosition(String position) { this.designation = position; }

    public LocalDate getJoinDate() { return dateOfJoining; }
    public void setJoinDate(LocalDate joinDate) { this.dateOfJoining = joinDate; }

    // JPA lifecycle callbacks to ensure required fields are always set before saving
    @PrePersist
    @PreUpdate
    private void ensureRequiredFields() {
        // Ensure name field is set
        if (name == null || name.trim().isEmpty()) {
            if (firstName != null && !firstName.trim().isEmpty() && lastName != null && !lastName.trim().isEmpty()) {
                name = firstName.trim() + " " + lastName.trim();
            } else if (firstName != null && !firstName.trim().isEmpty()) {
                name = firstName.trim();
            } else if (lastName != null && !lastName.trim().isEmpty()) {
                name = lastName.trim();
            } else {
                // If both firstName and lastName are null or empty, set name to empty string
                // (database might require NOT NULL, so we use empty string instead)
                name = "";
            }
        }
        
        // Ensure designation (position) field is set
        if (designation == null || designation.trim().isEmpty()) {
            designation = ""; // Set empty string to satisfy NOT NULL constraint
        }
        
        // Ensure phone field is set
        if (phone == null || phone.trim().isEmpty()) {
            if (personalMobileNumber != null && !personalMobileNumber.trim().isEmpty()) {
                phone = personalMobileNumber;
            } else if (workPhoneNumber != null && !workPhoneNumber.trim().isEmpty()) {
                phone = workPhoneNumber;
            } else {
                phone = ""; // Set empty string to satisfy NOT NULL constraint
            }
        }
        
        // Ensure avatar is set (generate from initials if not provided)
        if (avatar == null || avatar.trim().isEmpty()) {
            if (firstName != null && !firstName.trim().isEmpty() && lastName != null && !lastName.trim().isEmpty()) {
                avatar = (firstName.charAt(0) + "" + lastName.charAt(0)).toUpperCase();
            } else if (firstName != null && !firstName.trim().isEmpty()) {
                avatar = firstName.substring(0, 1).toUpperCase();
            } else if (lastName != null && !lastName.trim().isEmpty()) {
                avatar = lastName.substring(0, 1).toUpperCase();
            } else {
                avatar = "U"; // Default to "U" for Unknown
            }
        }
        
        // Ensure status field is set (map from employeeStatus if not set)
        if (status == null || status.trim().isEmpty()) {
            if (employeeStatus != null && !employeeStatus.trim().isEmpty()) {
                status = employeeStatus;
            } else {
                status = "Active"; // Default to "Active" if not provided
            }
        }
    }
}
