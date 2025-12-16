package com.hrms.service;

import com.hrms.entity.Holiday;
import com.hrms.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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

<<<<<<< HEAD
    public Holiday updateHoliday(@NonNull Long id, Holiday holidayDetails) {
        Holiday holiday = holidayRepository.findById(java.util.Objects.requireNonNull(id))
=======
    public Holiday updateHoliday(Long id, Holiday holidayDetails) {
        Holiday holiday = holidayRepository.findById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .orElseThrow(() -> new RuntimeException("Holiday not found"));

        holiday.setName(holidayDetails.getName());
        holiday.setDate(holidayDetails.getDate());
        holiday.setYear(holidayDetails.getYear());
        holiday.setIsNational(holidayDetails.getIsNational());
        holiday.setDescription(holidayDetails.getDescription());

<<<<<<< HEAD
        return holidayRepository.save(java.util.Objects.requireNonNull(holiday));
    }

    public void deleteHoliday(@NonNull Long id) {
        holidayRepository.deleteById(java.util.Objects.requireNonNull(id));
=======
        return holidayRepository.save(holiday);
    }

    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    }

    public boolean isHoliday(LocalDate date) {
        return !holidayRepository.findByDateBetween(date, date).isEmpty();
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
