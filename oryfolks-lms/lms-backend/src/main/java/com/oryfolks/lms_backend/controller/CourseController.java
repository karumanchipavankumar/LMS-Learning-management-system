package com.oryfolks.lms_backend.controller;

import com.oryfolks.lms_backend.DTO.CourseRequestDTO;
import com.oryfolks.lms_backend.DTO.CourseResponseDTO;
import com.oryfolks.lms_backend.service.CourseService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/courses")
@PreAuthorize("hasAuthority('ADMIN')")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCourse(
            @RequestPart("course") @Valid CourseRequestDTO course,
            @RequestPart("thumbnail") MultipartFile thumbnail,
            @RequestPart("video") MultipartFile video) {

        courseService.createCourse(course, thumbnail, video);
        return ResponseEntity.ok("Course created successfully");
    }

    @GetMapping("/all")
    public ResponseEntity<List<CourseResponseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok("Course deleted successfully");
    }
}
