package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hrms.entity.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByName(String name);
    
    List<Team> findByCreatedBy(Long createdBy);
    
    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN FETCH t.members m LEFT JOIN FETCH m.employee WHERE t.id = :id")
    Optional<Team> findByIdWithMembers(@Param("id") Long id);
    
    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN FETCH t.members m LEFT JOIN FETCH m.employee")
    List<Team> findAllWithMembers();
}

