package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hrms.entity.TeamMember;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);
    
    List<TeamMember> findByEmployeeId(Long employeeId);
    
    Optional<TeamMember> findByTeamIdAndEmployeeId(Long teamId, Long employeeId);
    
    @Query("SELECT tm FROM TeamMember tm WHERE tm.teamId = :teamId AND tm.role = :role")
    List<TeamMember> findByTeamIdAndRole(@Param("teamId") Long teamId, @Param("role") String role);
    
    @Query("SELECT tm FROM TeamMember tm WHERE tm.employeeId = :employeeId AND tm.role = :role")
    List<TeamMember> findByEmployeeIdAndRole(@Param("employeeId") Long employeeId, @Param("role") String role);
    
    void deleteByTeamId(Long teamId);
    
    void deleteByTeamIdAndEmployeeId(Long teamId, Long employeeId);
}

