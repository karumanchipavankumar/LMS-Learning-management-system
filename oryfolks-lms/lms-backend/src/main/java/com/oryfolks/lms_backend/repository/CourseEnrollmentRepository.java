package com.oryfolks.lms_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oryfolks.lms_backend.entity.CourseEnrollment;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    List<CourseEnrollment> findByStatus(String status);

    List<CourseEnrollment> findByEmployeeId(Long employeeId);

    java.util.Optional<CourseEnrollment> findByEmployeeIdAndCourseId(Long employeeId, Long courseId);

    void deleteByEmployeeId(Long employeeId);

    void deleteByCourseId(Long courseId);
}
