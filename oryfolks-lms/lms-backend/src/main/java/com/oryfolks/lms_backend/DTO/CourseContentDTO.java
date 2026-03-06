package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CourseContentDTO {
    private Long id;
    private String title;
    private Double timestamp;
    private boolean completed;
}
