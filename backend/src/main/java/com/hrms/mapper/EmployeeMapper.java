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
        dto.setNickName(e.getNickName());
        dto.setEmail(e.getEmail());
        dto.setZohoRole(e.getZohoRole());
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
        dto.setUan(e.getUan());
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

    public static List<EmployeeDTO> toDTOList(List<Employee> employees) {
        return employees.stream().map(EmployeeMapper::toDTO).collect(Collectors.toList());
    }
}
