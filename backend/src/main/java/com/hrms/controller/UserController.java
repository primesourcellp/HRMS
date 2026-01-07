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
                    .filter(e -> role.equals(e.getRole()))
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
            
            // Basic Information
            user.setEmployeeId((String) request.get("employeeId"));
            String name = (String) request.get("name");
            if (name != null && !name.trim().isEmpty()) {
                user.setName(name);
            } else {
                user.setName("");
            }
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));
            user.setRole(requestedRole != null ? requestedRole : "HR_ADMIN");
            
            // Work Information
            user.setDepartment((String) request.get("department"));
            user.setLocation((String) request.get("location"));
            user.setDesignation((String) request.get("designation"));
            user.setEmploymentType((String) request.get("employmentType"));
            // CRITICAL: Handle client field - ensure it's properly set and preserved
            Object clientObj = request.get("client");
            System.out.println("DEBUG UserController: Received client from request: '" + clientObj + "'");
            if (clientObj != null) {
                String clientValue = clientObj.toString().trim();
                // Only set if not empty after trimming
                if (!clientValue.isEmpty()) {
                    user.setClient(clientValue);
                    System.out.println("DEBUG UserController: Setting client to: '" + clientValue + "'");
                } else {
                    user.setClient(null);
                    System.out.println("DEBUG UserController: Client was empty string, setting to null");
                }
            } else {
                user.setClient(null);
                System.out.println("DEBUG UserController: Client was null in request, setting to null");
            }
            if (request.get("dateOfJoining") != null) {
                try {
                    String dateStr = request.get("dateOfJoining").toString();
                    user.setDateOfJoining(java.time.LocalDate.parse(dateStr));
                } catch (Exception e) {
                    // Ignore date parsing errors
                }
            }
            if (request.get("salary") != null) {
                try {
                    Object salaryObj = request.get("salary");
                    if (salaryObj instanceof Number) {
                        user.setSalary(((Number) salaryObj).doubleValue());
                    } else if (salaryObj instanceof String && !((String) salaryObj).trim().isEmpty()) {
                        user.setSalary(Double.parseDouble((String) salaryObj));
                    }
                } catch (Exception e) {
                    // Ignore salary parsing errors
                }
            }
            
            // Contact Details
            user.setWorkPhoneNumber((String) request.get("workPhoneNumber"));
            user.setPersonalMobileNumber((String) request.get("personalMobileNumber"));
            user.setExtension((String) request.get("extension"));
            user.setPersonalEmailAddress((String) request.get("personalEmailAddress"));
            
            // Personal Details
            if (request.get("dateOfBirth") != null) {
                try {
                    String dateStr = request.get("dateOfBirth").toString();
                    user.setDateOfBirth(java.time.LocalDate.parse(dateStr));
                } catch (Exception e) {
                    // Ignore date parsing errors
                }
            }
            user.setAge((String) request.get("age"));
            user.setGender((String) request.get("gender"));
            user.setMaritalStatus((String) request.get("maritalStatus"));
            user.setAboutMe((String) request.get("aboutMe"));
            user.setExpertise((String) request.get("expertise"));
            
            // Identity Info
            user.setPan((String) request.get("pan"));
            user.setAadhaar((String) request.get("aadhaar"));
            
            // Address Information
            user.setPresentAddressLine1((String) request.get("presentAddressLine1"));
            user.setPresentAddressLine2((String) request.get("presentAddressLine2"));
            user.setPresentCity((String) request.get("presentCity"));
            user.setPresentState((String) request.get("presentState"));
            user.setPresentCountry((String) request.get("presentCountry"));
            user.setPresentPostalCode((String) request.get("presentPostalCode"));
            
            if (request.get("sameAsPresentAddress") != null) {
                user.setSameAsPresentAddress((Boolean) request.get("sameAsPresentAddress"));
            }
            
            user.setPermanentAddressLine1((String) request.get("permanentAddressLine1"));
            user.setPermanentAddressLine2((String) request.get("permanentAddressLine2"));
            user.setPermanentCity((String) request.get("permanentCity"));
            user.setPermanentState((String) request.get("permanentState"));
            user.setPermanentCountry((String) request.get("permanentCountry"));
            user.setPermanentPostalCode((String) request.get("permanentPostalCode"));
            
            // Other fields
            user.setSeatingLocation((String) request.get("seatingLocation"));
            user.setTags((String) request.get("tags"));
            user.setSourceOfHire((String) request.get("sourceOfHire"));
            
            if (request.get("dateOfExit") != null) {
                try {
                    String dateStr = request.get("dateOfExit").toString();
                    user.setDateOfExit(java.time.LocalDate.parse(dateStr));
                } catch (Exception e) {
                    // Ignore date parsing errors
                }
            }
            
            // Status
            String employeeStatus = (String) request.get("employeeStatus");
            if (employeeStatus != null) {
                user.setEmployeeStatus(employeeStatus);
                user.setStatus(employeeStatus);
            } else {
                user.setEmployeeStatus("Active");
                user.setStatus("Active");
            }
            user.setActive(true);
            
            // Work Experiences and Education Details
            if (request.get("workExperiences") != null && request.get("workExperiences") instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> workExps = (java.util.List<Map<String, Object>>) request.get("workExperiences");
                if (workExps != null && !workExps.isEmpty()) {
                    java.util.List<com.hrms.entity.WorkExperience> experiences = new java.util.ArrayList<>();
                    for (Map<String, Object> expMap : workExps) {
                        com.hrms.entity.WorkExperience we = new com.hrms.entity.WorkExperience();
                        we.setCompanyName((String) expMap.get("companyName"));
                        we.setJobTitle((String) expMap.get("jobTitle"));
                        if (expMap.get("fromDate") != null || expMap.get("startDate") != null) {
                            try {
                                String dateStr = expMap.get("fromDate") != null ? expMap.get("fromDate").toString() : expMap.get("startDate").toString();
                                we.setFromDate(java.time.LocalDate.parse(dateStr));
                            } catch (Exception e) {}
                        }
                        if (expMap.get("toDate") != null || expMap.get("endDate") != null) {
                            try {
                                String dateStr = expMap.get("toDate") != null ? expMap.get("toDate").toString() : expMap.get("endDate").toString();
                                we.setToDate(java.time.LocalDate.parse(dateStr));
                            } catch (Exception e) {}
                        }
                        we.setJobDescription((String) expMap.get("jobDescription"));
                        if (expMap.get("relevant") != null) {
                            we.setRelevant((Boolean) expMap.get("relevant"));
                        }
                        we.setEmployee(user);
                        experiences.add(we);
                    }
                    user.setWorkExperiences(experiences);
                }
            }
            
            if (request.get("educationDetails") != null && request.get("educationDetails") instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> eduDetails = (java.util.List<Map<String, Object>>) request.get("educationDetails");
                if (eduDetails != null && !eduDetails.isEmpty()) {
                    java.util.List<com.hrms.entity.EducationDetail> educations = new java.util.ArrayList<>();
                    for (Map<String, Object> eduMap : eduDetails) {
                        com.hrms.entity.EducationDetail ed = new com.hrms.entity.EducationDetail();
                        ed.setInstitutionName((String) eduMap.get("institutionName"));
                        if (eduMap.get("institution") != null && ed.getInstitutionName() == null) {
                            ed.setInstitutionName((String) eduMap.get("institution"));
                        }
                        ed.setDegree((String) eduMap.get("degree"));
                        if (eduMap.get("fromDate") != null || eduMap.get("startDate") != null) {
                            try {
                                String dateStr = eduMap.get("fromDate") != null ? eduMap.get("fromDate").toString() : eduMap.get("startDate").toString();
                                ed.setFromDate(java.time.LocalDate.parse(dateStr));
                            } catch (Exception e) {}
                        }
                        if (eduMap.get("toDate") != null || eduMap.get("endDate") != null) {
                            try {
                                String dateStr = eduMap.get("toDate") != null ? eduMap.get("toDate").toString() : eduMap.get("endDate").toString();
                                ed.setToDate(java.time.LocalDate.parse(dateStr));
                            } catch (Exception e) {}
                        }
                        ed.setEmployee(user);
                        educations.add(ed);
                    }
                    user.setEducationDetails(educations);
                }
            }
            
            // CRITICAL: Preserve client field before calling service
            String clientValueBeforeService = user.getClient();
            System.out.println("DEBUG UserController: Client value before calling createEmployee: '" + clientValueBeforeService + "'");
            
            // Use UserService to create user (it handles all the validation and setup)
            User createdUser = userService.createEmployee(user);
            
            // Verify client was saved
            System.out.println("DEBUG UserController: Client value after createEmployee: '" + createdUser.getClient() + "'");
            
            // If client was provided but not saved, force update
            if (clientValueBeforeService != null && !clientValueBeforeService.trim().isEmpty()) {
                String trimmedClient = clientValueBeforeService.trim();
                if (createdUser.getClient() == null || !createdUser.getClient().equals(trimmedClient)) {
                    System.out.println("DEBUG UserController: WARNING - Client was lost! Re-saving with value: '" + trimmedClient + "'");
                    createdUser.setClient(trimmedClient);
                    createdUser = userService.updateEmployee(createdUser.getId(), createdUser);
                    System.out.println("DEBUG UserController: After re-save, client is: '" + createdUser.getClient() + "'");
                }
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create user: " + e.getMessage()));
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
            
            // Handle client field
            Object clientObj = request.get("client");
            if (clientObj != null) {
                userDetails.setClient(clientObj.toString().trim());
            }
            
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

