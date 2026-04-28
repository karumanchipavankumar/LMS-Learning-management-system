package com.oryfolks.lms_backend.repository;

import com.oryfolks.lms_backend.entity.CourseVideo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CourseVideoRepository extends JpaRepository<CourseVideo, Long> {

    // Fetches the video directly by its parent course ID via a proper DB query.
    // This replaces the incorrect findAll().stream().filter() pattern which caused
    // Hibernate lazy-loading to return the same cached course proxy for all videos.
    Optional<CourseVideo> findByCourseId(Long courseId);
}
