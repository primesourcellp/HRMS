package com.hrms.service;

import com.hrms.entity.User;
import com.hrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User createUser(User user) {
        // Check if trying to create SUPER_ADMIN
        if ("SUPER_ADMIN".equals(user.getRole())) {
            long superAdminCount = userRepository.countByRole("SUPER_ADMIN");
            if (superAdminCount > 0) {
                throw new RuntimeException("Only one SUPER_ADMIN is allowed in the system");
            }
        }
        
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }
        
        // Hash password before saving
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(@NonNull Long id) {
        return userRepository.findById(java.util.Objects.requireNonNull(id));
    }

    public User updateUser(@NonNull Long id, User userDetails) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Prevent changing role to SUPER_ADMIN if one already exists
        if ("SUPER_ADMIN".equals(userDetails.getRole()) && !user.getRole().equals("SUPER_ADMIN")) {
            long superAdminCount = userRepository.countByRole("SUPER_ADMIN");
            if (superAdminCount > 0) {
                throw new RuntimeException("Only one SUPER_ADMIN is allowed in the system");
            }
        }
        
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setActive(userDetails.getActive());
        
        // Hash password if provided
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        
        return userRepository.save(java.util.Objects.requireNonNull(user));
    }

    public void deleteUser(@NonNull Long id) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        if ("SUPER_ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Cannot delete SUPER_ADMIN");
        }
        
        userRepository.deleteById(java.util.Objects.requireNonNull(id));
    }

    public boolean authenticate(String email, String password) {
        if (email == null || password == null || email.trim().isEmpty() || password.isEmpty()) {
            return false;
        }
        
        Optional<User> user = userRepository.findByEmail(email.trim());
        if (user.isPresent() && user.get().getActive()) {
            // Verify password using BCrypt
            String storedPassword = user.get().getPassword();
            if (storedPassword == null || storedPassword.isEmpty()) {
                return false;
            }
            return passwordEncoder.matches(password, storedPassword);
        }
        return false;
    }

    public long getSuperAdminCount() {
        return userRepository.countByRole("SUPER_ADMIN");
    }
}
