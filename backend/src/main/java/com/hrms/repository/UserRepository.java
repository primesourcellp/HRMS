package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hrms.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(String role);
    List<User> findByRole(String role);
    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
        String name, String email, String department);
    
    // Find users by shift ID (using native query since shift_id is a column)
    @Query(value = "SELECT * FROM employees WHERE shift_id = ?1", nativeQuery = true)
    List<User> findByShiftId(Long shiftId);
    
    // Get shift_id for a user
    @Query(value = "SELECT shift_id FROM employees WHERE id = ?1", nativeQuery = true)
    Long getShiftIdByEmployeeId(Long employeeId);
    
    // Update user's shift_id
    @Modifying
    @Query(value = "UPDATE employees SET shift_id = :shiftId WHERE id = :employeeId", nativeQuery = true)
    void updateEmployeeShiftId(@Param("employeeId") Long employeeId, @Param("shiftId") Long shiftId);
    
    // Update user's shift_id with assignment dates
    @Modifying
    @Query(value = "UPDATE employees SET shift_id = :shiftId, shift_assignment_start_date = :startDate, shift_assignment_end_date = :endDate WHERE id = :employeeId", nativeQuery = true)
    void updateEmployeeShiftIdWithDates(@Param("employeeId") Long employeeId, @Param("shiftId") Long shiftId, 
                                        @Param("startDate") java.time.LocalDate startDate, 
                                        @Param("endDate") java.time.LocalDate endDate);
    
    // Remove user's shift assignment
    @Modifying
    @Query(value = "UPDATE employees SET shift_id = NULL, shift_assignment_start_date = NULL, shift_assignment_end_date = NULL WHERE id = :employeeId", nativeQuery = true)
    void removeEmployeeShiftId(@Param("employeeId") Long employeeId);
    
    // Fetch user with work experiences and shift (fetch only one collection to avoid MultipleBagFetchException)
    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN FETCH u.workExperiences " +
           "LEFT JOIN FETCH u.shift " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithWorkExperiences(@Param("id") Long id);
    
    // Fetch user with education details
    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN FETCH u.educationDetails " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithEducationDetails(@Param("id") Long id);
    
    // Fetch user with dependent details
    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN FETCH u.dependentDetails " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithDependentDetails(@Param("id") Long id);
    
    // Fetch user with shift only (for cases where we don't need collections)
    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN FETCH u.shift " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithShift(@Param("id") Long id);
}

