package com.hrms.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.hrms.dto.ApplicantDTO;
import com.hrms.dto.AttendanceDTO;
import com.hrms.dto.EmployeeDTO;
import com.hrms.dto.EmployeeDocumentDTO;
import com.hrms.dto.HRTicketDTO;
import com.hrms.dto.HolidayDTO;
import com.hrms.dto.JobPostingDTO;
import com.hrms.dto.LeaveBalanceDTO;
import com.hrms.dto.LeaveDTO;
import com.hrms.dto.LeaveTypeDTO;
import com.hrms.dto.PayrollDTO;
import com.hrms.dto.PerformanceDTO;
import com.hrms.dto.SalaryStructureDTO;
import com.hrms.dto.ShiftDTO;
import com.hrms.dto.UserDTO;
import com.hrms.entity.Applicant;
import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.entity.EmployeeDocument;
import com.hrms.entity.HRTicket;
import com.hrms.entity.Holiday;
import com.hrms.entity.JobPosting;
import com.hrms.entity.Leave;
import com.hrms.entity.LeaveBalance;
import com.hrms.entity.LeaveType;
import com.hrms.entity.Payroll;
import com.hrms.entity.Performance;
import com.hrms.entity.SalaryStructure;
import com.hrms.entity.Shift;
import com.hrms.entity.User;

public class DTOMapper {

    // Employee Mappers
    public static EmployeeDTO toEmployeeDTO(Employee employee) {
        if (employee == null) return null;
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setNickName(employee.getNickName());
        dto.setEmail(employee.getEmail());
        dto.setRole(employee.getRole());
        dto.setDepartment(employee.getDepartment());
        dto.setLocation(employee.getLocation());
        dto.setDesignation(employee.getDesignation());
        dto.setEmploymentType(employee.getEmploymentType());
        dto.setEmployeeStatus(employee.getEmployeeStatus());
        dto.setSourceOfHire(employee.getSourceOfHire());
        dto.setDateOfJoining(employee.getDateOfJoining());
        dto.setSalary(employee.getSalary());
        dto.setDateOfBirth(employee.getDateOfBirth());
        dto.setAge(employee.getAge());
        dto.setGender(employee.getGender());
        dto.setMaritalStatus(employee.getMaritalStatus());
        dto.setAboutMe(employee.getAboutMe());
        dto.setExpertise(employee.getExpertise());
        dto.setUan(employee.getUan());
        dto.setPan(employee.getPan());
        dto.setAadhaar(employee.getAadhaar());
        dto.setWorkPhoneNumber(employee.getWorkPhoneNumber());
        dto.setPersonalMobileNumber(employee.getPersonalMobileNumber());
        dto.setExtension(employee.getExtension());
        dto.setPersonalEmailAddress(employee.getPersonalEmailAddress());
        dto.setSeatingLocation(employee.getSeatingLocation());
        dto.setTags(employee.getTags());
        dto.setPresentAddressLine1(employee.getPresentAddressLine1());
        dto.setPresentAddressLine2(employee.getPresentAddressLine2());
        dto.setPresentCity(employee.getPresentCity());
        dto.setPresentCountry(employee.getPresentCountry());
        dto.setPresentState(employee.getPresentState());
        dto.setPresentPostalCode(employee.getPresentPostalCode());
        dto.setSameAsPresentAddress(employee.getSameAsPresentAddress());
        dto.setPermanentAddressLine1(employee.getPermanentAddressLine1());
        dto.setPermanentAddressLine2(employee.getPermanentAddressLine2());
        dto.setPermanentCity(employee.getPermanentCity());
        dto.setPermanentCountry(employee.getPermanentCountry());
        dto.setPermanentState(employee.getPermanentState());
        dto.setPermanentPostalCode(employee.getPermanentPostalCode());
        dto.setDateOfExit(employee.getDateOfExit());
        dto.setPhone(employee.getPhone());
        
        dto.setAvatar(employee.getAvatar());
        dto.setShiftId(employee.getShift() != null ? employee.getShift().getId() : null);
        // Map work experiences, education, dependents if needed
        return dto;
    }

    public static List<EmployeeDTO> toEmployeeDTOList(List<Employee> employees) {
        if (employees == null) return null;
        return employees.stream()
            .map(DTOMapper::toEmployeeDTO)
            .collect(Collectors.toList());
    }

    // User Mappers
    public static UserDTO toUserDTO(User user) {
        if (user == null) return null;
        return new UserDTO(
            user.getId(),
            user.getEmail(),
            user.getRole(),
            user.getName(),
            user.getActive()
        );
    }

    public static List<UserDTO> toUserDTOList(List<User> users) {
        if (users == null) return null;
        return users.stream()
            .map(DTOMapper::toUserDTO)
            .collect(Collectors.toList());
    }

    // Attendance Mappers
    public static AttendanceDTO toAttendanceDTO(Attendance attendance) {
        if (attendance == null) return null;
        return new AttendanceDTO(
            attendance.getId(),
            attendance.getEmployeeId(),
            attendance.getDate(),
            attendance.getStatus(),
            attendance.getCheckIn(),
            attendance.getCheckOut(),
            attendance.getShiftId(),
            attendance.getWorkingHours(),
            attendance.getOvertimeHours(),
            attendance.getUndertimeHours(),
            attendance.getCheckInLatitude(),
            attendance.getCheckInLongitude(),
            attendance.getCheckOutLatitude(),
            attendance.getCheckOutLongitude(),
            attendance.getCheckInLocation(),
            attendance.getCheckOutLocation(),
            attendance.getCheckInIpAddress(),
            attendance.getCheckOutIpAddress(),
            attendance.getCheckInMethod(),
            attendance.getCheckOutMethod()
        );
    }

    public static List<AttendanceDTO> toAttendanceDTOList(List<Attendance> attendances) {
        if (attendances == null) return null;
        return attendances.stream()
            .map(DTOMapper::toAttendanceDTO)
            .collect(Collectors.toList());
    }

    // Leave Mappers
    public static LeaveDTO toLeaveDTO(Leave leave) {
        if (leave == null) return null;
        return new LeaveDTO(
            leave.getId(),
            leave.getEmployeeId(),
            leave.getLeaveTypeId(),
            leave.getType(),
            leave.getStartDate(),
            leave.getEndDate(),
            leave.getTotalDays(),
            leave.getReason(),
            leave.getStatus(),
            leave.getAppliedDate(),
            leave.getApprovedBy(),
            leave.getApprovedDate(),
            leave.getRejectionReason(),
            leave.getHalfDay(),
            leave.getHalfDayType()
        );
    }

    public static List<LeaveDTO> toLeaveDTOList(List<Leave> leaves) {
        if (leaves == null) return null;
        return leaves.stream()
            .map(DTOMapper::toLeaveDTO)
            .collect(Collectors.toList());
    }

    // Payroll Mappers
    public static PayrollDTO toPayrollDTO(Payroll payroll) {
        if (payroll == null) return null;
        return new PayrollDTO(
            payroll.getId(),
            payroll.getEmployeeId(),
            payroll.getMonth(),
            payroll.getYear(),
            payroll.getStartDate(),
            payroll.getEndDate(),
            payroll.getBaseSalary(),
            payroll.getAllowances(),
            payroll.getDeductions(),
            payroll.getBonus(),
            payroll.getAmount(),
            payroll.getNetSalary(),
            payroll.getStatus(),
            payroll.getNotes()
        );
    }

    public static List<PayrollDTO> toPayrollDTOList(List<Payroll> payrolls) {
        if (payrolls == null) return null;
        return payrolls.stream()
            .map(DTOMapper::toPayrollDTO)
            .collect(Collectors.toList());
    }

    // Performance Mappers
    public static PerformanceDTO toPerformanceDTO(Performance performance) {
        if (performance == null) return null;
        return new PerformanceDTO(
            performance.getId(),
            performance.getEmployeeId(),
            performance.getReviewDate(),
            performance.getPeriod(),
            performance.getRating(),
            performance.getGoals(),
            performance.getAchievements(),
            performance.getFeedback(),
            performance.getAreasForImprovement()
        );
    }

    public static List<PerformanceDTO> toPerformanceDTOList(List<Performance> performances) {
        if (performances == null) return null;
        return performances.stream()
            .map(DTOMapper::toPerformanceDTO)
            .collect(Collectors.toList());
    }

    // HRTicket Mappers
    public static HRTicketDTO toHRTicketDTO(HRTicket ticket) {
        if (ticket == null) return null;
        return new HRTicketDTO(
            ticket.getId(),
            ticket.getEmployeeId(),
            ticket.getTicketType(),
            ticket.getSubject(),
            ticket.getDescription(),
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getAssignedTo(),
            ticket.getCreatedAt(),
            ticket.getUpdatedAt(),
            ticket.getResolvedAt(),
            ticket.getResolution()
        );
    }

    public static List<HRTicketDTO> toHRTicketDTOList(List<HRTicket> tickets) {
        if (tickets == null) return null;
        return tickets.stream()
            .map(DTOMapper::toHRTicketDTO)
            .collect(Collectors.toList());
    }

    // SalaryStructure Mappers
    public static SalaryStructureDTO toSalaryStructureDTO(SalaryStructure structure) {
        if (structure == null) return null;
        return new SalaryStructureDTO(
            structure.getId(),
            structure.getEmployeeId(),
            structure.getBasicSalary(),
            structure.getHra(),
            structure.getTransportAllowance(),
            structure.getMedicalAllowance(),
            structure.getSpecialAllowance(),
            structure.getOtherAllowances(),
            structure.getPf(),
            structure.getEsi(),
            structure.getTds(),
            structure.getProfessionalTax(),
            structure.getOtherDeductions(),
            structure.getGrossSalary(),
            structure.getNetSalary(),
            structure.getEffectiveFrom(),
            structure.getEffectiveTo(),
            structure.getActive()
        );
    }

    public static List<SalaryStructureDTO> toSalaryStructureDTOList(List<SalaryStructure> structures) {
        if (structures == null) return null;
        return structures.stream()
            .map(DTOMapper::toSalaryStructureDTO)
            .collect(Collectors.toList());
    }

    // Shift Mappers
    public static ShiftDTO toShiftDTO(Shift shift) {
        if (shift == null) return null;
        return new ShiftDTO(
            shift.getId(),
            shift.getName(),
            shift.getStartTime(),
            shift.getEndTime(),
            shift.getBreakDuration(),
            shift.getWorkingHours(),
            shift.getDescription(),
            shift.getActive()
        );
    }

    public static List<ShiftDTO> toShiftDTOList(List<Shift> shifts) {
        if (shifts == null) return null;
        return shifts.stream()
            .map(DTOMapper::toShiftDTO)
            .collect(Collectors.toList());
    }

    // LeaveType Mappers
    public static LeaveTypeDTO toLeaveTypeDTO(LeaveType leaveType) {
        if (leaveType == null) return null;
        return new LeaveTypeDTO(
            leaveType.getId(),
            leaveType.getName(),
            leaveType.getCode(),
            leaveType.getMaxDays(),
            leaveType.getCarryForward(),
            leaveType.getMaxCarryForward(),
            leaveType.getDescription(),
            leaveType.getActive()
        );
    }

    public static List<LeaveTypeDTO> toLeaveTypeDTOList(List<LeaveType> leaveTypes) {
        if (leaveTypes == null) return null;
        return leaveTypes.stream()
            .map(DTOMapper::toLeaveTypeDTO)
            .collect(Collectors.toList());
    }

    // EmployeeDocument Mappers
    public static EmployeeDocumentDTO toEmployeeDocumentDTO(EmployeeDocument document) {
        if (document == null) return null;
        return new EmployeeDocumentDTO(
            document.getId(),
            document.getEmployeeId(),
            document.getDocumentType(),
            document.getFileName(),
            document.getFilePath(),
            document.getFileSize(),
            document.getMimeType(),
            document.getDescription(),
            document.getUploadedAt(),
            document.getVerified()
        );
    }

    public static List<EmployeeDocumentDTO> toEmployeeDocumentDTOList(List<EmployeeDocument> documents) {
        if (documents == null) return null;
        return documents.stream()
            .map(DTOMapper::toEmployeeDocumentDTO)
            .collect(Collectors.toList());
    }

    // Holiday Mappers
    public static HolidayDTO toHolidayDTO(Holiday holiday) {
        if (holiday == null) return null;
        return new HolidayDTO(
            holiday.getId(),
            holiday.getName(),
            holiday.getDate(),
            holiday.getYear(),
            holiday.getIsNational(),
            holiday.getDescription()
        );
    }

    public static List<HolidayDTO> toHolidayDTOList(List<Holiday> holidays) {
        if (holidays == null) return null;
        return holidays.stream()
            .map(DTOMapper::toHolidayDTO)
            .collect(Collectors.toList());
    }

    // JobPosting Mappers
    public static JobPostingDTO toJobPostingDTO(JobPosting jobPosting) {
        if (jobPosting == null) return null;
        return new JobPostingDTO(
            jobPosting.getId(),
            jobPosting.getTitle(),
            jobPosting.getDepartment(),
            jobPosting.getPosition(),
            jobPosting.getJobType(),
            jobPosting.getExperienceRequired(),
            jobPosting.getDescription(),
            jobPosting.getRequirements(),
            jobPosting.getPostedDate(),
            jobPosting.getClosingDate(),
            jobPosting.getStatus(),
            jobPosting.getNoOfVacancies(),
            jobPosting.getPostedBy()
        );
    }

    public static List<JobPostingDTO> toJobPostingDTOList(List<JobPosting> jobPostings) {
        if (jobPostings == null) return null;
        return jobPostings.stream()
            .map(DTOMapper::toJobPostingDTO)
            .collect(Collectors.toList());
    }

    // Applicant Mappers
    public static ApplicantDTO toApplicantDTO(Applicant applicant) {
        if (applicant == null) return null;
        return new ApplicantDTO(
            applicant.getId(),
            applicant.getJobPostingId(),
            applicant.getName(),
            applicant.getEmail(),
            applicant.getPhone(),
            applicant.getResumePath(),
            applicant.getCoverLetter(),
            applicant.getAppliedDate(),
            applicant.getStatus(),
            applicant.getScreeningScore(),
            applicant.getInterviewDate(),
            applicant.getInterviewFeedback(),
            applicant.getOfferLetterPath()
        );
    }

    public static List<ApplicantDTO> toApplicantDTOList(List<Applicant> applicants) {
        if (applicants == null) return null;
        return applicants.stream()
            .map(DTOMapper::toApplicantDTO)
            .collect(Collectors.toList());
    }

    // LeaveBalance Mappers
    public static LeaveBalanceDTO toLeaveBalanceDTO(LeaveBalance leaveBalance) {
        if (leaveBalance == null) return null;
        return new LeaveBalanceDTO(
            leaveBalance.getId(),
            leaveBalance.getEmployeeId(),
            leaveBalance.getLeaveTypeId(),
            leaveBalance.getYear(),
            leaveBalance.getTotalDays(),
            leaveBalance.getUsedDays(),
            leaveBalance.getCarriedForward(),
            leaveBalance.getBalance(),
            leaveBalance.getLastUpdated()
        );
    }

    public static List<LeaveBalanceDTO> toLeaveBalanceDTOList(List<LeaveBalance> leaveBalances) {
        if (leaveBalances == null) return null;
        return leaveBalances.stream()
            .map(DTOMapper::toLeaveBalanceDTO)
            .collect(Collectors.toList());
    }
}

