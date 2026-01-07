package com.hrms.repository;

import com.hrms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
    
    // Fetch user with all related collections (work experiences, education details, dependent details, shift)
    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN FETCH u.workExperiences " +
           "LEFT JOIN FETCH u.educationDetails " +
           "LEFT JOIN FETCH u.dependentDetails " +
           "LEFT JOIN FETCH u.shift " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithDetails(@Param("id") Long id);
}

