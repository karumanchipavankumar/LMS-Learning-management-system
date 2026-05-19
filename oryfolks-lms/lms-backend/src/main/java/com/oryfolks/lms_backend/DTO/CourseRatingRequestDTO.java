package com.oryfolks.lms_backend.DTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseRatingRequestDTO {

    /**
     * ID of the course
     * for which employee
     * is submitting rating.
     *
     * Validation:
     * - cannot be null
     * - must be positive
     */
    @NotNull(message = "Course ID is required")
    @Positive(message = "Course ID must be positive")
    private Long courseId;

    /**
     * Employee rating value.
     *
     * Allowed values:
     * 1 to 5
     *
     * Validation:
     * - cannot be null
     * - minimum value = 1
     * - maximum value = 5
     */
    @NotNull(message = "Rating is required")
    @DecimalMin(value = "1.0", message = "Rating must be at least 1.0")

    @DecimalMax(value = "5.0", message = "Rating must not exceed 5.0")
    private Double rating;

    /**
     * Optional employee review/comment
     * about the course.
     *
     * Example:
     * "Very useful course"
     *
     * This field is optional.
     */
    private String review;
}
