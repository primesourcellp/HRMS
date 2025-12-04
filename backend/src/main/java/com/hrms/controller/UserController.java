package com.hrms.controller;

import com.hrms.entity.User;
import com.hrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@RequestParam(required = false) String role) {
        List<User> users = userService.getAllUsers();
        if (role != null && !role.isEmpty()) {
            users = users.stream()
                    .filter(u -> role.equals(u.getRole()))
                    .toList();
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            String currentUserRole = (String) request.get("currentUserRole");
            String requestedRole = (String) request.get("role");
            
            // Authorization check
            if ("ADMIN".equals(currentUserRole) && "SUPER_ADMIN".equals(requestedRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "ADMIN cannot create SUPER_ADMIN"));
            }
            
            if ("ADMIN".equals(currentUserRole) && "ADMIN".equals(requestedRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "ADMIN cannot create another ADMIN"));
            }
            
            User user = new User();
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));
            user.setName((String) request.get("name"));
            user.setRole(requestedRole != null ? requestedRole : "ADMIN");
            user.setActive(true);
            
            User createdUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
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
            
            // Authorization check
            if ("ADMIN".equals(currentUserRole) && "SUPER_ADMIN".equals(requestedRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "ADMIN cannot update user to SUPER_ADMIN"));
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
            return ResponseEntity.ok(updatedUser);
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
}

