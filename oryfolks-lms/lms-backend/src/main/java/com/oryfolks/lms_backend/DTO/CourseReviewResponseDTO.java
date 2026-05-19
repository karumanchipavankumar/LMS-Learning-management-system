package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CourseReviewResponseDTO {

    /**
     * Rating table primary key
     */
    private Long ratingId;

    /**
     * Employee rating value
     */
    private Double rating;

    /**
     * Employee review/comment
     */
    private String review;

    /**
     * Course ID
     */
    private Long courseId;

    /**
     * Employee/User ID
     */
    private Long userId;

    /**
     * Employee username
     */
    private String username;

    /**
     * Review submitted date
     */
    private LocalDateTime createdDate;
}