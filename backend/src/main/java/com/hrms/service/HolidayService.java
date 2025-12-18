package com.hrms.service;

import com.hrms.entity.Holiday;
import com.hrms.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public List<Holiday> getHolidaysByYear(Integer year) {
        return holidayRepository.findByYear(year);
    }

    public List<Holiday> getHolidaysBetweenDates(LocalDate startDate, LocalDate endDate) {
        return holidayRepository.findByDateBetween(startDate, endDate);
    }

    public Holiday createHoliday(Holiday holiday) {
        return holidayRepository.save(java.util.Objects.requireNonNull(holiday));
    }

    public Holiday updateHoliday(@NonNull Long id, Holiday holidayDetails) {
        Holiday holiday = holidayRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Holiday not found"));

        holiday.setName(holidayDetails.getName());
        holiday.setDate(holidayDetails.getDate());
        holiday.setDescription(holidayDetails.getDescription());
        holiday.setYear(holidayDetails.getYear());

        return holidayRepository.save(java.util.Objects.requireNonNull(holiday));
    }

    public void deleteHoliday(@NonNull Long id) {
        holidayRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public Optional<Holiday> getHolidayById(@NonNull Long id) {
        return holidayRepository.findById(java.util.Objects.requireNonNull(id));
    }
}

