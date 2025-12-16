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
<<<<<<< HEAD
import org.springframework.lang.NonNull;
import java.util.Objects;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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
<<<<<<< HEAD
    public ResponseEntity<UserDTO> getUserById(@PathVariable @NonNull Long id) {
        return userService.getUserById(Objects.requireNonNull(id))
=======
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
                .map(DTOMapper::toUserDTO)
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
            return ResponseEntity.status(HttpStatus.CREATED).body(DTOMapper.toUserDTO(createdUser));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
<<<<<<< HEAD
    public ResponseEntity<?> updateUser(@PathVariable @NonNull Long id, @RequestBody Map<String, Object> request) {
=======
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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
            
<<<<<<< HEAD
            User updatedUser = userService.updateUser(Objects.requireNonNull(id), userDetails);
=======
            User updatedUser = userService.updateUser(id, userDetails);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            return ResponseEntity.ok(DTOMapper.toUserDTO(updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
<<<<<<< HEAD
    public ResponseEntity<?> deleteUser(@PathVariable @NonNull Long id, @RequestParam String currentUserRole) {
=======
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestParam String currentUserRole) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        try {
            // Only SUPER_ADMIN can delete users
            if (!"SUPER_ADMIN".equals(currentUserRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only SUPER_ADMIN can delete users"));
            }
            
<<<<<<< HEAD
            userService.deleteUser(Objects.requireNonNull(id));
=======
            userService.deleteUser(id);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
