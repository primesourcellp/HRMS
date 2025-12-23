package com.hrms.repository;

import com.hrms.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {
    List<EmployeeDocument> findByEmployeeId(Long employeeId);
    List<EmployeeDocument> findByEmployeeIdAndDocumentType(Long employeeId, String documentType);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmployeeDocument ed WHERE ed.employeeId = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}

