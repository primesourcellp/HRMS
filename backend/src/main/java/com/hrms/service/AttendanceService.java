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

<<<<<<< HEAD
    public Optional<Attendance> getAttendanceById(long id) {
        return attendanceRepository.findById(java.lang.Long.valueOf(id));
    }

    public Attendance checkIn(long employeeId, LocalDate date, LocalTime checkInTime, 
=======
    public Optional<Attendance> getAttendanceById(Long id) {
        return attendanceRepository.findById(id);
    }

    public Attendance checkIn(Long employeeId, LocalDate date, LocalTime checkInTime, 
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
    public Attendance checkOut(long employeeId, LocalDate date, LocalTime checkOutTime,
=======
    public Attendance checkOut(Long employeeId, LocalDate date, LocalTime checkOutTime,
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
    private void calculateWorkingHours(@org.springframework.lang.NonNull Attendance attendance) {
=======
    private void calculateWorkingHours(Attendance attendance) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        if (attendance.getCheckIn() != null && attendance.getCheckOut() != null) {
            Duration duration = Duration.between(attendance.getCheckIn(), attendance.getCheckOut());
            double totalMinutes = duration.toMinutes();
            double workingHours = totalMinutes / 60.0;
            attendance.setWorkingHours(workingHours);

            // Get shift details if available
            if (attendance.getShiftId() != null) {
<<<<<<< HEAD
                Optional<Shift> shiftOpt = shiftRepository.findById(java.util.Objects.requireNonNull(attendance.getShiftId()));
=======
                Optional<Shift> shiftOpt = shiftRepository.findById(attendance.getShiftId());
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
    public Attendance markAttendance(long employeeId, LocalDate date, String status, String checkIn, String checkOut) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(java.lang.Long.valueOf(employeeId), date);
=======
    public Attendance markAttendance(Long employeeId, LocalDate date, String status, String checkIn, String checkOut) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, date);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        
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

<<<<<<< HEAD
    public List<Attendance> getAttendanceByEmployeeId(long employeeId) {
        return attendanceRepository.findByEmployeeId(java.lang.Long.valueOf(employeeId));
    }

    public List<Attendance> getAttendanceByEmployeeIdAndDateRange(long employeeId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(java.lang.Long.valueOf(employeeId), startDate, endDate);
    }

    public double getWeeklyHours(long employeeId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetween(java.lang.Long.valueOf(employeeId), weekStart, weekEnd);
=======
    public List<Attendance> getAttendanceByEmployeeId(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    public List<Attendance> getAttendanceByEmployeeIdAndDateRange(Long employeeId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);
    }

    public double getWeeklyHours(Long employeeId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, weekStart, weekEnd);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        return attendances.stream()
                .filter(a -> a.getWorkingHours() != null)
                .mapToDouble(Attendance::getWorkingHours)
                .sum();
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
