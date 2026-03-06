package com.oryfolks.lms_backend.repository;

import com.oryfolks.lms_backend.entity.CourseRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRatingRepository extends JpaRepository<CourseRating, Long> {
    List<CourseRating> findByCourseId(Long courseId);

    @Query("SELECT AVG(r.rating) FROM CourseRating r WHERE r.course.id = :courseId")
    Double getAverageRating(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(r) FROM CourseRating r WHERE r.course.id = :courseId")
    Long getRatingCount(@Param("courseId") Long courseId);

    void deleteByUserId(Long userId);

    void deleteByCourseId(Long courseId);
}
