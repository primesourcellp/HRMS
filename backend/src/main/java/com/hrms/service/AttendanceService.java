package com.hrms.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.Attendance;
import com.hrms.repository.AttendanceRepository;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public Optional<Attendance> getAttendanceById(long id) {
        return attendanceRepository.findById(Long.valueOf(id));
    }

    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    public List<Attendance> getAttendanceByEmployeeId(long employeeId) {
        return attendanceRepository.findByEmployeeId(Long.valueOf(employeeId));
    }

    public Attendance checkIn(long employeeId, LocalDate date, LocalTime checkInTime,
                              Long shiftId, Double latitude, Double longitude,
                              String location, String ipAddress, String method) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(
            Long.valueOf(employeeId), date);

        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            if (attendance.getCheckIn() != null) {
                throw new RuntimeException("Employee has already checked in for this date");
            }
        } else {
            attendance = new Attendance();
            attendance.setEmployeeId(Long.valueOf(employeeId));
            attendance.setDate(date);
            attendance.setStatus("Present");
        }

        attendance.setCheckIn(checkInTime);
        attendance.setShiftId(shiftId);
        attendance.setCheckInLatitude(latitude);
        attendance.setCheckInLongitude(longitude);
        attendance.setCheckInLocation(location);
        attendance.setCheckInIpAddress(ipAddress);
        attendance.setCheckInMethod(method);

        return attendanceRepository.save(attendance);
    }

    public Attendance checkOut(long employeeId, LocalDate date, LocalTime checkOutTime,
                               Double latitude, Double longitude, String location,
                               String ipAddress, String method) {
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(
            Long.valueOf(employeeId), date)
            .orElseThrow(() -> new RuntimeException("No check-in found for this date"));

        if (attendance.getCheckOut() != null) {
            throw new RuntimeException("Employee has already checked out for this date");
        }

        attendance.setCheckOut(checkOutTime);
        attendance.setCheckOutLatitude(latitude);
        attendance.setCheckOutLongitude(longitude);
        attendance.setCheckOutLocation(location);
        attendance.setCheckOutIpAddress(ipAddress);
        attendance.setCheckOutMethod(method);

        // Calculate working hours
        if (attendance.getCheckIn() != null && attendance.getCheckOut() != null) {
            long minutes = ChronoUnit.MINUTES.between(attendance.getCheckIn(), attendance.getCheckOut());
            double hours = minutes / 60.0;
            attendance.setWorkingHours(hours);
        }

        return attendanceRepository.save(attendance);
    }

    public double getWeeklyHours(long employeeId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetween(
            Long.valueOf(employeeId), weekStart, weekEnd);

        return attendances.stream()
            .filter(a -> a.getWorkingHours() != null)
            .mapToDouble(Attendance::getWorkingHours)
            .sum();
    }

    public Attendance markAttendance(long employeeId, LocalDate date, String status,
                                     String checkIn, String checkOut) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(
            Long.valueOf(employeeId), date);

        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
        } else {
            attendance = new Attendance();
            attendance.setEmployeeId(Long.valueOf(employeeId));
            attendance.setDate(date);
        }

        attendance.setStatus(status);
        if (checkIn != null) {
            attendance.setCheckIn(LocalTime.parse(checkIn));
        }
        if (checkOut != null) {
            attendance.setCheckOut(LocalTime.parse(checkOut));
            if (attendance.getCheckIn() != null) {
                long minutes = ChronoUnit.MINUTES.between(attendance.getCheckIn(), attendance.getCheckOut());
                double hours = minutes / 60.0;
                attendance.setWorkingHours(hours);
            }
        }

        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceByEmployeeIdAndDateRange(long employeeId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(Long.valueOf(employeeId), startDate, endDate);
    }

    public List<Attendance> getAttendanceByDateRange(LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findAll().stream()
            .filter(a -> {
                LocalDate date = a.getDate();
                return (date.isEqual(startDate) || date.isAfter(startDate)) 
                    && (date.isEqual(endDate) || date.isBefore(endDate));
            })
            .collect(java.util.stream.Collectors.toList());
    }
}

