package com.hrms.repository;

import com.hrms.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    List<Holiday> findByYear(Integer year);
    List<Holiday> findByDateBetween(LocalDate startDate, LocalDate endDate);
}

