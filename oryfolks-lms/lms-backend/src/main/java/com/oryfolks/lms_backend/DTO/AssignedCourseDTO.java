package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AssignedCourseDTO {
    private Long courseId;
    private String courseName;
    private String employeeName;
    private LocalDate assignedDate;
    private String status;
    private int progress;
    private LocalDate deadline;
    private long assignedEmployeeCount;
    private java.time.LocalDateTime createdDate;
    private String thumbnailUrl;
    private String category;
    private String duration;
    private String enrollmentType;
    private boolean reminderSent;
}
