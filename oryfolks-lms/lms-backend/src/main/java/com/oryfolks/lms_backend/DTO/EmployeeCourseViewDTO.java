package com.oryfolks.lms_backend.DTO;

import java.time.LocalDateTime;

public class EmployeeCourseViewDTO {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private boolean assigned;
    private long totalStudents;

    public EmployeeCourseViewDTO(Long id,
                                 String title,
                                 String description,
                                 LocalDateTime createdAt,
                                 boolean assigned,
                                 long totalStudents) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.createdAt = createdAt;
        this.assigned = assigned;
        this.totalStudents = totalStudents;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isAssigned() { return assigned; }
    public long getTotalStudents() { return totalStudents; }
}
