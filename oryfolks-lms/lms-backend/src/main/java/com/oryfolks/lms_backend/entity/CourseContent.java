package com.oryfolks.lms_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "course_contents")
public class CourseContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private Double timestamp; // stored in seconds

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_video_id", nullable = false)
    private CourseVideo courseVideo;
}
