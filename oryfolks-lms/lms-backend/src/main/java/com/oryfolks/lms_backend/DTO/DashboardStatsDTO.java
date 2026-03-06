package com.oryfolks.lms_backend.DTO;

public class DashboardStatsDTO {

    private long totalEmployees;
    private long totalCourses;
    private long assignedCourses;

    public DashboardStatsDTO(long totalEmployees, long totalCourses, long assignedCourses) {
        this.totalEmployees = totalEmployees;
        this.totalCourses = totalCourses;
        this.assignedCourses = assignedCourses;
    }

    public long getTotalEmployees() {
        return totalEmployees;
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public long getAssignedCourses() {
        return assignedCourses;
    }
}
