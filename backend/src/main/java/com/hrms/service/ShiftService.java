package com.hrms.service;

import com.hrms.entity.Shift;
import com.hrms.repository.ShiftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Service
public class ShiftService {

    @Autowired
    private ShiftRepository shiftRepository;

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
        return shiftRepository.save(shift);
    }

    public Shift updateShift(Long id, Shift shiftDetails) {
        Shift shift = shiftRepository.findById(id)
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

        return shiftRepository.save(shift);
    }

    public void deleteShift(Long id) {
        shiftRepository.deleteById(id);
    }

    public Optional<Shift> getShiftById(Long id) {
        return shiftRepository.findById(id);
    }
}

