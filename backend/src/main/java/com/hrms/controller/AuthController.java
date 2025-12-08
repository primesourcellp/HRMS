package com.hrms.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.entity.Employee;
import com.hrms.entity.User;
import com.hrms.repository.UserRepository;
import com.hrms.service.EmployeeService;
import com.hrms.service.UserService;
import com.hrms.util.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmployeeService employeeService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> registrationData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if any SUPER_ADMIN already exists
            long superAdminCount = userRepository.countByRole("SUPER_ADMIN");
            if (superAdminCount > 0) {
                response.put("success", false);
                response.put("message", "Super Admin already exists. Please login instead.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Validate required fields
            String email = registrationData.get("email");
            String password = registrationData.get("password");
            String name = registrationData.get("name");
            
            if (email == null || email.isEmpty() || password == null || password.isEmpty() || name == null || name.isEmpty()) {
                response.put("success", false);
                response.put("message", "All fields are required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Check if email already exists
            if (userRepository.existsByEmail(email)) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Create Super Admin user
            User superAdmin = new User();
            superAdmin.setEmail(email);
            superAdmin.setPassword(password); // Will be hashed in service
            superAdmin.setName(name);
            superAdmin.setRole("SUPER_ADMIN");
            superAdmin.setActive(true);
            
            User createdUser = userService.createUser(superAdmin);
            
            response.put("success", true);
            response.put("message", "Super Admin registered successfully");
            response.put("user", Map.of(
                "id", createdUser.getId(),
                "email", createdUser.getEmail(),
                "name", createdUser.getName(),
                "role", createdUser.getRole()
            ));
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials, HttpServletResponse httpResponse) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");
            
            // Validate input
            if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Authenticate user
            if (userService.authenticate(email.trim(), password)) {
                Optional<User> user = userService.findByEmail(email.trim());
                if (user.isPresent() && user.get().getActive()) {
                    // Generate JWT token
                    String token = jwtUtil.generateToken(
                        user.get().getEmail(),
                        user.get().getRole(),
                        user.get().getId(),
                        "admin"
                    );
                    String refreshToken = jwtUtil.generateRefreshToken(
                        user.get().getEmail(),
                        user.get().getRole(),
                        user.get().getId(),
                        "admin"
                    );
                    
                    // Set HttpOnly cookies for secure token storage
                    Cookie accessTokenCookie = new Cookie("accessToken", token);
                    accessTokenCookie.setHttpOnly(true);
                    accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
                    accessTokenCookie.setPath("/");
                    accessTokenCookie.setMaxAge(86400); // 24 hours in seconds
                    accessTokenCookie.setAttribute("SameSite", "Lax");
                    httpResponse.addCookie(accessTokenCookie);
                    
                    Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
                    refreshTokenCookie.setHttpOnly(true);
                    refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
                    refreshTokenCookie.setPath("/");
                    refreshTokenCookie.setMaxAge(604800); // 7 days in seconds
                    refreshTokenCookie.setAttribute("SameSite", "Lax");
                    httpResponse.addCookie(refreshTokenCookie);
                    
                    response.put("success", true);
                    response.put("message", "Login successful");
                    // Don't return tokens in response body for security
                    response.put("user", Map.of(
                        "id", user.get().getId(),
                        "email", user.get().getEmail(),
                        "name", user.get().getName(),
                        "role", user.get().getRole()
                    ));
                    return ResponseEntity.ok(response);
                }
            }
            
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkAuth(@RequestParam String email) {
        Optional<User> user = userService.findByEmail(email);
        Map<String, Object> response = new HashMap<>();
        
        if (user.isPresent()) {
            response.put("authenticated", true);
            response.put("user", Map.of(
                "id", user.get().getId(),
                "email", user.get().getEmail(),
                "name", user.get().getName(),
                "role", user.get().getRole()
            ));
        } else {
            response.put("authenticated", false);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/check-superadmin")
    public ResponseEntity<Map<String, Object>> checkSuperAdminExists() {
        Map<String, Object> response = new HashMap<>();
        long superAdminCount = userRepository.countByRole("SUPER_ADMIN");
        response.put("exists", superAdminCount > 0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/employee/login")
    public ResponseEntity<Map<String, Object>> employeeLogin(@RequestBody Map<String, String> credentials, HttpServletResponse httpResponse) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");
            
            // Validate input
            if (email == null || email.trim().isEmpty() || password == null || password.isEmpty()) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Authenticate employee
            if (employeeService.authenticate(email.trim(), password)) {
                Optional<Employee> employee = employeeService.findByEmail(email.trim());
                if (employee.isPresent() && "Active".equals(employee.get().getStatus())) {
                    // Generate JWT token
                    String token = jwtUtil.generateToken(
                        employee.get().getEmail(),
                        "EMPLOYEE",
                        employee.get().getId(),
                        "employee"
                    );
                    String refreshToken = jwtUtil.generateRefreshToken(
                        employee.get().getEmail(),
                        "EMPLOYEE",
                        employee.get().getId(),
                        "employee"
                    );
                    
                    // Set HttpOnly cookies for secure token storage
                    Cookie accessTokenCookie = new Cookie("accessToken", token);
                    accessTokenCookie.setHttpOnly(true);
                    accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
                    accessTokenCookie.setPath("/");
                    accessTokenCookie.setMaxAge(86400); // 24 hours in seconds
                    accessTokenCookie.setAttribute("SameSite", "Lax");
                    httpResponse.addCookie(accessTokenCookie);
                    
                    Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
                    refreshTokenCookie.setHttpOnly(true);
                    refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
                    refreshTokenCookie.setPath("/");
                    refreshTokenCookie.setMaxAge(604800); // 7 days in seconds
                    refreshTokenCookie.setAttribute("SameSite", "Lax");
                    httpResponse.addCookie(refreshTokenCookie);
                    
                    response.put("success", true);
                    response.put("message", "Login successful");
                    // Don't return tokens in response body for security
                    response.put("employee", Map.of(
                        "id", employee.get().getId(),
                        "email", employee.get().getEmail(),
                        "name", employee.get().getName(),
                        "department", employee.get().getDepartment(),
                        "position", employee.get().getPosition(),
                        "role", "EMPLOYEE"
                    ));
                    return ResponseEntity.ok(response);
                }
            }
            
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(HttpServletRequest request, HttpServletResponse httpResponse) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get refresh token from cookie
            String refreshToken = null;
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("refreshToken".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }
            
            if (refreshToken == null || refreshToken.isEmpty()) {
                response.put("success", false);
                response.put("message", "Refresh token is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Validate refresh token
            if (!jwtUtil.validateToken(refreshToken)) {
                response.put("success", false);
                response.put("message", "Invalid or expired refresh token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            // Extract user info from refresh token
            String email = jwtUtil.extractEmail(refreshToken);
            String role = jwtUtil.extractRole(refreshToken);
            Long id = jwtUtil.extractId(refreshToken);
            String userType = jwtUtil.extractUserType(refreshToken);
            
            // Generate new access token
            String newToken = jwtUtil.generateToken(email, role, id, userType);
            
            // Set new access token in HttpOnly cookie
            Cookie accessTokenCookie = new Cookie("accessToken", newToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(86400); // 24 hours in seconds
            accessTokenCookie.setAttribute("SameSite", "Lax");
            httpResponse.addCookie(accessTokenCookie);
            
            response.put("success", true);
            response.put("message", "Token refreshed successfully");
            // Don't return token in response body
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Token refresh failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse httpResponse) {
        Map<String, Object> response = new HashMap<>();
        
        // Clear access token cookie
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0); // Delete cookie
        httpResponse.addCookie(accessTokenCookie);
        
        // Clear refresh token cookie
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // Delete cookie
        httpResponse.addCookie(refreshTokenCookie);
        
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}

