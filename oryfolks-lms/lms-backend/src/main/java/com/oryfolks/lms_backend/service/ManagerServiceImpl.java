package com.oryfolks.lms_backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.oryfolks.lms_backend.DTO.AssignCourseRequest;
import com.oryfolks.lms_backend.DTO.AssignedCourseDTO;
import com.oryfolks.lms_backend.DTO.TeamMemberDTO;
import com.oryfolks.lms_backend.entity.EmployeeCourse;
import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.repository.CourseRepository;
import com.oryfolks.lms_backend.repository.EmployeeCourseRepository;
import com.oryfolks.lms_backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ManagerServiceImpl {

    private final UserRepository userRepository;
    private final EmployeeCourseRepository employeeCourseRepository;
    private final CourseRepository courseRepository;
    private final com.oryfolks.lms_backend.repository.CourseEnrollmentRepository courseEnrollmentRepository;
    private final EmailService emailService;

    public void sendAssignmentReminder(Long courseId, Long employeeId) {
        if (courseId == null || employeeId == null) {
            throw new IllegalArgumentException("Course ID and Employee ID cannot be null");
        }
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        com.oryfolks.lms_backend.entity.Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        EmployeeCourse ec = employeeCourseRepository.findByEmployeeIdAndCourseId(employeeId, courseId)
                .orElseThrow(() -> new RuntimeException("Course not assigned to this employee"));

        // Resolve Email
        String emailToUse = employee.getUsername() + "@oryfolks.com"; // Fallback
        if (employee.getProfile() != null && employee.getProfile().getEmail() != null
                && !employee.getProfile().getEmail().isEmpty()) {
            emailToUse = employee.getProfile().getEmail();
        }

        // Resolve Name
        String employeeName = employee.getUsername();
        if (employee.getProfile() != null && employee.getProfile().getFirstName() != null) {
            employeeName = employee.getProfile().getFirstName();
        }

        emailService.sendCourseReminder(emailToUse, employeeName, course.getTitle(), ec.getDeadline(),
                ec.getProgress());

        // Update flag
        ec.setReminderSent(true);
        employeeCourseRepository.save(ec);
    }

    public List<TeamMemberDTO> getMyTeam() {

        List<User> employees = userRepository.findByRole("EMPLOYEE");
        List<TeamMemberDTO> result = new ArrayList<>();

        for (User employee : employees) {

            // employee.getId() is non-null (JPA guarantee)
            List<EmployeeCourse> employeeCourses = employeeCourseRepository.findByEmployeeId(employee.getId());

            List<AssignedCourseDTO> assignedCourses = new ArrayList<>();

            for (EmployeeCourse ec : employeeCourses) {

                Long courseId = ec.getCourseId();
                if (courseId != null) {
                    courseRepository.findById(courseId)
                            .ifPresent(course -> assignedCourses.add(
                                    AssignedCourseDTO.builder()
                                            .courseId(course.getId())
                                            .courseName(course.getTitle())
                                            .progress(ec.getProgress())
                                            .deadline(ec.getDeadline())
                                            .status(ec.getStatus())
                                            .thumbnailUrl(course.getThumbnailUrl())
                                            .category(course.getCategory())
                                            .duration(course.getDuration())
                                            .enrollmentType(ec.getEnrollmentType())
                                            .reminderSent(ec.isReminderSent())
                                            .build()));
                }
            }

            String name = employee.getUsername();
            String email = employee.getUsername() + "@oryfolks.com";

            if (employee.getProfile() != null) {
                String first = employee.getProfile().getFirstName();
                String last = employee.getProfile().getLastName();
                if (first != null || last != null) {
                    name = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
                }
                if (employee.getProfile().getEmail() != null) {
                    email = employee.getProfile().getEmail();
                }
            }

            result.add(
                    new TeamMemberDTO(
                            employee.getId(),
                            name,
                            email,
                            assignedCourses));
        }

        return result;
    }

    @Transactional
    public void assignCourseToEmployees(AssignCourseRequest request) {

        for (Long employeeId : request.getEmployeeIds()) {

            boolean alreadyAssigned = employeeCourseRepository
                    .findByEmployeeIdAndCourseId(employeeId, request.getCourseId())
                    .isPresent();

            if (alreadyAssigned) {
                continue; // skip duplicates safely
            }

            EmployeeCourse ec = new EmployeeCourse();
            ec.setEmployeeId(employeeId);
            ec.setCourseId(request.getCourseId());
            ec.setDeadline(request.getDeadline());
            ec.setProgress(0);
            ec.setStatus("NOT_STARTED");
            ec.setEnrollmentType(
                    request.getEnrollmentType() != null ? request.getEnrollmentType() : "MANUAL_ASSIGNMENT");

            employeeCourseRepository.save(ec);
        }
    }

    @Transactional
    public void unassignCourse(Long courseId, Long employeeId) {
        employeeCourseRepository.deleteByEmployeeIdAndCourseId(employeeId, courseId);
    }

    public List<com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO> getEnrollments(String status) {
        List<com.oryfolks.lms_backend.entity.CourseEnrollment> enrollments;

        if (status == null || "ALL".equalsIgnoreCase(status)) {
            enrollments = courseEnrollmentRepository.findAll();
        } else {
            enrollments = courseEnrollmentRepository.findByStatus(status.toUpperCase());
        }

        List<com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO> dtos = new ArrayList<>();

        for (com.oryfolks.lms_backend.entity.CourseEnrollment enrollment : enrollments) {
            String courseName = "Unknown Course";
            String category = "Unknown";
            String employeeName = "Unknown Employee";

            com.oryfolks.lms_backend.entity.Course course = null;
            Long cId = enrollment.getCourseId();
            if (cId != null) {
                course = courseRepository.findById(cId).orElse(null);
            }
            if (course != null) {
                courseName = course.getTitle();
                category = course.getCategory();
            }

            User employee = null;
            Long eId = enrollment.getEmployeeId();
            if (eId != null) {
                employee = userRepository.findById(eId).orElse(null);
            }
            if (employee != null) {
                if (employee.getProfile() != null && employee.getProfile().getFirstName() != null) {
                    employeeName = (employee.getProfile().getFirstName() + " "
                            + (employee.getProfile().getLastName() != null ? employee.getProfile().getLastName() : ""))
                            .trim();
                } else {
                    employeeName = employee.getUsername();
                }
            }

            dtos.add(new com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO(
                    enrollment.getId(),
                    enrollment.getCourseId(),
                    courseName,
                    category,
                    enrollment.getEmployeeId(),
                    employeeName,
                    enrollment.getStatus(),
                    enrollment.getRequestDate(),
                    enrollment.getResponseDate(),
                    course != null ? course.getThumbnailUrl() : null,
                    course != null ? course.getDuration() : "N/A",
                    course != null ? course.getDescription() : "No description"));
        }
        return dtos;
    }

    @Transactional
    public void approveEnrollment(Long enrollmentId) {
        if (enrollmentId == null) {
            throw new IllegalArgumentException("Enrollment ID cannot be null");
        }
        com.oryfolks.lms_backend.entity.CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!"PENDING".equals(enrollment.getStatus())) {
            throw new RuntimeException("Enrollment is not pending");
        }

        enrollment.setStatus("APPROVED");
        enrollment.setResponseDate(java.time.LocalDateTime.now());
        courseEnrollmentRepository.save(enrollment);

        // Create EmployeeCourse record
        AssignCourseRequest request = new AssignCourseRequest();
        request.setCourseId(enrollment.getCourseId());
        request.setEmployeeIds(List.of(enrollment.getEmployeeId()));
        request.setDeadline(java.time.LocalDate.now().plusDays(30)); // Default 30 days deadline
        request.setEnrollmentType("SELF_ENROLLMENT");

        assignCourseToEmployees(request);
    }

    public void rejectEnrollment(Long enrollmentId) {
        if (enrollmentId == null) {
            throw new IllegalArgumentException("Enrollment ID cannot be null");
        }
        com.oryfolks.lms_backend.entity.CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!"PENDING".equals(enrollment.getStatus())) {
            throw new RuntimeException("Enrollment is not pending");
        }

        enrollment.setStatus("REJECTED");
        enrollment.setResponseDate(java.time.LocalDateTime.now());
        courseEnrollmentRepository.save(enrollment);
    }

    public void seedEnrollments() {
        // Dummy data
        long[] empIds = { 2L, 3L }; // Assuming these exist
        long[] courseIds = { 1L, 2L };

        for (int i = 0; i < 2; i++) {
            com.oryfolks.lms_backend.entity.CourseEnrollment ce = new com.oryfolks.lms_backend.entity.CourseEnrollment();
            ce.setEmployeeId(empIds[i]);
            ce.setCourseId(courseIds[i]);
            ce.setStatus("PENDING");
            courseEnrollmentRepository.save(ce);
        }
    }
}
