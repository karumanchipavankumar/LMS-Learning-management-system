package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CourseRatingResponseDTO {
    /**
     * Average rating of course.
     *
     * Example:
     * 4.5
     */
    private Double averageRating;

    /**
     * Total number of ratings.
     *
     * Example:
     * 120 ratings
     */
    private Long totalRatings;
}
