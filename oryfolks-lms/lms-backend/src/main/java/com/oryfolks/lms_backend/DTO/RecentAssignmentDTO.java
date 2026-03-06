package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecentAssignmentDTO {
    private Long courseId;
    private String courseName;
    private String employeeName;
    // Optional: Assigned Date if we had it, but user didn't ask for it in the chart
    // summary, only in the full page.
    // Wait, "Recently Assigned Courses Table... Table Columns: Course ID, Course
    // Name, Employee Name".
}
