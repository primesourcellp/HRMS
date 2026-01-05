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
import com.hrms.service.EmailService;
import com.hrms.service.EmployeeService;
import com.hrms.service.OtpService;
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
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private OtpService otpService;

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
            
            // First attempt: authenticate as a system/user account (admin roles)
            if (userService.authenticate(email.trim(), password)) {
                Optional<User> user = userService.findByEmail(email.trim());
                if (user.isPresent() && user.get().getActive()) {
                    // Generate JWT token for admin user
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
            
            // Second attempt: authenticate as an employee
            if (employeeService.authenticate(email.trim(), password)) {
                Optional<Employee> employee = employeeService.findByEmail(email.trim());
                if (employee.isPresent() && "Active".equals(employee.get().getStatus())) {
                    // Generate JWT token for employee
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
            
            // If neither matched, return unauthorized
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

    /**
     * Verify if the current user's token is valid
     * This endpoint is protected by JwtAuthenticationFilter, so if it returns 200, token is valid
     * User info is already extracted and set as request attributes by the filter
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // User info is already extracted and set by JwtAuthenticationFilter
            String email = (String) request.getAttribute("userEmail");
            String role = (String) request.getAttribute("userRole");
            Long id = (Long) request.getAttribute("userId");
            String userType = (String) request.getAttribute("userType");
            
            if (email == null || role == null || id == null) {
                response.put("authenticated", false);
                response.put("message", "Token validation failed");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            response.put("authenticated", true);
            response.put("user", Map.of(
                "id", id,
                "email", email,
                "role", role,
                "userType", userType != null ? userType : "unknown"
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("authenticated", false);
            response.put("message", "Token verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
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

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            email = email.trim().toLowerCase();
            
            // Check if user exists (either User or Employee)
            Optional<User> user = userService.findByEmail(email);
            Optional<Employee> employee = employeeService.findByEmail(email);
            
            if (!user.isPresent() && !employee.isPresent()) {
                // Don't reveal if email exists or not (security best practice)
                response.put("success", true);
                response.put("message", "If the email exists, an OTP has been sent");
                return ResponseEntity.ok(response);
            }
            
            // Determine user type
            String userType = user.isPresent() ? "user" : "employee";
            
            // Generate and send OTP
            String otp = otpService.generateOtp(email, userType);
            emailService.sendOtpEmail(email, otp);
            
            response.put("success", true);
            response.put("message", "OTP has been sent to your email");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send OTP: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            
            if (email == null || email.trim().isEmpty() || otp == null || otp.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email and OTP are required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            email = email.trim().toLowerCase();
            otp = otp.trim();
            
            // Verify OTP
            boolean isValid = otpService.verifyOtp(email, otp);
            
            if (!isValid) {
                response.put("success", false);
                response.put("message", "Invalid or expired OTP");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            response.put("success", true);
            response.put("message", "OTP verified successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to verify OTP: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            String newPassword = request.get("newPassword");
            
            if (email == null || email.trim().isEmpty() || 
                otp == null || otp.trim().isEmpty() || 
                newPassword == null || newPassword.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email, OTP, and new password are required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            email = email.trim().toLowerCase();
            otp = otp.trim();
            newPassword = newPassword.trim();
            
            // Validate password length
            if (newPassword.length() < 6) {
                response.put("success", false);
                response.put("message", "Password must be at least 6 characters long");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Verify OTP again
            boolean isValid = otpService.verifyOtp(email, otp);
            if (!isValid) {
                response.put("success", false);
                response.put("message", "Invalid or expired OTP");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Get user type
            String userType = otpService.getUserType(email);
            if (userType == null) {
                response.put("success", false);
                response.put("message", "OTP session expired. Please request a new OTP");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Reset password based on user type
            if ("user".equals(userType)) {
                Optional<User> user = userService.findByEmail(email);
                if (user.isPresent()) {
                    userService.resetPassword(user.get().getId(), newPassword);
                    emailService.sendPasswordResetSuccessEmail(email, user.get().getName());
                } else {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }
            } else if ("employee".equals(userType)) {
                Optional<Employee> employee = employeeService.findByEmail(email);
                if (employee.isPresent()) {
                    employeeService.resetPassword(employee.get().getId(), newPassword);
                    emailService.sendPasswordResetSuccessEmail(email, employee.get().getName());
                } else {
                    response.put("success", false);
                    response.put("message", "Employee not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }
            } else {
                response.put("success", false);
                response.put("message", "Invalid user type");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Remove OTP after successful password reset
            otpService.removeOtp(email);
            
            response.put("success", true);
            response.put("message", "Password reset successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to reset password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

