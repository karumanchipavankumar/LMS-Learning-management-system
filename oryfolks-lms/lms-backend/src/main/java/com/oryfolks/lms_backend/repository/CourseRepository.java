package com.oryfolks.lms_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.oryfolks.lms_backend.entity.Course;

public interface CourseRepository
                extends JpaRepository<Course, Long> {

        @org.springframework.data.jpa.repository.Query("SELECT c FROM Course c WHERE c.id IN (SELECT DISTINCT ec.courseId FROM EmployeeCourse ec)")
        java.util.List<Course> findCoursesWithAssignments();

        @org.springframework.data.jpa.repository.Query("SELECT c FROM Course c WHERE c.id NOT IN (SELECT DISTINCT ec.courseId FROM EmployeeCourse ec)")
        java.util.List<Course> findCoursesWithoutAssignments();
}
