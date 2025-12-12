package com.hrms.config;

import com.hrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Check if any SUPER_ADMIN exists
        long superAdminCount = userRepository.countByRole("SUPER_ADMIN");
        if (superAdminCount == 0) {
            System.out.println("==========================================");
            System.out.println("No SUPER_ADMIN found in the system.");
            System.out.println("Please register the first Super Admin");
            System.out.println("through the registration page.");
            System.out.println("==========================================");
        }
    }
}

