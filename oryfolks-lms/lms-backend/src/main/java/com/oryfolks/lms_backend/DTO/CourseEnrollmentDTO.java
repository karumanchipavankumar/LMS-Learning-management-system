package com.oryfolks.lms_backend.DTO;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseEnrollmentDTO {
    private Long id;
    private Long courseId;
    private String courseName;
    private String category;
    private Long employeeId;
    private String employeeName;
    private String status;
    private LocalDateTime requestDate;
    private LocalDateTime responseDate;
    private String thumbnailUrl;
    private String duration;
    private String description;
}
