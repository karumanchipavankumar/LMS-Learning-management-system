package com.oryfolks.lms_backend.DTO;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseRequestDTO {

    @NotBlank(message = "Course title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotBlank(message = "Duration is required")
    @Pattern(regexp = "^[0-9]+.*$", message = "Duration must start with a positive number")
    private String duration;

    @NotBlank(message = "Course contents are required")
    @Size(min = 10, message = "Contents must be at least 10 characters long")
    private String contents;
}
