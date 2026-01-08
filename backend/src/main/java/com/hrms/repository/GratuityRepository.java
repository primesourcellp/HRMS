package com.hrms.repository;

import com.hrms.entity.Gratuity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GratuityRepository extends JpaRepository<Gratuity, Long> {
    List<Gratuity> findByEmployeeId(Long employeeId);
    
    List<Gratuity> findByStatus(String status);
    
    @Query("SELECT g FROM Gratuity g WHERE g.employeeId = :employeeId AND g.status = :status")
    List<Gratuity> findByEmployeeIdAndStatus(@Param("employeeId") Long employeeId, @Param("status") String status);
    
    Optional<Gratuity> findByEmployeeIdAndExitDate(Long employeeId, java.time.LocalDate exitDate);
}

