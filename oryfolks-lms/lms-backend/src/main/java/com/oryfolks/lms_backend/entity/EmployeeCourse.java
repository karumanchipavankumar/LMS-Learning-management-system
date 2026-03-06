package com.oryfolks.lms_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employeeId", "courseId" })
})
public class EmployeeCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private Long courseId;

    private int progress = 0; // 0–100
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED
    private Double lastWatchedTimestamp;

    private LocalDate deadline;

    @Column(columnDefinition = "DATE DEFAULT CURRENT_DATE")
    private LocalDate assignedDate = LocalDate.now();

    private String enrollmentType = "MANUAL_ASSIGNMENT"; // MANUAL_ASSIGNMENT, SELF_ENROLLMENT
    private boolean reminderSent = false;
}
