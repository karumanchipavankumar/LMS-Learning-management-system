package com.oryfolks.lms_backend.DTO;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeamMemberDTO {
    private Long id;
    private String name;
    private String email;
    private List<AssignedCourseDTO> assignedCourses;
}
