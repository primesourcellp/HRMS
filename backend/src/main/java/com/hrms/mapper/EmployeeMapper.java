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
        dto.setDepartment(e.getDepartment());
        dto.setLocation(e.getLocation());
        dto.setDesignation(e.getDesignation());
        dto.setEmploymentType(e.getEmploymentType());
        dto.setEmployeeStatus(e.getEmployeeStatus());
        dto.setSourceOfHire(e.getSourceOfHire());
        dto.setDateOfJoining(e.getDateOfJoining());
        dto.setSalary(e.getSalary());
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
        
        dto.setAvatar(e.getAvatar());
        dto.setShiftId(e.getShift() != null ? e.getShift().getId() : null);
        return dto;
    }


    public static List<EmployeeDTO> toDTOList(List<Employee> employees) {
        return employees.stream().map(EmployeeMapper::toDTO).collect(Collectors.toList());
    }
}
