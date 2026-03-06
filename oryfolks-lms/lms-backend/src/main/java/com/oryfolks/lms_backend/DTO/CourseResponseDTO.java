package com.oryfolks.lms_backend.DTO;

import java.time.LocalDateTime;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CourseResponseDTO {

    private Long id;
    private String title;
    private String category;
    private String duration;
    private String thumbnailUrl;
    private LocalDateTime createdDate;
    private Long numberOfEmployees;
    private String description;
    private int progress;
    private String videoUrl;
    private Double lastWatchedTimestamp;
    private Double rating;
    private Integer ratingCount;
    private LocalDate deadline;
    private String enrollmentType;
    private java.util.List<CourseContentDTO> contents;
}
