
package com.hrms.dto;

import java.time.LocalDate;
import java.util.List;

public class EmployeeDTO {
    private Long id;
    private String employeeId;
    private String name;
    private String nickName;
    private String email;
    private String client;
    private String role;
    private String department;
    private String location;
    private String designation;
    private String employmentType;
    private String employeeStatus;
    private String sourceOfHire;
    private LocalDate dateOfJoining;
    private LocalDate dateOfBirth;
    private String age;
    private String gender;
    private String maritalStatus;
    private String aboutMe;
    private String expertise;
    private String uan;
    private String pan;
    private String aadhaar;
    private String workPhoneNumber;
    private String personalMobileNumber;
    private String extension;
    private String personalEmailAddress;
    private String seatingLocation;
    private String tags;
    private String presentAddressLine1;
    private String presentAddressLine2;
    private String presentCity;
    private String presentCountry;
    private String presentState;
    private String presentPostalCode;
    private Boolean sameAsPresentAddress;
    private String permanentAddressLine1;
    private String permanentAddressLine2;
    private String permanentCity;
    private String permanentCountry;
    private String permanentState;
    private String permanentPostalCode;
    private LocalDate dateOfExit;
    private String phone;
    private Double salary;
    private String avatar;
    private Long shiftId;

    private List<WorkExperienceDTO> workExperiences;
    private List<EducationDetailDTO> educationDetails;
    private List<DependentDetailDTO> dependentDetails;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNickName() { return nickName; }
    public void setNickName(String nickName) { this.nickName = nickName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }

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

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

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

    public String getExpertise() { return expertise; }
    public void setExpertise(String expertise) { this.expertise = expertise; }

    public String getUan() { return uan; }
    public void setUan(String uan) { this.uan = uan; }

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

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }

    public List<WorkExperienceDTO> getWorkExperiences() { return workExperiences; }
    public void setWorkExperiences(List<WorkExperienceDTO> workExperiences) { this.workExperiences = workExperiences; }

    public List<EducationDetailDTO> getEducationDetails() { return educationDetails; }
    public void setEducationDetails(List<EducationDetailDTO> educationDetails) { this.educationDetails = educationDetails; }

    public List<DependentDetailDTO> getDependentDetails() { return dependentDetails; }
    public void setDependentDetails(List<DependentDetailDTO> dependentDetails) { this.dependentDetails = dependentDetails; }

}

