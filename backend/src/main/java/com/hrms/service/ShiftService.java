package com.hrms.service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.entity.User;
import com.hrms.entity.Shift;
import com.hrms.repository.UserRepository;
import com.hrms.repository.ShiftRepository;

@Service
public class ShiftService {

    @Autowired
    private ShiftRepository shiftRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    public List<Shift> getActiveShifts() {
        return shiftRepository.findByActiveTrue();
    }

    public Shift createShift(Shift shift) {
        // Calculate working hours
        if (shift.getStartTime() != null && shift.getEndTime() != null) {
            Duration duration = Duration.between(shift.getStartTime(), shift.getEndTime());
            double hours = duration.toMinutes() / 60.0;
            if (shift.getBreakDuration() != null) {
                hours -= (shift.getBreakDuration() / 60.0);
            }
            shift.setWorkingHours(hours);
        }
        return shiftRepository.save(java.util.Objects.requireNonNull(shift));
    }

    public Shift updateShift(@NonNull Long id, Shift shiftDetails) {
        Shift shift = shiftRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        shift.setName(shiftDetails.getName());
        shift.setStartTime(shiftDetails.getStartTime());
        shift.setEndTime(shiftDetails.getEndTime());
        shift.setBreakDuration(shiftDetails.getBreakDuration());
        shift.setDescription(shiftDetails.getDescription());
        shift.setActive(shiftDetails.getActive());

        // Recalculate working hours
        if (shift.getStartTime() != null && shift.getEndTime() != null) {
            Duration duration = Duration.between(shift.getStartTime(), shift.getEndTime());
            double hours = duration.toMinutes() / 60.0;
            if (shift.getBreakDuration() != null) {
                hours -= (shift.getBreakDuration() / 60.0);
            }
            shift.setWorkingHours(hours);
        }

        return shiftRepository.save(java.util.Objects.requireNonNull(shift));
    }

    public void deleteShift(@NonNull Long id) {
        shiftRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public Optional<Shift> getShiftById(@NonNull Long id) {
        return shiftRepository.findById(java.util.Objects.requireNonNull(id));
    }
    
    public List<User> getEmployeesByShiftId(@NonNull Long shiftId) {
        return userRepository.findByShiftId(java.util.Objects.requireNonNull(shiftId));
    }
    
    @Transactional
    public void assignEmployeeToShift(@NonNull Long employeeId, @NonNull Long shiftId) {
        assignEmployeeToShift(employeeId, shiftId, null, null);
    }
    
    @Transactional
    public void assignEmployeeToShift(@NonNull Long employeeId, @NonNull Long shiftId, String startDate, String endDate) {
        // Verify employee exists
        userRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Verify shift exists
        shiftRepository.findById(java.util.Objects.requireNonNull(shiftId))
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        
        // Validate dates if provided
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate.parse(startDate);
            } catch (Exception e) {
                throw new RuntimeException("Invalid start date format. Use YYYY-MM-DD");
            }
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate.parse(endDate);
                if (startDate != null && !startDate.isEmpty() && endDate.compareTo(startDate) < 0) {
                    throw new RuntimeException("End date must be after start date");
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException("Invalid end date format. Use YYYY-MM-DD");
            }
        }
        
        // Parse dates
        java.time.LocalDate start = null;
        java.time.LocalDate end = null;
        
        if (startDate != null && !startDate.isEmpty()) {
            start = java.time.LocalDate.parse(startDate);
        } else {
            start = java.time.LocalDate.now(); // Default to today if not provided
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            end = java.time.LocalDate.parse(endDate);
        }
        
        // Update employee's shift_id with assignment dates
        if (start != null || end != null) {
            userRepository.updateEmployeeShiftIdWithDates(employeeId, shiftId, start, end);
        } else {
            userRepository.updateEmployeeShiftId(employeeId, shiftId);
        }
    }
    
    @Transactional
    public void updateEmployeeAssignment(@NonNull Long employeeId, @NonNull Long shiftId, String startDate, String endDate) {
        // Verify employee exists
        userRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Verify shift exists
        shiftRepository.findById(java.util.Objects.requireNonNull(shiftId))
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        
        // Validate dates if provided
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate.parse(startDate);
            } catch (Exception e) {
                throw new RuntimeException("Invalid start date format. Use YYYY-MM-DD");
            }
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate.parse(endDate);
                if (startDate != null && !startDate.isEmpty() && endDate.compareTo(startDate) < 0) {
                    throw new RuntimeException("End date must be after start date");
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException("Invalid end date format. Use YYYY-MM-DD");
            }
        }
        
        // Parse dates
        java.time.LocalDate start = null;
        java.time.LocalDate end = null;
        
        if (startDate != null && !startDate.isEmpty()) {
            start = java.time.LocalDate.parse(startDate);
        } else {
            start = java.time.LocalDate.now(); // Default to today if not provided
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            end = java.time.LocalDate.parse(endDate);
        }
        
        // Update employee's shift assignment dates
        if (start != null || end != null) {
            userRepository.updateEmployeeShiftIdWithDates(employeeId, shiftId, start, end);
        } else {
            userRepository.updateEmployeeShiftId(employeeId, shiftId);
        }
    }
    
    @Transactional
    public void unassignEmployeeFromShift(@NonNull Long employeeId) {
        // Verify employee exists
        userRepository.findById(java.util.Objects.requireNonNull(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Remove shift assignment using native query
        userRepository.removeEmployeeShiftId(employeeId);
    }
    
    public Optional<Shift> getShiftByEmployeeId(@NonNull Long employeeId) {
        try {
            // Get shift_id for employee using native query
            Long shiftId = userRepository.getShiftIdByEmployeeId(java.util.Objects.requireNonNull(employeeId));
            
            if (shiftId == null || shiftId == 0) {
                return Optional.empty();
            }
            
            // Get shift by ID
            Optional<Shift> shift = shiftRepository.findById(shiftId);
            
            if (shift.isEmpty()) {
                // Shift ID exists but shift not found - might be deleted
                return Optional.empty();
            }
            
            return shift;
        } catch (Exception e) {
            // Log error and return empty
            System.err.println("Error getting shift for employee " + employeeId + ": " + e.getMessage());
            e.printStackTrace();
            return Optional.empty();
        }
    }
    
    public java.util.Map<String, Object> getShiftWithAssignmentDatesByEmployeeId(@NonNull Long employeeId) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        
        try {
            // Get user to retrieve assignment dates
            Optional<User> userOpt = userRepository.findById(employeeId);
            if (userOpt.isEmpty()) {
                return result;
            }
            
            User user = userOpt.get();
            
            // Get shift
            Optional<Shift> shiftOpt = getShiftByEmployeeId(employeeId);
            if (shiftOpt.isEmpty()) {
                return result;
            }
            
            Shift shift = shiftOpt.get();
            
            // Create a map with shift data and assignment dates
            result.put("id", shift.getId());
            result.put("name", shift.getName());
            result.put("startTime", shift.getStartTime());
            result.put("endTime", shift.getEndTime());
            result.put("breakDuration", shift.getBreakDuration());
            result.put("workingHours", shift.getWorkingHours());
            result.put("description", shift.getDescription());
            result.put("active", shift.getActive());
            
            // Convert LocalDate to String for JSON serialization
            java.time.LocalDate startDate = user.getShiftAssignmentStartDate();
            java.time.LocalDate endDate = user.getShiftAssignmentEndDate();
            
            result.put("assignmentStartDate", startDate != null ? startDate.toString() : null);
            result.put("assignmentEndDate", endDate != null ? endDate.toString() : null);
            
            return result;
        } catch (Exception e) {
            System.err.println("Error getting shift with assignment dates for employee " + employeeId + ": " + e.getMessage());
            e.printStackTrace();
            return result;
        }
    }
}

