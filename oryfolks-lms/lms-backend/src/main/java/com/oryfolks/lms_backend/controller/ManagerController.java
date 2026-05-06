package com.oryfolks.lms_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.oryfolks.lms_backend.DTO.AssignCourseRequest;
import com.oryfolks.lms_backend.DTO.ChangePasswordRequest;
import com.oryfolks.lms_backend.DTO.TeamMemberDTO;
import com.oryfolks.lms_backend.entity.Course;
import com.oryfolks.lms_backend.repository.CourseRepository;
import com.oryfolks.lms_backend.service.ManagerServiceImpl;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/manager")
@PreAuthorize("hasAuthority('MANAGER')")

public class ManagerController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ManagerServiceImpl managerService;

    @Autowired
    private com.oryfolks.lms_backend.service.UserService userService;

    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        System.out.println("ManagerController: getAllCourses called");
        return courseRepository.findAll();
    }

    // My Team (Employees list)
    @GetMapping("/my-team")
    public List<TeamMemberDTO> getMyTeam() {
        System.out.println("ManagerController: getMyTeam called");
        return managerService.getMyTeam();
    }

    @PostMapping("/assign-course")
    public ResponseEntity<?> assignCourse(
            @RequestBody @Valid AssignCourseRequest request) {
        System.out.println("ManagerController: assignCourse called for employeeIds: " + request.getEmployeeIds());

        managerService.assignCourseToEmployees(request);
        return ResponseEntity.ok("Course assigned successfully");
    }

    @PostMapping("/unassign-course")
    public ResponseEntity<?> unassignCourse(@RequestBody AssignCourseRequest request) {
        if (request.getCourseId() == null || request.getEmployeeIds() == null || request.getEmployeeIds().isEmpty()) {
            return ResponseEntity.badRequest().body("CourseId and EmployeeId are required");
        }
        // process first employee ID (unassign single)
        managerService.unassignCourse(request.getCourseId(), request.getEmployeeIds().get(0));
        return ResponseEntity.ok("Course unassigned successfully");
    }

    @GetMapping("/enrollments")
    public ResponseEntity<List<com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO>> getEnrollments(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(managerService.getEnrollments(status));
    }

    @PostMapping("/enrollments/{id}/approve")
    public ResponseEntity<?> approveEnrollment(@PathVariable Long id) {
        managerService.approveEnrollment(id);
        return ResponseEntity.ok("Enrollment approved");
    }

    @PostMapping("/enrollments/{id}/reject")
    public ResponseEntity<?> rejectEnrollment(@PathVariable Long id) {
        managerService.rejectEnrollment(id);
        return ResponseEntity.ok("Enrollment rejected");
    }

    @PostMapping("/send-reminder")
    public ResponseEntity<?> sendReminder(@RequestBody AssignCourseRequest request) {
        // We reuse AssignCourseRequest but expect only 1 employee ID
        if (request.getCourseId() == null || request.getEmployeeIds() == null || request.getEmployeeIds().isEmpty()) {
            return ResponseEntity.badRequest().body("CourseId and EmployeeId are required");
        }
        managerService.sendAssignmentReminder(request.getCourseId(), request.getEmployeeIds().get(0));
        return ResponseEntity.ok("Reminder sent successfully");
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile() {
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
}
