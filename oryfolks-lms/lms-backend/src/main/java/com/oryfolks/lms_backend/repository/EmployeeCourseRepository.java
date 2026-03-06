package com.oryfolks.lms_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.oryfolks.lms_backend.entity.EmployeeCourse;

@Repository
public interface EmployeeCourseRepository
        extends JpaRepository<EmployeeCourse, Long> {
    List<EmployeeCourse> findByEmployeeId(Long employeeId);

    Optional<EmployeeCourse> findByEmployeeIdAndCourseId(Long employeeId, Long courseId);

    long countByCourseId(Long courseId);

    @Query("SELECT COUNT(DISTINCT ec.courseId) FROM EmployeeCourse ec")
    long countDistinctCoursesAssigned();

    long countByStatus(String status);

    List<EmployeeCourse> findTop6ByOrderByIdDesc();

    List<EmployeeCourse> findAllByOrderByIdDesc();

    List<EmployeeCourse> findByStatus(String status);

    void deleteByCourseId(Long courseId);

    void deleteByEmployeeId(Long employeeId);

    void deleteByEmployeeIdAndCourseId(Long employeeId, Long courseId);
}
