package com.hrms.repository;

import com.hrms.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);
    List<Employee> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
        String firstName, String lastName, String email, String department);
    
    // Find employees by shift ID (using native query since shift_id is a column)
    @Query(value = "SELECT * FROM employees WHERE shift_id = ?1", nativeQuery = true)
    List<Employee> findByShiftId(Long shiftId);
    
    // Get shift_id for an employee
    @Query(value = "SELECT shift_id FROM employees WHERE id = ?1", nativeQuery = true)
    Long getShiftIdByEmployeeId(Long employeeId);
    
    // Update employee's shift_id
    @Modifying
    @Query(value = "UPDATE employees SET shift_id = :shiftId WHERE id = :employeeId", nativeQuery = true)
    void updateEmployeeShiftId(@Param("employeeId") Long employeeId, @Param("shiftId") Long shiftId);
    
    // Update employee's shift_id with assignment dates
    @Modifying
    @Query(value = "UPDATE employees SET shift_id = :shiftId, shift_assignment_start_date = :startDate, shift_assignment_end_date = :endDate WHERE id = :employeeId", nativeQuery = true)
    void updateEmployeeShiftIdWithDates(@Param("employeeId") Long employeeId, @Param("shiftId") Long shiftId, 
                                        @Param("startDate") java.time.LocalDate startDate, 
                                        @Param("endDate") java.time.LocalDate endDate);
    
    // Remove employee's shift assignment
    @Modifying
    @Query(value = "UPDATE employees SET shift_id = NULL, shift_assignment_start_date = NULL, shift_assignment_end_date = NULL WHERE id = :employeeId", nativeQuery = true)
    void removeEmployeeShiftId(@Param("employeeId") Long employeeId);
}
