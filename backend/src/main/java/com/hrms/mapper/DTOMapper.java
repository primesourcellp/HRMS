package com.hrms.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.hrms.dto.PayrollDTO;
import com.hrms.dto.UserDTO;
import com.hrms.entity.Payroll;
import com.hrms.entity.User;

public class DTOMapper {

    // User mapping methods
    public static UserDTO toUserDTO(User user) {
        if (user == null) {
            return null;
        }
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setName(user.getName());
        dto.setActive(user.getActive());
        dto.setClient(user.getClient());
        dto.setDateOfJoining(user.getDateOfJoining());
        dto.setDepartment(user.getDepartment());
        dto.setLocation(user.getLocation());
        dto.setDesignation(user.getDesignation());
        dto.setEmployeeId(user.getEmployeeId());
        return dto;
    }

    public static List<UserDTO> toUserDTOList(List<User> users) {
        if (users == null) {
            return List.of();
        }
        return users.stream()
                .map(DTOMapper::toUserDTO)
                .collect(Collectors.toList());
    }


    // Payroll mapping methods
    public static PayrollDTO toPayrollDTO(Payroll payroll) {
        if (payroll == null) {
            return null;
        }
        PayrollDTO dto = new PayrollDTO();
        dto.setId(payroll.getId());
        dto.setEmployeeId(payroll.getEmployeeId());
        dto.setMonth(payroll.getMonth());
        dto.setYear(payroll.getYear());
        dto.setStartDate(payroll.getStartDate());
        dto.setEndDate(payroll.getEndDate());
        dto.setBaseSalary(payroll.getBaseSalary());
        dto.setAllowances(payroll.getAllowances());
        dto.setDeductions(payroll.getDeductions());
        dto.setBonus(payroll.getBonus());
        dto.setAmount(payroll.getAmount());
        dto.setNetSalary(payroll.getNetSalary());
        dto.setStatus(payroll.getStatus());
        dto.setNotes(payroll.getNotes());
        return dto;
    }

    public static List<PayrollDTO> toPayrollDTOList(List<Payroll> payrolls) {
        if (payrolls == null) {
            return List.of();
        }
        return payrolls.stream()
                .map(DTOMapper::toPayrollDTO)
                .collect(Collectors.toList());
    }
}

