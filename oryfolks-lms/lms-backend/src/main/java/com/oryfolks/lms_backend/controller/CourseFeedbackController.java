package com.oryfolks.lms_backend.controller;

import com.oryfolks.lms_backend.DTO.CourseRatingRequestDTO;
import com.oryfolks.lms_backend.DTO.CourseRatingResponseDTO;
import com.oryfolks.lms_backend.DTO.CourseReviewResponseDTO;
import com.oryfolks.lms_backend.entity.CourseRating;
import com.oryfolks.lms_backend.service.CourseFeedbackService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee/course-feedback")
@PreAuthorize("hasAuthority('EMPLOYEE')")
@RequiredArgsConstructor
public class CourseFeedbackController {

    private final CourseFeedbackService courseFeedbackService;

    @GetMapping("/test")
    public String test() {
        return "Course Feedback Controller Working";
    }

    /**
     * API:
     * Submit employee rating and review.
     *
     * Endpoint:
     * POST /api/course-feedback/submit/{userId}
     */
    @PostMapping("/submit/{userId}")
    public ResponseEntity<String> submitRating(

            @PathVariable Long userId,

            @RequestBody CourseRatingRequestDTO requestDTO) {

        return ResponseEntity.ok(

                courseFeedbackService
                        .submitRating(
                                userId,
                                requestDTO));
    }

    /**
     * API:
     * Get course rating summary.
     *
     * Returns:
     * - average rating
     * - total ratings
     *
     * Endpoint:
     * GET /api/course-feedback/summary/{courseId}
     */
    @GetMapping("/summary/{courseId}")
    public ResponseEntity<CourseRatingResponseDTO> getCourseRatingSummary(

            @PathVariable Long courseId) {

        return ResponseEntity.ok(

                courseFeedbackService
                        .getCourseRatingSummary(
                                courseId));
    }

    /**
     * API:
     * Fetch all reviews/comments
     * of a course.
     *
     * Endpoint:
     * GET /api/course-feedback/reviews/{courseId}
     */
    @GetMapping("/reviews/{courseId}")
    public ResponseEntity<List<CourseReviewResponseDTO>> getCourseReviews(

            @PathVariable Long courseId) {

        return ResponseEntity.ok(

                courseFeedbackService
                        .getCourseReviews(
                                courseId));
    }

    /**
     * API:
     * Check whether employee
     * already rated the course.
     *
     * Used to prevent feedback
     * popup reopening after
     * course completion.
     *
     * Endpoint:
     * GET /employee/course-feedback/has-rated/{courseId}/{userId}
     */
    @GetMapping("/has-rated/{courseId}/{userId}")
    public ResponseEntity<Boolean> hasUserRatedCourse(

            @PathVariable Long courseId,

            @PathVariable Long userId) {

        return ResponseEntity.ok(

                courseFeedbackService
                        .hasUserRatedCourse(
                                courseId,
                                userId));
    }
}