package com.oryfolks.lms_backend.service;

import com.oryfolks.lms_backend.DTO.CourseRequestDTO;
import com.oryfolks.lms_backend.DTO.CourseResponseDTO;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface CourseService {

    void createCourse(CourseRequestDTO courseDTO,
            MultipartFile thumbnail,
            MultipartFile video);

    List<CourseResponseDTO> getAllCourses();

    List<CourseResponseDTO> getMyCourses();

    CourseResponseDTO getCourseById(Long courseId);

    void updateCourseProgress(Long courseId, int progress, Double lastWatchedTimestamp);

    void deleteCourse(Long id);

    void requestEnrollment(Long courseId);

    List<com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO> getEnrollmentHistory();

    void markContentAsCompleted(Long contentId);
}
