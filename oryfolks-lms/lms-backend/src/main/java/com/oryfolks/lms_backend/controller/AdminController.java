package com.oryfolks.lms_backend.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.oryfolks.lms_backend.DTO.AddUserForm;
import com.oryfolks.lms_backend.DTO.AssignedCourseDTO;
import com.oryfolks.lms_backend.DTO.UserManagementDTO;
import com.oryfolks.lms_backend.repository.CourseRepository;
import com.oryfolks.lms_backend.repository.EmployeeCourseRepository;
import com.oryfolks.lms_backend.service.AdminUserService;
import com.oryfolks.lms_backend.service.UserService;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ADMIN')")

public class AdminController {

        @Autowired
        private UserService userService;
        @Autowired
        private AdminUserService adminService;
        @Autowired
        private CourseRepository courseRepository;
        @Autowired
        private EmployeeCourseRepository employeeCourseRepository;
        @Autowired
        private com.oryfolks.lms_backend.repository.UserProfileRepository userProfileRepository;
        @Autowired
        private com.oryfolks.lms_backend.repository.UserRepository userRepository;
        @Autowired
        private com.oryfolks.lms_backend.service.ManagerServiceImpl managerService;

        @PostMapping("/add-user")
        public ResponseEntity<?> addUser(@RequestBody @Valid AddUserForm user) {
                userService.addUser(user);
                return ResponseEntity.ok("User created successfully");
        }

        @GetMapping("/users")
        public List<UserManagementDTO> getAllUsers() {
                return adminService.getAllUsers();
        }

        @DeleteMapping("/users/{id}")
        public void deleteUser(@PathVariable Long id) {
                adminService.deleteUser(id);
        }

        @GetMapping("/dashboard/summary")
        public ResponseEntity<?> getDashboardSummary() {
                try {
                        System.out.println("AdminController: getDashboardSummary called");
                        long publishedCount = courseRepository.count();
                        long assignedCount = employeeCourseRepository.countDistinctCoursesAssigned();
                        long pendingCount = publishedCount - assignedCount;

                        List<com.oryfolks.lms_backend.entity.EmployeeCourse> recentAssignments = employeeCourseRepository
                                        .findAllByOrderByIdDesc();

                        List<com.oryfolks.lms_backend.DTO.RecentAssignmentDTO> recentDTOs = recentAssignments.stream()
                                        .map(this::mapToRecentAssignmentDTO)
                                        .filter(dto -> dto != null && dto.getEmployeeName() != null && !dto.getEmployeeName().trim().isEmpty())
                                        .limit(6)
                                        .collect(java.util.stream.Collectors.toList());

                        long totalMembersCount = userRepository.countByRoleNot("ADMIN");
                        
                        List<com.oryfolks.lms_backend.entity.EmployeeCourse> allAssignments = employeeCourseRepository.findAll();
                        int averageCompletionRate = 0;
                        if (!allAssignments.isEmpty()) {
                                double totalProgress = allAssignments.stream()
                                        .mapToDouble(ec -> ec != null ? ec.getProgress() : 0)
                                        .sum();
                                averageCompletionRate = (int) Math.round(totalProgress / allAssignments.size());
                        }

                        System.out.println("DEBUG Dashboard Stats - published: " + publishedCount 
                                        + ", assigned: " + assignedCount 
                                        + ", totalMembers: " + totalMembersCount 
                                        + ", avgCompletion: " + averageCompletionRate);

                        com.oryfolks.lms_backend.DTO.DashboardSummaryResponse response = new com.oryfolks.lms_backend.DTO.DashboardSummaryResponse(
                                        publishedCount,
                                        assignedCount,
                                        pendingCount,
                                        totalMembersCount,
                                        averageCompletionRate,
                                        recentDTOs);

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        System.err.println("Error in getDashboardSummary: " + e.getMessage());
                        e.printStackTrace();
                        return ResponseEntity.internalServerError().body("Error fetching dashboard data: " + e.getMessage());
                }
        }

        @GetMapping("/dashboard/recent-assignments")
        public ResponseEntity<List<com.oryfolks.lms_backend.DTO.RecentAssignmentDTO>> getAllRecentAssignments() {
                System.out.println("AdminController: getAllRecentAssignments called");
                List<com.oryfolks.lms_backend.entity.EmployeeCourse> allRecent = employeeCourseRepository
                                .findAllByOrderByIdDesc();

                List<com.oryfolks.lms_backend.DTO.RecentAssignmentDTO> dtos = allRecent.stream()
                                .map(this::mapToRecentAssignmentDTO)
                                .filter(dto -> dto != null && dto.getEmployeeName() != null && !dto.getEmployeeName().trim().isEmpty())
                                .collect(java.util.stream.Collectors.toList());

                return ResponseEntity.ok(dtos);
        }

        private com.oryfolks.lms_backend.DTO.RecentAssignmentDTO mapToRecentAssignmentDTO(
                        com.oryfolks.lms_backend.entity.EmployeeCourse ec) {
                Long courseId = ec.getCourseId();
                if (courseId == null)
                        return null;

                com.oryfolks.lms_backend.entity.Course course = courseRepository
                                .findById(courseId)
                                .orElse(new com.oryfolks.lms_backend.entity.Course());

                // Fetch User Profile for name
                com.oryfolks.lms_backend.entity.UserProfile profile = userProfileRepository
                                .findByUserId(ec.getEmployeeId())
                                .orElse(null);

                if (profile == null) {
                        return null; // Exclude if no employee profile exists
                }

                String firstName = profile.getFirstName() != null ? profile.getFirstName().trim() : "";
                String lastName = profile.getLastName() != null ? profile.getLastName().trim() : "";
                
                if (firstName.equalsIgnoreCase("null")) firstName = "";
                if (lastName.equalsIgnoreCase("null")) lastName = "";

                String employeeName = (firstName + " " + lastName).trim();

                if (employeeName.isEmpty() || employeeName.equals("-")) {
                        return null; // Exclude if employee name is entirely blank or just a dash
                }

                return new com.oryfolks.lms_backend.DTO.RecentAssignmentDTO(
                                ec.getCourseId(),
                                course.getTitle(),
                                employeeName);
        }

        @GetMapping("/assigned-courses")
        public ResponseEntity<List<com.oryfolks.lms_backend.DTO.AssignedCourseDTO>> getAllAssignedCourses() {
                System.out.println("AdminController: getAllAssignedCourses called");
                List<com.oryfolks.lms_backend.DTO.AssignedCourseDTO> dtos = courseRepository
                                .findCoursesWithAssignments().stream()
                                .map(course -> AssignedCourseDTO.builder()
                                                .courseId(course.getId())
                                                .courseName(course.getTitle())
                                                .employeeName("-") // Placeholder as requested originally
                                                .assignedDate(null)
                                                .status("ASSIGNED")
                                                .assignedEmployeeCount(employeeCourseRepository
                                                                .countByCourseId(course.getId()))
                                                .createdDate(course.getCreatedDate())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());
                return ResponseEntity.ok(dtos);
        }

        @GetMapping("/pending-courses")
        public ResponseEntity<List<com.oryfolks.lms_backend.DTO.AssignedCourseDTO>> getPendingCourses() {
                System.out.println("AdminController: getPendingCourses called");
                List<com.oryfolks.lms_backend.DTO.AssignedCourseDTO> dtos = courseRepository
                                .findCoursesWithoutAssignments().stream()
                                .map(course -> AssignedCourseDTO.builder()
                                                .courseId(course.getId())
                                                .courseName(course.getTitle())
                                                .employeeName("-")
                                                .assignedDate(null)
                                                .status("UNASSIGNED")
                                                .createdDate(course.getCreatedDate())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());
                return ResponseEntity.ok(dtos);
        }

        @PostMapping("/seed-enrollments")
        public ResponseEntity<?> seedEnrollments() {
                managerService.seedEnrollments();
                return ResponseEntity.ok("Seeding complete");
        }
}
