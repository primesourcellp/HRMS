package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.TeamDTO;
import com.hrms.dto.TeamMemberDTO;
import com.hrms.service.TeamService;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "http://localhost:3000")
public class TeamController {
    @Autowired
    private TeamService teamService;

    @GetMapping
    public ResponseEntity<?> getAllTeams() {
        try {
            List<TeamDTO> teams = teamService.getAllTeams();
            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch teams");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTeamById(@PathVariable Long id) {
        try {
            return teamService.getTeamById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch team");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody TeamDTO teamDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            TeamDTO created = teamService.createTeam(teamDTO);
            response.put("success", true);
            response.put("message", "Team created successfully");
            response.put("team", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody TeamDTO teamDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            TeamDTO updated = teamService.updateTeam(id, teamDTO);
            response.put("success", true);
            response.put("message", "Team updated successfully");
            response.put("team", updated);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Handle business logic errors
            String errorMessage = e.getMessage();
            response.put("success", false);
            response.put("error", "Failed to update team");
            if (errorMessage != null && (errorMessage.contains("Duplicate") || errorMessage.contains("already"))) {
                response.put("message", errorMessage);
            } else {
                response.put("message", errorMessage != null ? errorMessage : "An error occurred while updating the team");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            // Handle database constraint violations
            String errorMessage = e.getMessage();
            response.put("success", false);
            response.put("error", "Failed to update team");
            if (errorMessage != null && (errorMessage.contains("Duplicate entry") || errorMessage.contains("UKgwiekr3b4g6uu8h3v5q03jqxy"))) {
                response.put("message", "One or more employees are already members of this team. Please remove duplicates and try again.");
            } else {
                response.put("message", errorMessage != null ? errorMessage : "An error occurred while updating the team");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            teamService.deleteTeam(id);
            response.put("success", true);
            response.put("message", "Team deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(@PathVariable Long teamId) {
        try {
            List<TeamMemberDTO> members = teamService.getTeamMembers(teamId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch team members");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> addTeamMember(@PathVariable Long teamId, @RequestBody TeamMemberDTO memberDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            TeamMemberDTO added = teamService.addTeamMember(teamId, memberDTO);
            response.put("success", true);
            response.put("message", "Team member added successfully");
            response.put("member", added);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            // Handle duplicate entry or other business logic errors
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("already")) {
                response.put("success", false);
                response.put("error", "Duplicate Entry");
                response.put("message", errorMessage);
            } else {
                response.put("success", false);
                response.put("error", "Failed to add team member");
                response.put("message", errorMessage != null ? errorMessage : "An error occurred while adding the team member");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            // Handle database constraint violations
            String errorMessage = e.getMessage();
            if (errorMessage != null && (errorMessage.contains("Duplicate entry") || errorMessage.contains("UKgwiekr3b4g6uu8h3v5q03jqxy"))) {
                response.put("success", false);
                response.put("error", "Duplicate Entry");
                response.put("message", "This employee is already a member of this team. Please select a different employee.");
            } else {
                response.put("success", false);
                response.put("error", "Failed to add team member");
                response.put("message", errorMessage != null ? errorMessage : "An error occurred while adding the team member");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{teamId}/members/{employeeId}")
    public ResponseEntity<?> removeTeamMember(@PathVariable Long teamId, @PathVariable Long employeeId) {
        Map<String, Object> response = new HashMap<>();
        try {
            teamService.removeTeamMember(teamId, employeeId);
            response.put("success", true);
            response.put("message", "Team member removed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/approver/{employeeId}")
    public ResponseEntity<?> getApproverForEmployee(@PathVariable Long employeeId) {
        try {
            Long approverId = teamService.findApproverForLeave(employeeId);
            Map<String, Object> response = new HashMap<>();
            response.put("approverId", approverId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to find approver");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}

