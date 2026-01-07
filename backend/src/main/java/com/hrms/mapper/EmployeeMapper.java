package com.hrms.mapper;

import com.hrms.dto.*;
import com.hrms.entity.*;
import java.util.List;
import java.util.stream.Collectors;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(User e) {
        if (e == null) return null;
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(e.getId());
        dto.setEmployeeId(e.getEmployeeId());
        dto.setName(e.getName());
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
        // Map work experiences - ensure empty list if null
        if (e.getWorkExperiences() != null && !e.getWorkExperiences().isEmpty()) {
            dto.setWorkExperiences(e.getWorkExperiences().stream().map(EmployeeMapper::toWorkExperienceDTO).collect(Collectors.toList()));
        } else {
            dto.setWorkExperiences(new java.util.ArrayList<>());
        }
        // Map education details - ensure empty list if null
        if (e.getEducationDetails() != null && !e.getEducationDetails().isEmpty()) {
            dto.setEducationDetails(e.getEducationDetails().stream().map(EmployeeMapper::toEducationDetailDTO).collect(Collectors.toList()));
        } else {
            dto.setEducationDetails(new java.util.ArrayList<>());
        }
        // Map dependent details - ensure empty list if null
        if (e.getDependentDetails() != null && !e.getDependentDetails().isEmpty()) {
            dto.setDependentDetails(e.getDependentDetails().stream().map(EmployeeMapper::toDependentDetailDTO).collect(Collectors.toList()));
        } else {
            dto.setDependentDetails(new java.util.ArrayList<>());
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
    
    public static User toEntity(EmployeeDTO dto) {
        if (dto == null) return null;
        
        User user = new User();
        
        // Map all fields from DTO to entity
        user.setId(dto.getId());
        user.setEmployeeId(dto.getEmployeeId());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(dto.getRole());
        user.setClient(dto.getClient());
        user.setDepartment(dto.getDepartment());
        user.setLocation(dto.getLocation());
        user.setDesignation(dto.getDesignation());
        user.setEmploymentType(dto.getEmploymentType());
        user.setEmployeeStatus(dto.getEmployeeStatus());
        user.setStatus(dto.getEmployeeStatus()); // Map to both status fields for backwards compatibility
        user.setSourceOfHire(dto.getSourceOfHire());
        user.setDateOfJoining(dto.getDateOfJoining());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setAge(dto.getAge());
        user.setGender(dto.getGender());
        user.setMaritalStatus(dto.getMaritalStatus());
        user.setAboutMe(dto.getAboutMe());
        user.setExpertise(dto.getExpertise());
        user.setPan(dto.getPan());
        user.setAadhaar(dto.getAadhaar());
        user.setWorkPhoneNumber(dto.getWorkPhoneNumber());
        user.setPersonalMobileNumber(dto.getPersonalMobileNumber());
        user.setExtension(dto.getExtension());
        user.setPersonalEmailAddress(dto.getPersonalEmailAddress());
        user.setSeatingLocation(dto.getSeatingLocation());
        user.setTags(dto.getTags());
        user.setPresentAddressLine1(dto.getPresentAddressLine1());
        user.setPresentAddressLine2(dto.getPresentAddressLine2());
        user.setPresentCity(dto.getPresentCity());
        user.setPresentCountry(dto.getPresentCountry());
        user.setPresentState(dto.getPresentState());
        user.setPresentPostalCode(dto.getPresentPostalCode());
        user.setSameAsPresentAddress(dto.getSameAsPresentAddress());
        user.setPermanentAddressLine1(dto.getPermanentAddressLine1());
        user.setPermanentAddressLine2(dto.getPermanentAddressLine2());
        user.setPermanentCity(dto.getPermanentCity());
        user.setPermanentCountry(dto.getPermanentCountry());
        user.setPermanentState(dto.getPermanentState());
        user.setPermanentPostalCode(dto.getPermanentPostalCode());
        user.setDateOfExit(dto.getDateOfExit());
        user.setPhone(dto.getPhone());
        user.setSalary(dto.getSalary());
        user.setAvatar(dto.getAvatar());
        
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
                    we.setEmployee(user);
                    return we;
                })
                .collect(Collectors.toList());
            user.setWorkExperiences(workExperiences);
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
                    ed.setEmployee(user);
                    return ed;
                })
                .collect(Collectors.toList());
            user.setEducationDetails(educationDetails);
        }
        
        if (dto.getDependentDetails() != null && !dto.getDependentDetails().isEmpty()) {
            List<DependentDetail> dependentDetails = dto.getDependentDetails().stream()
                .map(depDto -> {
                    DependentDetail dd = new DependentDetail();
                    dd.setId(depDto.getId());
                    dd.setDependentName(depDto.getDependentName());
                    dd.setRelationship(depDto.getRelationship());
                    dd.setDateOfBirth(depDto.getDateOfBirth());
                    dd.setEmployee(user);
                    return dd;
                })
                .collect(Collectors.toList());
            user.setDependentDetails(dependentDetails);
        }
        
        return user;
    }


    public static List<EmployeeDTO> toDTOList(List<User> users) {
        return users.stream().map(EmployeeMapper::toDTO).collect(Collectors.toList());
    }
}
