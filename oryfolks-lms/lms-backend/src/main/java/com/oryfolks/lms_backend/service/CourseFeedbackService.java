package com.oryfolks.lms_backend.service;

import com.oryfolks.lms_backend.DTO.CourseRatingRequestDTO;
import com.oryfolks.lms_backend.DTO.CourseRatingResponseDTO;
import com.oryfolks.lms_backend.DTO.CourseReviewResponseDTO;
import com.oryfolks.lms_backend.entity.CourseRating;

import java.util.List;

public interface CourseFeedbackService {

    /**
     * Submit course rating and review.
     *
     * Employee can submit only once.
     */
    String submitRating(
            Long userId,
            CourseRatingRequestDTO requestDTO);

    /**
     * Get average rating and
     * total ratings of course.
     *
     * Used in:
     * - course cards
     * - dashboards
     * - course details page
     */
    CourseRatingResponseDTO getCourseRatingSummary(Long courseId);

    /**
     * Fetch all reviews/comments
     * of a course.
     *
     * Used under course video page.
     */
    List<CourseReviewResponseDTO> getCourseReviews(Long courseId);

    /**
     * Check whether the employee
     * already submitted rating
     * for the course.
     *
     * Used to prevent popup
     * from reopening after
     * course completion.
     *
     * @param courseId course id
     * @param userId   employee/user id
     * @return true if already rated
     */
    boolean hasUserRatedCourse(
            Long courseId,
            Long userId);
}
