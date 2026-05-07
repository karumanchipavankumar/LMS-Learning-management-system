package com.oryfolks.lms_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.oryfolks.lms_backend.DTO.ChangePasswordRequest;
import com.oryfolks.lms_backend.DTO.CourseResponseDTO;
import com.oryfolks.lms_backend.service.CourseService;
import com.oryfolks.lms_backend.service.UserService;

@RestController
@RequestMapping("/employee")
@PreAuthorize("hasAuthority('EMPLOYEE')")
@Validated
public class EmployeeController {

    @Autowired
    private UserService userService;

    @Autowired
    private CourseService courseService;

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        
        try {
            userService.changeUserPassword(auth.getName(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(java.util.Map.of("message", "Password successfully updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("courses/my")
    public ResponseEntity<List<CourseResponseDTO>> getMyCourses() {
        return ResponseEntity.ok(courseService.getMyCourses());
    }

    @GetMapping("courses/all")
    public ResponseEntity<List<CourseResponseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("courses/{id}")
    public ResponseEntity<CourseResponseDTO> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PostMapping("/courses/{id}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable Long id, @RequestParam int progress,
            @RequestParam(required = false) Double lastWatchedTimestamp) {
        courseService.updateCourseProgress(id, progress, lastWatchedTimestamp);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile() {
        // Get username from security context or simple workaround if needed
        // Assuming SecurityContextHolder is working, but simpler to use Authentication
        // principal
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return ResponseEntity.ok(userService.getProfile(auth.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfile(@RequestBody @Valid com.oryfolks.lms_backend.entity.UserProfile updatedProfile) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return ResponseEntity.ok(userService.updateProfile(auth.getName(), updatedProfile));
    }

    @PostMapping("/enroll/{courseId}")
    public ResponseEntity<?> requestEnrollment(@PathVariable Long courseId) {
        courseService.requestEnrollment(courseId);
        return ResponseEntity.ok("Enrollment request sent successfully");
    }

    @GetMapping("/enrollments/history")
    public ResponseEntity<List<com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO>> getEnrollmentHistory() {
        return ResponseEntity.ok(courseService.getEnrollmentHistory());
    }

    @PostMapping("/courses/content/{contentId}/complete")
    public ResponseEntity<?> markContentAsCompleted(@PathVariable Long contentId) {
        courseService.markContentAsCompleted(contentId);
        return ResponseEntity.ok("Content marked as completed");
    }
}
