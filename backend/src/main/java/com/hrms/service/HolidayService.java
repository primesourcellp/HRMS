package com.hrms.service;

import com.hrms.entity.Holiday;
import com.hrms.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.util.List;

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
        if (holiday.getYear() == null && holiday.getDate() != null) {
            holiday.setYear(holiday.getDate().getYear());
        }
        return holidayRepository.save(holiday);
    }

    public Holiday updateHoliday(@NonNull Long id, Holiday holidayDetails) {
        Holiday holiday = holidayRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Holiday not found"));

        holiday.setName(holidayDetails.getName());
        holiday.setDate(holidayDetails.getDate());
        holiday.setYear(holidayDetails.getYear());
        holiday.setIsNational(holidayDetails.getIsNational());
        holiday.setDescription(holidayDetails.getDescription());

        return holidayRepository.save(java.util.Objects.requireNonNull(holiday));
    }

    public void deleteHoliday(@NonNull Long id) {
        holidayRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public boolean isHoliday(LocalDate date) {
        return !holidayRepository.findByDateBetween(date, date).isEmpty();
    }
}
