package com.oryfolks.lms_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.entity.UserProfile;
import com.oryfolks.lms_backend.repository.UserProfileRepository;
import com.oryfolks.lms_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import com.oryfolks.lms_backend.entity.PasswordResetToken;
import com.oryfolks.lms_backend.repository.PasswordResetTokenRepository;
import java.time.LocalDateTime;
import java.util.UUID;

import com.oryfolks.lms_backend.DTO.AddUserForm;
import com.oryfolks.lms_backend.config.JwtUtil;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Override
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public String login(String username, String password) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // System.out.println(user.getRole());
        return jwtUtil.generateToken(user.getUsername(), user.getRole());
    }

    @Override
    public void resetPassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void addUser(AddUserForm form) {

        // Password validation
        if (!form.getPassword().equals(form.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // Email domain validation
        if (form.getEmail() == null || !form.getEmail().toLowerCase().endsWith("@oryfolks.com")) {
            throw new RuntimeException("Only @oryfolks.com emails are allowed");
        }

        // Create User (Authentication table)
        User user = new User();
        user.setUsername(form.getUsername());
        user.setPassword(passwordEncoder.encode(form.getPassword()));
        user.setRole(form.getRole());

        User savedUser = userRepository.save(user);

        // Create User Profile (Profile table)
        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        profile.setFirstName(form.getFirstName());
        profile.setLastName(form.getLastName());
        profile.setEmail(form.getEmail());
        profile.setMobile(form.getMobile());
        profile.setGender(form.getGender());
        profile.setEmployeeId(form.getEmployeeId());

        // DOB stored properly
        profile.setDob(form.getDob());

        userProfileRepository.save(profile);

        // Send Welcome Email
        System.out.println("UserServiceImpl: Checking if welcome email should be sent for " + form.getEmail());
        System.out.println("UserServiceImpl: form.isSendWelcomeEmail() = " + form.isSendWelcomeEmail());
        if (form.isSendWelcomeEmail() && form.getEmail() != null && !form.getEmail().isEmpty()) {
            System.out.println("UserServiceImpl: Triggering welcome email...");
            
            // Generate reset token for new user
            String token = UUID.randomUUID().toString();
            tokenRepository.deleteByUser(savedUser);
            PasswordResetToken resetToken = new PasswordResetToken(token, savedUser, LocalDateTime.now().plusHours(24));
            tokenRepository.save(resetToken);
            String resetLink = "http://localhost:5173/reset-password?token=" + token;

            emailService.sendWelcomeEmail(form.getEmail(), form.getFirstName(), form.getUsername(), form.getPassword(), resetLink);
        } else {
            System.out.println("UserServiceImpl: Welcome email skipped. Condition not met.");
        }
    }

    @Override
    public UserProfile getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public UserProfile updateProfile(String username, UserProfile updatedProfile) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        // Update allowed fields
        if (updatedProfile.getFirstName() != null)
            profile.setFirstName(updatedProfile.getFirstName());
        if (updatedProfile.getLastName() != null)
            profile.setLastName(updatedProfile.getLastName());
        if (updatedProfile.getMobile() != null)
            profile.setMobile(updatedProfile.getMobile());
        if (updatedProfile.getDob() != null)
            profile.setDob(updatedProfile.getDob());

        // Email is explicitly NOT updated here to keep it read-only

        return java.util.Objects.requireNonNull(userProfileRepository.save(profile));
    }

    @Override
    @Transactional
    public void createPasswordResetTokenForUser(String email) {
        System.out.println("UserService: Password reset requested for email: " + email);
        
        String normalizedEmail = email.trim().toLowerCase();
        
        if (!normalizedEmail.endsWith("@oryfolks.com")) {
            System.err.println("UserService: Domain validation failed for: " + normalizedEmail);
            throw new RuntimeException("Only @oryfolks.com emails are allowed for password reset.");
        }

        UserProfile profile = userProfileRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Email not found: " + normalizedEmail));
        
        User user = profile.getUser();
        String token = UUID.randomUUID().toString();
        
        PasswordResetToken resetToken = tokenRepository.findByUser(user)
                .orElse(new PasswordResetToken());
        
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));
        
        tokenRepository.save(resetToken);
        
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(normalizedEmail, resetLink);
    }

    @Override
    @Transactional
    public void validateAndResetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or missing token"));
                
        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token has expired");
        }
        
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
    }

    @Override
    @Transactional
    public void changeUserPassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
