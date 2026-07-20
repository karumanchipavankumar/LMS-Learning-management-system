package com.oryfolks.lms_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;

import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.entity.UserProfile;
import com.oryfolks.lms_backend.repository.UserRepository;
import com.oryfolks.lms_backend.repository.UserProfileRepository;
import java.time.LocalDate;

@Configuration
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        // Migration/Rename: If old admin@lms.com exists, rename it to k.thanmai@oryfolks.com
        userRepository.findByUsername("admin@lms.com").ifPresent(admin -> {
            admin.setUsername("k.thanmai@oryfolks.com");
            userRepository.save(admin);
            System.out.println("Migrated old admin@lms.com to k.thanmai@oryfolks.com");
        });

        // Create ADMIN only if not exists
        if (userRepository.findByUsername("k.thanmai@oryfolks.com").isEmpty()) {

            User admin = new User();
            admin.setUsername("k.thanmai@oryfolks.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");

            userRepository.save(admin);

            System.out.println("Default ADMIN user k.thanmai@oryfolks.com created");
        }

        // Ensure ADMIN has a UserProfile so password reset works
        userRepository.findByUsername("k.thanmai@oryfolks.com").ifPresent(admin -> {
            if (userProfileRepository.findByUserId(admin.getId()).isEmpty()) {
                if (userProfileRepository.findByEmail("k.thanmai@oryfolks.com").isEmpty()) {
                    UserProfile profile = new UserProfile();
                    profile.setUser(admin);
                    profile.setFirstName("Admin");
                    profile.setLastName("User");
                    profile.setEmail("k.thanmai@oryfolks.com");
                    profile.setMobile("9999999999");
                    profile.setGender("Other");
                    profile.setEmployeeId("ADMIN01");
                    profile.setDob(LocalDate.of(1990, 1, 1));
                    userProfileRepository.save(profile);
                    System.out.println("Created UserProfile for ADMIN k.thanmai@oryfolks.com");
                } else {
                    System.out.println("UserProfile with email k.thanmai@oryfolks.com already exists");
                }
            }
        });
    }
}

