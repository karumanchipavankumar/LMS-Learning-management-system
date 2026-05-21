package com.oryfolks.lms_backend.controller;

import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.service.ManagerServiceImpl;
import com.oryfolks.lms_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/manager")
@PreAuthorize("hasAuthority('MANAGER')")
public class ManagerController {

    @Autowired
    private ManagerServiceImpl managerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.oryfolks.lms_backend.service.CourseService courseService;

    @Autowired
    private com.oryfolks.lms_backend.service.UserService userService;

    @GetMapping("/unread-counts")
    public ResponseEntity<?> getUnreadCounts(Authentication auth) {
        User manager = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return ResponseEntity.ok(managerService.getUnreadCounts(manager.getId()));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        return ResponseEntity.ok(userService.getProfile(auth.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody com.oryfolks.lms_backend.entity.UserProfile updatedProfile) {
        return ResponseEntity.ok(userService.updateProfile(auth.getName(), updatedProfile));
    }

    @GetMapping("/my-team")
    public ResponseEntity<?> getMyTeam() {
        return ResponseEntity.ok(managerService.getMyTeam());
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PostMapping("/assign-course")
    public ResponseEntity<?> assignCourse(@RequestBody com.oryfolks.lms_backend.DTO.AssignCourseRequest request) {
        managerService.assignCourseToEmployees(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unassign-course")
    public ResponseEntity<?> unassignCourse(@RequestBody java.util.Map<String, Long> payload) {
        Long courseId = payload.get("courseId");
        Long employeeId = payload.get("employeeId");
        managerService.unassignCourse(courseId, employeeId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-reminder")
    public ResponseEntity<?> sendReminder(@RequestBody java.util.Map<String, Long> payload) {
        Long courseId = payload.get("courseId");
        Long employeeId = payload.get("employeeId");
        managerService.sendAssignmentReminder(courseId, employeeId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/enrollments")
    public ResponseEntity<?> getEnrollments(@RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(managerService.getEnrollments(status));
    }

    @PutMapping("/enrollments/{id}/{action}")
    public ResponseEntity<?> processEnrollment(@PathVariable Long id, @PathVariable String action) {
        if ("approve".equalsIgnoreCase(action)) {
            managerService.approveEnrollment(id);
        } else if ("reject".equalsIgnoreCase(action)) {
            managerService.rejectEnrollment(id);
        } else {
            return ResponseEntity.badRequest().body("Invalid action");
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/team/mark-all-viewed")
    public ResponseEntity<?> markAllTeamViewed() {
        managerService.markAllTeamAsViewed();
        return ResponseEntity.ok().build();
    }

    @PutMapping("/team/{id}/mark-viewed")
    public ResponseEntity<?> markTeamMemberViewed(@PathVariable Long id) {
        managerService.markTeamMemberAsViewed(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/enrollments/mark-all-viewed")
    public ResponseEntity<?> markAllEnrollmentsViewed() {
        managerService.markAllEnrollmentsAsViewed();
        return ResponseEntity.ok().build();
    }
}
