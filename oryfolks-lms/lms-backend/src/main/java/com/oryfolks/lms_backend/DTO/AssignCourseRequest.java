package com.oryfolks.lms_backend.DTO;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignCourseRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotEmpty(message = "At least one employee must be selected")
    private List<Long> employeeIds;

    private LocalDate deadline;
    private String enrollmentType;
}
