package com.oryfolks.lms_backend.repository;

import com.oryfolks.lms_backend.entity.CourseContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseContentRepository extends JpaRepository<CourseContent, Long> {
    List<CourseContent> findByCourseVideoIdOrderByTimestampAsc(Long courseVideoId);

    // Used as a guard to prevent duplicate promotion of legacy contents on every page load
    long countByCourseVideoId(Long courseVideoId);
}
