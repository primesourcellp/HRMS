package com.hrms.mapper;

import com.hrms.dto.*;
import com.hrms.entity.*;
import java.util.List;
import java.util.stream.Collectors;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(Employee e) {
        if (e == null) return null;
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(e.getId());
        dto.setEmployeeId(e.getEmployeeId());
        dto.setFirstName(e.getFirstName());
        dto.setLastName(e.getLastName());
        dto.setEmail(e.getEmail());
        dto.setRole(e.getRole());
        dto.setClient(e.getClient());
        dto.setDepartment(e.getDepartment());
        dto.setLocation(e.getLocation());
        dto.setDesignation(e.getDesignation());
        dto.setEmploymentType(e.getEmploymentType());
        dto.setEmployeeStatus(e.getEmployeeStatus());
        dto.setSourceOfHire(e.getSourceOfHire());
        dto.setDateOfJoining(e.getDateOfJoining());
        dto.setDateOfBirth(e.getDateOfBirth());
        dto.setAge(e.getAge());
        dto.setGender(e.getGender());
        dto.setMaritalStatus(e.getMaritalStatus());
        dto.setAboutMe(e.getAboutMe());
        dto.setExpertise(e.getExpertise());
        dto.setPan(e.getPan());
        dto.setAadhaar(e.getAadhaar());
        dto.setWorkPhoneNumber(e.getWorkPhoneNumber());
        dto.setPersonalMobileNumber(e.getPersonalMobileNumber());
        dto.setExtension(e.getExtension());
        dto.setPersonalEmailAddress(e.getPersonalEmailAddress());
        dto.setSeatingLocation(e.getSeatingLocation());
        dto.setTags(e.getTags());
        dto.setPresentAddressLine1(e.getPresentAddressLine1());
        dto.setPresentAddressLine2(e.getPresentAddressLine2());
        dto.setPresentCity(e.getPresentCity());
        dto.setPresentCountry(e.getPresentCountry());
        dto.setPresentState(e.getPresentState());
        dto.setPresentPostalCode(e.getPresentPostalCode());
        dto.setSameAsPresentAddress(e.getSameAsPresentAddress());
        dto.setPermanentAddressLine1(e.getPermanentAddressLine1());
        dto.setPermanentAddressLine2(e.getPermanentAddressLine2());
        dto.setPermanentCity(e.getPermanentCity());
        dto.setPermanentCountry(e.getPermanentCountry());
        dto.setPermanentState(e.getPermanentState());
        dto.setPermanentPostalCode(e.getPermanentPostalCode());
        dto.setDateOfExit(e.getDateOfExit());
        dto.setPhone(e.getPhone());
        dto.setSalary(e.getSalary());
        
        dto.setAvatar(e.getAvatar());
        dto.setShiftId(e.getShift() != null ? e.getShift().getId() : null);
        // Map work experiences
        if (e.getWorkExperiences() != null) {
            dto.setWorkExperiences(e.getWorkExperiences().stream().map(EmployeeMapper::toWorkExperienceDTO).collect(Collectors.toList()));
        }
        if (e.getEducationDetails() != null) {
            dto.setEducationDetails(e.getEducationDetails().stream().map(EmployeeMapper::toEducationDetailDTO).collect(Collectors.toList()));
        }
        if (e.getDependentDetails() != null) {
            dto.setDependentDetails(e.getDependentDetails().stream().map(EmployeeMapper::toDependentDetailDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    

    public static WorkExperienceDTO toWorkExperienceDTO(WorkExperience w) {
        if (w == null) return null;
        WorkExperienceDTO dto = new WorkExperienceDTO();
        dto.setId(w.getId());
        dto.setCompanyName(w.getCompanyName());
        dto.setJobTitle(w.getJobTitle());
        dto.setFromDate(w.getFromDate());
        dto.setToDate(w.getToDate());
        dto.setJobDescription(w.getJobDescription());
        dto.setRelevant(w.isRelevant());
        return dto;
    }

    public static EducationDetailDTO toEducationDetailDTO(EducationDetail e) {
        if (e == null) return null;
        EducationDetailDTO dto = new EducationDetailDTO();
        dto.setId(e.getId());
        dto.setInstitutionName(e.getInstitutionName());
        dto.setDegree(e.getDegree());
        dto.setFromDate(e.getFromDate());
        dto.setToDate(e.getToDate());
        return dto;
    }

    public static DependentDetailDTO toDependentDetailDTO(DependentDetail d) {
        if (d == null) return null;
        DependentDetailDTO dto = new DependentDetailDTO();
        dto.setId(d.getId());
        dto.setDependentName(d.getDependentName());
        dto.setRelationship(d.getRelationship());
        dto.setDateOfBirth(d.getDateOfBirth());
        return dto;
    }
    
    public static Employee toEntity(EmployeeDTO dto) {
        if (dto == null) return null;
        
        Employee employee = new Employee();
        
        // Map all fields from DTO to entity
        employee.setId(dto.getId());
        employee.setEmployeeId(dto.getEmployeeId());
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setName(dto.getFirstName() + " " + dto.getLastName()); // Set name from first and last name
        employee.setEmail(dto.getEmail());
        employee.setRole(dto.getRole());
        employee.setClient(dto.getClient());
        employee.setDepartment(dto.getDepartment());
        employee.setLocation(dto.getLocation());
        employee.setDesignation(dto.getDesignation());
        employee.setEmploymentType(dto.getEmploymentType());
        employee.setEmployeeStatus(dto.getEmployeeStatus());
        employee.setStatus(dto.getEmployeeStatus()); // Map to both status fields for backwards compatibility
        employee.setSourceOfHire(dto.getSourceOfHire());
        employee.setDateOfJoining(dto.getDateOfJoining());
        employee.setDateOfBirth(dto.getDateOfBirth());
        employee.setAge(dto.getAge());
        employee.setGender(dto.getGender());
        employee.setMaritalStatus(dto.getMaritalStatus());
        employee.setAboutMe(dto.getAboutMe());
        employee.setExpertise(dto.getExpertise());
        employee.setPan(dto.getPan());
        employee.setAadhaar(dto.getAadhaar());
        employee.setWorkPhoneNumber(dto.getWorkPhoneNumber());
        employee.setPersonalMobileNumber(dto.getPersonalMobileNumber());
        employee.setExtension(dto.getExtension());
        employee.setPersonalEmailAddress(dto.getPersonalEmailAddress());
        employee.setSeatingLocation(dto.getSeatingLocation());
        employee.setTags(dto.getTags());
        employee.setPresentAddressLine1(dto.getPresentAddressLine1());
        employee.setPresentAddressLine2(dto.getPresentAddressLine2());
        employee.setPresentCity(dto.getPresentCity());
        employee.setPresentCountry(dto.getPresentCountry());
        employee.setPresentState(dto.getPresentState());
        employee.setPresentPostalCode(dto.getPresentPostalCode());
        employee.setSameAsPresentAddress(dto.getSameAsPresentAddress());
        employee.setPermanentAddressLine1(dto.getPermanentAddressLine1());
        employee.setPermanentAddressLine2(dto.getPermanentAddressLine2());
        employee.setPermanentCity(dto.getPermanentCity());
        employee.setPermanentCountry(dto.getPermanentCountry());
        employee.setPermanentState(dto.getPermanentState());
        employee.setPermanentPostalCode(dto.getPermanentPostalCode());
        employee.setDateOfExit(dto.getDateOfExit());
        employee.setPhone(dto.getPhone());
        employee.setSalary(dto.getSalary());
        employee.setAvatar(dto.getAvatar());
        
        // Note: Shift is not set here as it requires a Shift entity, not just an ID
        // Use a separate service method to set the shift using the shiftId if needed
        
        // Map collections if they exist in the DTO
        if (dto.getWorkExperiences() != null && !dto.getWorkExperiences().isEmpty()) {
            List<WorkExperience> workExperiences = dto.getWorkExperiences().stream()
                .map(workExpDto -> {
                    WorkExperience we = new WorkExperience();
                    we.setId(workExpDto.getId());
                    we.setCompanyName(workExpDto.getCompanyName());
                    we.setJobTitle(workExpDto.getJobTitle());
                    we.setFromDate(workExpDto.getFromDate());
                    we.setToDate(workExpDto.getToDate());
                    we.setJobDescription(workExpDto.getJobDescription());
                    we.setRelevant(workExpDto.isRelevant());
                    we.setEmployee(employee);
                    return we;
                })
                .collect(Collectors.toList());
            employee.setWorkExperiences(workExperiences);
        }
        
        if (dto.getEducationDetails() != null && !dto.getEducationDetails().isEmpty()) {
            List<EducationDetail> educationDetails = dto.getEducationDetails().stream()
                .map(eduDto -> {
                    EducationDetail ed = new EducationDetail();
                    ed.setId(eduDto.getId());
                    ed.setInstitutionName(eduDto.getInstitutionName());
                    ed.setDegree(eduDto.getDegree());
                    ed.setFromDate(eduDto.getFromDate());
                    ed.setToDate(eduDto.getToDate());
                    ed.setEmployee(employee);
                    return ed;
                })
                .collect(Collectors.toList());
            employee.setEducationDetails(educationDetails);
        }
        
        if (dto.getDependentDetails() != null && !dto.getDependentDetails().isEmpty()) {
            List<DependentDetail> dependentDetails = dto.getDependentDetails().stream()
                .map(depDto -> {
                    DependentDetail dd = new DependentDetail();
                    dd.setId(depDto.getId());
                    dd.setDependentName(depDto.getDependentName());
                    dd.setRelationship(depDto.getRelationship());
                    dd.setDateOfBirth(depDto.getDateOfBirth());
                    dd.setEmployee(employee);
                    return dd;
                })
                .collect(Collectors.toList());
            employee.setDependentDetails(dependentDetails);
        }
        
        return employee;
    }


    public static List<EmployeeDTO> toDTOList(List<Employee> employees) {
        return employees.stream().map(EmployeeMapper::toDTO).collect(Collectors.toList());
    }
}
