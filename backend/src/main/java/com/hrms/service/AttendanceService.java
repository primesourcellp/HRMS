package com.hrms.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.Attendance;
import com.hrms.entity.Shift;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.ShiftRepository;

@Service
public class AttendanceService {
    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public Optional<Attendance> getAttendanceById(Long id) {
        return attendanceRepository.findById(id);
    }

    public Attendance checkIn(Long employeeId, LocalDate date, LocalTime checkInTime, 
                             Long shiftId, Double latitude, Double longitude, 
                             String location, String ipAddress, String method) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, date);
        
        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
        } else {
            attendance = new Attendance();
            attendance.setEmployeeId(employeeId);
            attendance.setDate(date);
            attendance.setStatus("Present");
        }
        
        attendance.setCheckIn(checkInTime);
        attendance.setShiftId(shiftId);
        attendance.setCheckInLatitude(latitude);
        attendance.setCheckInLongitude(longitude);
        attendance.setCheckInLocation(location);
        attendance.setCheckInIpAddress(ipAddress); // Store IP address for laptop/desktop tracking
        attendance.setCheckInMethod(method != null ? method : "WEB");
        
        return attendanceRepository.save(attendance);
    }

    public Attendance checkOut(Long employeeId, LocalDate date, LocalTime checkOutTime,
                              Double latitude, Double longitude, String location, 
                              String ipAddress, String method) {
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, date)
                .orElseThrow(() -> new RuntimeException("No check-in found for this date"));

        attendance.setCheckOut(checkOutTime);
        attendance.setCheckOutLatitude(latitude);
        attendance.setCheckOutLongitude(longitude);
        attendance.setCheckOutLocation(location);
        attendance.setCheckOutIpAddress(ipAddress); // Store IP address for laptop/desktop tracking
        attendance.setCheckOutMethod(method != null ? method : "WEB");

        // Calculate working hours, overtime, and undertime automatically
        calculateWorkingHours(attendance);

        return attendanceRepository.save(attendance);
    }

    private void calculateWorkingHours(Attendance attendance) {
        if (attendance.getCheckIn() != null && attendance.getCheckOut() != null) {
            Duration duration = Duration.between(attendance.getCheckIn(), attendance.getCheckOut());
            double totalMinutes = duration.toMinutes();
            double workingHours = totalMinutes / 60.0;
            attendance.setWorkingHours(workingHours);

            // Get shift details if available
            if (attendance.getShiftId() != null) {
                Optional<Shift> shiftOpt = shiftRepository.findById(attendance.getShiftId());
                if (shiftOpt.isPresent()) {
                    Shift shift = shiftOpt.get();
                    double expectedHours = shift.getWorkingHours() != null ? shift.getWorkingHours() : 8.0;
                    
                    if (workingHours > expectedHours) {
                        attendance.setOvertimeHours(workingHours - expectedHours);
                        attendance.setUndertimeHours(0.0);
                    } else {
                        attendance.setOvertimeHours(0.0);
                        attendance.setUndertimeHours(expectedHours - workingHours);
                    }
                }
            }
        }
    }

    public Attendance markAttendance(Long employeeId, LocalDate date, String status, String checkIn, String checkOut) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, date);
        
        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
        } else {
            attendance = new Attendance();
            attendance.setEmployeeId(employeeId);
            attendance.setDate(date);
        }
        
        attendance.setStatus(status);
        if (checkIn != null && !checkIn.isEmpty()) {
            attendance.setCheckIn(LocalTime.parse(checkIn));
        }
        if (checkOut != null && !checkOut.isEmpty()) {
            attendance.setCheckOut(LocalTime.parse(checkOut));
            calculateWorkingHours(attendance);
        }
        
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    public List<Attendance> getAttendanceByEmployeeId(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    public List<Attendance> getAttendanceByEmployeeIdAndDateRange(Long employeeId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);
    }

    public double getWeeklyHours(Long employeeId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, weekStart, weekEnd);
        return attendances.stream()
                .filter(a -> a.getWorkingHours() != null)
                .mapToDouble(Attendance::getWorkingHours)
                .sum();
    }
}

