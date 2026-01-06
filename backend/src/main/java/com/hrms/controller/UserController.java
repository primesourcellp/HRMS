package com.hrms.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.UserDTO;
import com.hrms.entity.User;
import com.hrms.mapper.DTOMapper;
import com.hrms.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers(@RequestParam(required = false) String role) {
        List<User> users = userService.getAllUsers();
        if (role != null && !role.isEmpty()) {
            users = users.stream()
                    .filter(u -> role.equals(u.getRole()))
                    .toList();
        }
        return ResponseEntity.ok(DTOMapper.toUserDTOList(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(DTOMapper::toUserDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            String currentUserRole = (String) request.get("currentUserRole");
            String requestedRole = (String) request.get("role");
            
            // Authorization check - Only SUPER_ADMIN can create other users
            if (!"SUPER_ADMIN".equals(currentUserRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only SUPER_ADMIN can create users"));
            }
            
            // Validate role
            String[] validRoles = {"SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE", "FINANCE"};
            if (requestedRole != null && !java.util.Arrays.asList(validRoles).contains(requestedRole)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid role specified"));
            }
            
            User user = new User();
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));
            user.setName((String) request.get("name"));
            user.setRole(requestedRole != null ? requestedRole : "HR_ADMIN");
            user.setActive(true);
            
            User createdUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(DTOMapper.toUserDTO(createdUser));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String currentUserRole = (String) request.get("currentUserRole");
            String requestedRole = (String) request.get("role");
            
            // Authorization check - Only SUPER_ADMIN can update users
            if (!"SUPER_ADMIN".equals(currentUserRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only SUPER_ADMIN can update users"));
            }
            
            // Validate role
            String[] validRoles = {"SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE", "FINANCE"};
            if (requestedRole != null && !java.util.Arrays.asList(validRoles).contains(requestedRole)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid role specified"));
            }
            
            User userDetails = new User();
            userDetails.setName((String) request.get("name"));
            userDetails.setEmail((String) request.get("email"));
            userDetails.setRole(requestedRole);
            userDetails.setActive((Boolean) request.getOrDefault("active", true));
            
            if (request.containsKey("password") && request.get("password") != null) {
                userDetails.setPassword((String) request.get("password"));
            }
            
            User updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(DTOMapper.toUserDTO(updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestParam String currentUserRole) {
        try {
            // Only SUPER_ADMIN can delete users
            if (!"SUPER_ADMIN".equals(currentUserRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only SUPER_ADMIN can delete users"));
            }
            
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String currentPassword = (String) request.get("currentPassword");
            String newPassword = (String) request.get("newPassword");
            
            if (currentPassword == null || currentPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Current password is required"));
            }
            
            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "New password is required"));
            }
            
            if (newPassword.length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "New password must be at least 6 characters long"));
            }
            
            userService.changePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

