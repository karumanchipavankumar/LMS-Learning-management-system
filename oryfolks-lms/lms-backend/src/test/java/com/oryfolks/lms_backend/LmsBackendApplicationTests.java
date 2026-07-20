package com.oryfolks.lms_backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.entity.UserProfile;
import com.oryfolks.lms_backend.repository.UserRepository;
import com.oryfolks.lms_backend.repository.UserProfileRepository;
import com.oryfolks.lms_backend.service.UserService;
import com.oryfolks.lms_backend.repository.PasswordResetTokenRepository;

@SpringBootTest
class LmsBackendApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void testAdminUserInitializationAndReset() {
        // 1. Verify ADMIN user exists with username k.thanmai@oryfolks.com
        User admin = userRepository.findByUsername("k.thanmai@oryfolks.com")
                .orElse(null);
        assertNotNull(admin, "Admin user k.thanmai@oryfolks.com should exist");
        assertEquals("ADMIN", admin.getRole(), "Admin user role should be ADMIN");

        // 2. Verify UserProfile exists for ADMIN with email k.thanmai@oryfolks.com
        UserProfile profile = userProfileRepository.findByUserId(admin.getId())
                .orElse(null);
        assertNotNull(profile, "Admin user profile should exist");
        assertEquals("k.thanmai@oryfolks.com", profile.getEmail(), "Admin user profile email should be k.thanmai@oryfolks.com");

        // 3. Verify password reset token can be successfully created for ADMIN
        assertDoesNotThrow(() -> userService.createPasswordResetTokenForUser("k.thanmai@oryfolks.com"));

        // 4. Verify token actually exists in database
        var tokenOpt = tokenRepository.findByUser(admin);
        assertTrue(tokenOpt.isPresent(), "Password reset token should be present in repository");
        assertNotNull(tokenOpt.get().getToken(), "Token value should not be null");

        // Clean up password reset token
        tokenRepository.delete(tokenOpt.get());
    }
}

