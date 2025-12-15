package com.hrms.service;

import com.hrms.entity.Shift;
import com.hrms.repository.ShiftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

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
}
