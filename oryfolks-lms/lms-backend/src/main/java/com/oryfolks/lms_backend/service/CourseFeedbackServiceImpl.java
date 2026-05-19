package com.oryfolks.lms_backend.service;

import com.oryfolks.lms_backend.DTO.CourseRatingRequestDTO;
import com.oryfolks.lms_backend.DTO.CourseRatingResponseDTO;
import com.oryfolks.lms_backend.DTO.CourseReviewResponseDTO;
import com.oryfolks.lms_backend.entity.Course;
import com.oryfolks.lms_backend.entity.CourseRating;
import com.oryfolks.lms_backend.entity.User;
import com.oryfolks.lms_backend.repository.CourseRatingRepository;
import com.oryfolks.lms_backend.repository.CourseRepository;
import com.oryfolks.lms_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseFeedbackServiceImpl
        implements CourseFeedbackService {

    private final CourseRatingRepository courseRatingRepository;

    private final CourseRepository courseRepository;

    private final UserRepository userRepository;

    /**
     * Submit employee rating and review.
     *
     * Validation:
     * - course should exist
     * - user should exist
     * - employee can rate only once
     */
    @Override
    public String submitRating(
            Long userId,
            CourseRatingRequestDTO requestDTO) {

        // Check duplicate rating

        boolean alreadyRated = courseRatingRepository
                .existsByCourse_IdAndUser_Id(
                        requestDTO.getCourseId(),
                        userId);

        if (alreadyRated) {

            return "You have already rated this course";
        }

        // Fetch course

        Course course = courseRepository.findById(
                requestDTO.getCourseId())
                .orElseThrow(() -> new RuntimeException(
                        "Course not found"));

        // Fetch user

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                        "User not found"));

        // Create new rating object

        CourseRating courseRating = new CourseRating();

        // Set course

        courseRating.setCourse(course);

        // Set user

        courseRating.setUser(user);

        // Set rating value

        courseRating.setRating(
                requestDTO.getRating());

        // Set review/comment

        courseRating.setReview(
                requestDTO.getReview());

        // Save into database

        courseRatingRepository.save(courseRating);

        return "Course rating submitted successfully";
    }

    /**
     * Get course average rating
     * and total ratings.
     */
    @Override
    public CourseRatingResponseDTO getCourseRatingSummary(Long courseId) {

        Double averageRating = courseRatingRepository
                .getAverageRating(courseId);

        Long totalRatings = courseRatingRepository
                .getRatingCount(courseId);

        return new CourseRatingResponseDTO(

                averageRating != null
                        ? averageRating
                        : 0.0,

                totalRatings != null
                        ? totalRatings
                        : 0L);
    }

    /**
     * Fetch all course reviews.
     *
     * Used in:
     * Course details page
     * under video section.
     */
    /**
     * Fetch all employee reviews
     * for a course.
     */
    @Override
    public List<CourseReviewResponseDTO> getCourseReviews(
            Long courseId) {

        List<CourseRating> ratings = courseRatingRepository
                .findByCourse_Id(courseId);

        return ratings.stream()

                .map(rating -> new CourseReviewResponseDTO(

                        // Rating table ID
                        rating.getId(),

                        // Employee rating
                        rating.getRating(),

                        // Employee review/comment
                        rating.getReview(),

                        // Course ID
                        rating.getCourse().getId(),

                        // Employee/User ID
                        rating.getUser().getId(),

                        // Employee username
                        rating.getUser().getUsername(),

                        // Review submitted date
                        rating.getCreatedDate()))

                .toList();
    }

    /**
     * Check whether employee already
     * submitted feedback for course.
     *
     * This method is used before
     * opening the rating popup.
     *
     * If employee already rated:
     * popup should not reopen.
     */
    @Override
    public boolean hasUserRatedCourse(
            Long courseId,
            Long userId) {

        return courseRatingRepository
                .existsByCourse_IdAndUser_Id(
                        courseId,
                        userId);
    }
}