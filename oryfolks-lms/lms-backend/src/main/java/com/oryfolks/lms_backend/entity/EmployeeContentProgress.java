package com.oryfolks.lms_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "employee_content_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employeeId", "contentId" })
})
public class EmployeeContentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private Long contentId;

    private boolean completed = false;
}
