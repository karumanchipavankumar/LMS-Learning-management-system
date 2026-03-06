package com.oryfolks.lms_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;

import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.repository.UserRepository;

@Configuration
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        // Create ADMIN only if not exists
        if (userRepository.findByUsername("admin@lms.com").isEmpty()) {

            User admin = new User();
            admin.setUsername("admin@lms.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");

            userRepository.save(admin);

            System.out.println("Default ADMIN user created");
        }
    }
}
