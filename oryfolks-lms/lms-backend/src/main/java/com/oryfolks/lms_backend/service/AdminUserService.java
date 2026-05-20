package com.oryfolks.lms_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.oryfolks.lms_backend.repository.UserProfileRepository;
import com.oryfolks.lms_backend.repository.UserRepository;
import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.entity.UserProfile;
import com.oryfolks.lms_backend.entity.PasswordResetToken;
import com.oryfolks.lms_backend.repository.PasswordResetTokenRepository;
import com.oryfolks.lms_backend.DTO.AddUserForm;
import com.oryfolks.lms_backend.DTO.UserManagementDTO;
import java.time.LocalDateTime;
import java.util.UUID;
import com.oryfolks.lms_backend.repository.NotificationRepository;
import org.springframework.context.ApplicationEventPublisher;

@Service
public class AdminUserService {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private com.oryfolks.lms_backend.repository.CourseRatingRepository courseRatingRepository;

    @Autowired
    private com.oryfolks.lms_backend.repository.EmployeeCourseRepository employeeCourseRepository;

    @Autowired
    private com.oryfolks.lms_backend.repository.CourseEnrollmentRepository courseEnrollmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.oryfolks.lms_backend.repository.EmployeeContentProgressRepository employeeContentProgressRepository;

    @Transactional
    public void addUser(AddUserForm form) {

        if (!form.getPassword().equals(form.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // Email domain validation
        if (form.getEmail() == null || !form.getEmail().toLowerCase().endsWith("@oryfolks.com")) {
            throw new RuntimeException("Only @oryfolks.com emails are allowed");
        }

        // Save User (Auth)
        User user = new User();
        user.setUsername(form.getUsername());
        user.setPassword(passwordEncoder.encode(form.getPassword()));
        user.setRole(form.getRole().toUpperCase());

        User savedUser = userRepository.save(user);

        // Save User Profile
        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        profile.setFirstName(form.getFirstName());
        profile.setLastName(form.getLastName());
        profile.setEmail(form.getEmail());
        profile.setMobile(form.getMobile());
        profile.setGender(form.getGender());
        profile.setEmployeeId(form.getEmployeeId());

        userProfileRepository.save(profile);

        // Send Welcome Email
        System.out.println("AdminUserService: Checking if welcome email should be sent for " + form.getEmail());
        System.out.println("AdminUserService: form.isSendWelcomeEmail() = " + form.isSendWelcomeEmail());
        if (form.isSendWelcomeEmail() && form.getEmail() != null && !form.getEmail().isEmpty()) {
            System.out.println("AdminUserService: Triggering welcome email...");
            
            // Generate reset token for new user
            String token = UUID.randomUUID().toString();
            tokenRepository.deleteByUser(savedUser);
            PasswordResetToken resetToken = new PasswordResetToken(token, savedUser, LocalDateTime.now().plusHours(24));
            tokenRepository.save(resetToken);
            String resetLink = frontendUrl + "/reset-password?token=" + token;

            emailService.sendWelcomeEmail(form.getEmail(), form.getFirstName(), form.getUsername(), form.getPassword(), resetLink);
        } else {
            System.out.println("AdminUserService: Welcome email skipped. Condition not met.");
        }

        // Publish UserCreatedEvent for Admins
        eventPublisher.publishEvent(new com.oryfolks.lms_backend.event.UserCreatedEvent(
                this,
                "User Created",
                "A new user *" + savedUser.getUsername() + "* with role *" + savedUser.getRole() + "* has been added to the system.",
                savedUser.getId()
        ));
    }

    public List<UserManagementDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .filter(user -> !user.getRole().equalsIgnoreCase("ADMIN"))
                .map(user -> {

                    UserProfile profile = userProfileRepository
                            .findByUserId(user.getId())
                            .orElse(null);

                    return new UserManagementDTO(
                            user.getId(),
                            profile != null ? profile.getFirstName() : null,
                            profile != null ? profile.getLastName() : null,
                            profile != null ? profile.getEmail() : null,
                            profile != null ? profile.getMobile() : null,
                            profile != null ? profile.getGender() : null,
                            user.getRole(),
                            profile != null ? profile.getEmployeeId() : null,
                            user.getUsername());
                })
                .toList();
    }

    @Transactional
    public void deleteUser(Long id) {

        if (id == null) {
            throw new RuntimeException("User ID must not be null");
        }

        if (!userRepository.existsById(id)) {
            System.out.println("AdminUserService: User " + id + " not found, skipping deletion.");
            return;
        }

        System.out.println("AdminUserService: Starting thorough deletion for user ID: " + id);

        // 1. Delete ratings
        courseRatingRepository.deleteByUserId(id);
        System.out.println("AdminUserService: Deleted user ratings.");

        // 2. Delete course assignments
        employeeCourseRepository.deleteByEmployeeId(id);
        System.out.println("AdminUserService: Deleted course assignments.");

        // 3. Delete enrollment requests
        courseEnrollmentRepository.deleteByEmployeeId(id);
        System.out.println("AdminUserService: Deleted course enrollment requests.");

        // 4. Delete employee content progress records (activity records)
        employeeContentProgressRepository.deleteByEmployeeId(id);
        System.out.println("AdminUserService: Deleted employee content progress records.");

        // 5. Delete notifications
        notificationRepository.deleteByRecipientId(id);
        System.out.println("AdminUserService: Deleted user notifications.");

        // 6. Delete password reset tokens
        User user = userRepository.findById(id).orElse(null);
        String username = user != null ? user.getUsername() : "Unknown";
        String role = user != null ? user.getRole() : "Unknown";
        if (user != null) {
            tokenRepository.deleteByUser(user);
            System.out.println("AdminUserService: Deleted password reset tokens.");
        }

        // 7. Delete user (cascades to UserProfile via JPA)
        userRepository.deleteById(id);
        System.out.println("AdminUserService: Deleted user and profile record.");

        // Publish UserDeletedEvent for Admins
        eventPublisher.publishEvent(new com.oryfolks.lms_backend.event.UserDeletedEvent(
                this,
                "User Deleted",
                "User *" + username + "* with role *" + role + "* has been deleted from the system.",
                id
        ));
    }

}
