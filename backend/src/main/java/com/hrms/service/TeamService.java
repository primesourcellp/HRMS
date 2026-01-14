package com.hrms.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.TeamDTO;
import com.hrms.dto.TeamMemberDTO;
import com.hrms.entity.Team;
import com.hrms.entity.TeamMember;
import com.hrms.entity.User;
import com.hrms.repository.TeamMemberRepository;
import com.hrms.repository.TeamRepository;
import com.hrms.repository.UserRepository;

@Service
public class TeamService {
    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private UserRepository userRepository;

    public List<TeamDTO> getAllTeams() {
        List<Team> teams = teamRepository.findAllWithMembers();
        return teams.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Optional<TeamDTO> getTeamById(Long id) {
        return teamRepository.findByIdWithMembers(id).map(this::convertToDTO);
    }

    @Transactional
    public TeamDTO createTeam(TeamDTO teamDTO) {
        // Check if team name already exists
        if (teamRepository.findByName(teamDTO.getName()).isPresent()) {
            throw new RuntimeException("Team with name '" + teamDTO.getName() + "' already exists");
        }

        Team team = new Team();
        team.setName(teamDTO.getName());
        team.setDescription(teamDTO.getDescription());
        team.setCreatedBy(teamDTO.getCreatedBy());
        
        team = teamRepository.save(team);

        // Add team members
        if (teamDTO.getMembers() != null && !teamDTO.getMembers().isEmpty()) {
            List<TeamMember> members = new ArrayList<>();
            for (TeamMemberDTO memberDTO : teamDTO.getMembers()) {
                // Check for duplicate employee IDs within the same request
                if (members.stream().anyMatch(m -> m.getEmployeeId().equals(memberDTO.getEmployeeId()))) {
                    throw new RuntimeException("Duplicate employee found in team members list. Employee ID: " + memberDTO.getEmployeeId());
                }
                
                TeamMember member = new TeamMember();
                member.setTeamId(team.getId());
                member.setEmployeeId(memberDTO.getEmployeeId());
                member.setRole(memberDTO.getRole() != null ? memberDTO.getRole() : "EMPLOYEE");
                members.add(member);
            }
            try {
                teamMemberRepository.saveAll(members);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("One or more employees are already members of this team. Please check and try again.");
            }
        }

        return convertToDTO(teamRepository.findByIdWithMembers(team.getId()).orElse(team));
    }

    @Transactional
    public TeamDTO updateTeam(Long id, TeamDTO teamDTO) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));

        // Check if name is being changed and if new name already exists
        if (!team.getName().equals(teamDTO.getName()) && 
            teamRepository.findByName(teamDTO.getName()).isPresent()) {
            throw new RuntimeException("Team with name '" + teamDTO.getName() + "' already exists");
        }

        team.setName(teamDTO.getName());
        team.setDescription(teamDTO.getDescription());
        team = teamRepository.save(team);

        // Update team members - remove all existing and add new ones
        teamMemberRepository.deleteByTeamId(id);
        // Important: ensure deletes are executed before we insert the new set,
        // otherwise the unique constraint (team_id, employee_id) can fail.
        teamMemberRepository.flush();
        
        if (teamDTO.getMembers() != null && !teamDTO.getMembers().isEmpty()) {
            List<TeamMember> members = new ArrayList<>();
            java.util.Set<Long> employeeIds = new java.util.HashSet<>();
            
            for (TeamMemberDTO memberDTO : teamDTO.getMembers()) {
                if (memberDTO.getEmployeeId() == null) {
                    throw new RuntimeException("Employee ID cannot be null");
                }
                
                // Check for duplicate employee IDs within the same request
                if (employeeIds.contains(memberDTO.getEmployeeId())) {
                    throw new RuntimeException("Duplicate employee found in team members list. Employee ID: " + memberDTO.getEmployeeId() + " is already in the list.");
                }
                employeeIds.add(memberDTO.getEmployeeId());
                
                TeamMember member = new TeamMember();
                member.setTeamId(team.getId());
                member.setEmployeeId(memberDTO.getEmployeeId());
                member.setRole(memberDTO.getRole() != null ? memberDTO.getRole() : "EMPLOYEE");
                members.add(member);
            }
            
            try {
                teamMemberRepository.saveAll(members);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("One or more employees are already members of this team. Please check and try again.");
            }
        }

        return convertToDTO(teamRepository.findByIdWithMembers(team.getId()).orElse(team));
    }

    @Transactional
    public void deleteTeam(Long id) {
        if (!teamRepository.existsById(id)) {
            throw new RuntimeException("Team not found with id: " + id);
        }
        teamMemberRepository.deleteByTeamId(id);
        teamRepository.deleteById(id);
    }

    public List<TeamMemberDTO> getTeamMembers(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        return members.stream().map(this::convertMemberToDTO).collect(Collectors.toList());
    }

    @Transactional
    public TeamMemberDTO addTeamMember(Long teamId, TeamMemberDTO memberDTO) {
        if (!teamRepository.existsById(teamId)) {
            throw new RuntimeException("Team not found with id: " + teamId);
        }

        if (memberDTO.getEmployeeId() == null) {
            throw new RuntimeException("Employee ID is required");
        }

        // Check if employee is already in the team
        Optional<TeamMember> existingMember = teamMemberRepository.findByTeamIdAndEmployeeId(teamId, memberDTO.getEmployeeId());
        if (existingMember.isPresent()) {
            throw new RuntimeException("This employee is already a member of this team. Please select a different employee.");
        }

        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setEmployeeId(memberDTO.getEmployeeId());
        member.setRole(memberDTO.getRole() != null ? memberDTO.getRole() : "EMPLOYEE");
        
        try {
            member = teamMemberRepository.save(member);
        } catch (DataIntegrityViolationException e) {
            // Catch database constraint violations
            throw new RuntimeException("This employee is already a member of this team. Please select a different employee.");
        }
        
        return convertMemberToDTO(member);
    }

    @Transactional
    public void removeTeamMember(Long teamId, Long employeeId) {
        teamMemberRepository.deleteByTeamIdAndEmployeeId(teamId, employeeId);
    }

    /**
     * Find the approver for a leave based on team hierarchy:
     * - Employee leave approved by Manager
     * - Manager leave approved by HR_ADMIN
     * - HR_ADMIN leave approved by SUPER_ADMIN
     */
    public Long findApproverForLeave(Long employeeId) {
        // Find which team the employee belongs to
        List<TeamMember> employeeMemberships = teamMemberRepository.findByEmployeeId(employeeId);
        
        if (employeeMemberships.isEmpty()) {
            return null; // Employee not in any team
        }

        // Get employee's role
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        String employeeRole = employee.getRole().toUpperCase();

        // Find approver based on hierarchy
        for (TeamMember membership : employeeMemberships) {
            Long teamId = membership.getTeamId();
            
            if ("EMPLOYEE".equals(employeeRole)) {
                // Employee leave approved by Manager
                List<TeamMember> managers = teamMemberRepository.findByTeamIdAndRole(teamId, "MANAGER");
                if (!managers.isEmpty()) {
                    return managers.get(0).getEmployeeId();
                }
            } else if ("MANAGER".equals(employeeRole)) {
                // Manager leave approved by HR_ADMIN
                List<TeamMember> hrAdmins = teamMemberRepository.findByTeamIdAndRole(teamId, "HR_ADMIN");
                if (!hrAdmins.isEmpty()) {
                    return hrAdmins.get(0).getEmployeeId();
                }
            } else if ("HR_ADMIN".equals(employeeRole)) {
                // HR_ADMIN leave approved by SUPER_ADMIN
                // Find SUPER_ADMIN (they might not be in team, so check all users)
                List<User> superAdmins = userRepository.findByRole("SUPER_ADMIN");
                if (!superAdmins.isEmpty()) {
                    return superAdmins.get(0).getId();
                }
            }
        }

        return null; // No approver found
    }

    private TeamDTO convertToDTO(Team team) {
        TeamDTO dto = new TeamDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setDescription(team.getDescription());
        dto.setCreatedBy(team.getCreatedBy());
        dto.setCreatedDate(team.getCreatedDate());

        if (team.getMembers() != null) {
            List<TeamMemberDTO> memberDTOs = team.getMembers().stream()
                    .map(this::convertMemberToDTO)
                    .collect(Collectors.toList());
            dto.setMembers(memberDTOs);
        }

        return dto;
    }

    private TeamMemberDTO convertMemberToDTO(TeamMember member) {
        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setId(member.getId());
        dto.setTeamId(member.getTeamId());
        dto.setEmployeeId(member.getEmployeeId());
        dto.setRole(member.getRole()); // Team role
        dto.setAssignedDate(member.getAssignedDate());

        // Fetch employee details
        if (member.getEmployee() != null) {
            dto.setEmployeeName(member.getEmployee().getName());
            dto.setEmployeeEmail(member.getEmployee().getEmail());
            dto.setEmployeeRole(member.getEmployee().getRole()); // Actual employee role
        } else {
            Optional<User> employee = userRepository.findById(member.getEmployeeId());
            if (employee.isPresent()) {
                dto.setEmployeeName(employee.get().getName());
                dto.setEmployeeEmail(employee.get().getEmail());
                dto.setEmployeeRole(employee.get().getRole()); // Actual employee role
            }
        }

        return dto;
    }
}

